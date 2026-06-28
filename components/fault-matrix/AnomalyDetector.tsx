import React, { useState, useEffect } from 'react';
import { MCPResource, AnomalyLog } from './types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Database, Radio, Cpu, Bell, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

interface AnomalyDetectorProps {
  onAppendLedger: (eventType: string, action: string, memo: string, agentId?: string) => void;
  onStateUpdate: (resourceName: string, value: number, unit: string) => void;
  onTriggerRealtimeNotification: (title: string, message: string, payload: object) => void;
}

export default function AnomalyDetector({ onAppendLedger, onStateUpdate, onTriggerRealtimeNotification }: AnomalyDetectorProps) {
  const [resources, setResources] = useState<MCPResource[]>([
    {
      id: "RES-001",
      name: "Active CPU Core Temperature",
      type: "sensor",
      value: 48.2,
      unit: "°C",
      threshold: 82.0,
      lastUpdated: new Date().toISOString(),
      history: [46, 48, 47, 49, 48, 47, 49, 48, 48, 49],
      state: "healthy"
    },
    {
      id: "RES-002",
      name: "Solana Sync Database Write Latency",
      type: "database",
      value: 122.5,
      unit: "ms",
      threshold: 250.0,
      lastUpdated: new Date().toISOString(),
      history: [120, 125, 122, 124, 121, 123, 119, 122, 125, 122],
      state: "healthy"
    },
    {
      id: "RES-003",
      name: "Semantic Vector Similarity Drift",
      type: "context",
      value: 24.1,
      unit: "mRad",
      threshold: 75.0,
      lastUpdated: new Date().toISOString(),
      history: [24, 25, 23, 25, 24, 26, 23, 24, 25, 24],
      state: "healthy"
    },
    {
      id: "RES-004",
      name: "Probabilistic Token Gen Variance",
      type: "model",
      value: 14.2,
      unit: "tps²",
      threshold: 45.0,
      lastUpdated: new Date().toISOString(),
      history: [14, 15, 13, 15, 14, 16, 13, 14, 15, 14],
      state: "healthy"
    }
  ]);

  const [activeResId, setActiveResId] = useState<string>("RES-003");
  const [anomalies, setAnomalies] = useState<AnomalyLog[]>([]);
  const [alpha, setAlpha] = useState<number>(0.05);
  
  // Noise Injector values
  const [injectedNoise, setInjectedNoise] = useState<Record<string, number>>({
    "RES-001": 0,
    "RES-002": 0,
    "RES-003": 0,
    "RES-004": 0,
  });

  // F-Distribution plotting states
  const [fStat, setFStat] = useState<number>(1.05);
  const [fCritical, setFCritical] = useState<number>(3.18); // df1 = 9, df2 = 9 for 10 samples
  const [pValue, setPValue] = useState<number>(0.48);

  // F-Distribution Filter States
  const [fFilter, setFFilter] = useState<'all' | 'moderate' | 'severe' | 'extreme' | 'custom'>('all');
  const [customRangeMin, setCustomRangeMin] = useState<number>(1.0);
  const [customRangeMax, setCustomRangeMax] = useState<number>(15.0);

  const getFDistributionPlotData = () => {
    // Generate approximate F-distribution probability density curve (df1=9, df2=9)
    const points = [];
    const step = 0.15;
    for (let x = 0.05; x < 6.5; x += step) {
      // Approximate shape of F-distribution with peaks near 1.0
      // f(x) = C * x^(d1/2 - 1) / (d2 + d1*x)^((d1+d2)/2)
      const d1 = 9;
      const d2 = 9;
      const numerator = Math.pow(x, (d1 / 2) - 1);
      const denominator = Math.pow(d2 + d1 * x, (d1 + d2) / 2);
      const density = (1000 * numerator) / denominator;
      
      points.push({
        x: parseFloat(x.toFixed(2)),
        density: parseFloat(density.toFixed(3)),
        isRejection: x >= fCritical
      });
    }
    return points;
  };

  const calculateFTestAndNotify = () => {
    // Perform variance calculation
    const currentRes = resources.find(r => r.id === activeResId);
    if (!currentRes) return;

    const samples = currentRes.history;
    const n = samples.length;
    if (n < 2) return;

    // Standard deviation is based on samples
    const mean = samples.reduce((acc, v) => acc + v, 0) / n;
    const variance = samples.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);

    // Baseline stats - we take stable histories (variance around ~1.5)
    const baselineVariance = 1.62; 

    // Compute F-Ratio
    const computedF = variance / baselineVariance;
    setFStat(parseFloat(computedF.toFixed(3)));

    // Calculate critical value based on alpha
    const criticalF = alpha === 0.05 ? 3.18 : 5.35; // df1=9, df2=9
    setFCritical(criticalF);

    // Approximate p-value logic for curve
    let computedP = 1 / (1 + Math.exp(2 * (computedF - 1)));
    if (computedF < 1) computedP = 1 - computedP;
    setPValue(parseFloat(computedP.toFixed(3)));

    const isAnomalous = computedF > criticalF;
    const nextState = isAnomalous ? "anomaly" : computedF > (criticalF * 0.7) ? "warning" : "healthy";

    // Update active resource state ONLY if the state actually changed to prevent infinite loops from reference updates
    if (currentRes.state !== nextState) {
      setResources(prev =>
        prev.map(res => {
          if (res.id === activeResId) {
            return {
              ...res,
              state: nextState
            };
          }
          return res;
        })
      );
    }

    // If statistical threshold is breached, register anomaly
    if (isAnomalous && !anomalies.some(a => a.resourceId === activeResId && (Date.now() - new Date(a.timestamp).getTime() < 12000))) {
      triggerAnomalyEvent(currentRes, computedF, criticalF, computedP);
    }
  };

  const triggerAnomalyEvent = (res: MCPResource, fVal: number, critVal: number, pVal: number) => {
    const id = `ANM-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const desc = `Hypothesis rejected at alpha = ${alpha}. Variance ratio F=${fVal.toFixed(2)} exceeds critical bound F_crit=${critVal.toFixed(2)}. Suggests systemic drift or vector smuggle trace.`;
    
    const newAnom: AnomalyLog = {
      id,
      timestamp: new Date().toISOString(),
      resourceId: res.id,
      resourceName: res.name,
      testStatF: fVal,
      criticalValueF: critVal,
      pValue: pVal,
      description: desc,
      severity: 'critical',
      automatedResponseTriggered: true
    };

    setAnomalies(prev => [newAnom, ...prev].slice(0, 15));

    onAppendLedger(
      'AUTHORITY',
      `F-Distribution Anomaly Detected: ${res.name}`,
      `Rejected stable schema hypothesis. Anomaly ID ${id} logged containing p-value: ${pVal}. Systemic quarantine is active.`
    );

    onTriggerRealtimeNotification(
      `🚨 Anomaly: ${res.name}`,
      `Statistical variance breach detected. F-Ratio = ${fVal.toFixed(2)} (Limit: ${critVal.toFixed(2)}).`,
      {
        resource: res.name,
        type: res.type,
        f_statistic: fVal,
        p_value: pVal,
        action: "Spun up emergency ledger constraints"
      }
    );
  };

  // Simulate continuous real-time data feeding with custom noise
  useEffect(() => {
    const timer = setInterval(() => {
      setResources(prev =>
        prev.map(res => {
          const noiseLevel = injectedNoise[res.id] || 0;
          let baseVal = res.value;

          // Standard baseline variations
          if (res.id === "RES-001") baseVal = 47 + Math.random() * 2;
          else if (res.id === "RES-002") baseVal = 118 + Math.random() * 8;
          else if (res.id === "RES-003") baseVal = 23 + Math.random() * 3;
          else if (res.id === "RES-004") baseVal = 13 + Math.random() * 2;

          // Inject user-defined noise directly to variance
          const driftVal = baseVal + (noiseLevel > 0 ? (Math.random() - 0.5) * noiseLevel * 10 : 0);
          
          let nextHistory = [...res.history, driftVal];
          if (nextHistory.length > 10) nextHistory.shift();

          return {
            ...res,
            value: parseFloat(driftVal.toFixed(1)),
            history: nextHistory
          };
        })
      );
    }, 1200);

    return () => clearInterval(timer);
  }, [injectedNoise]);

  // Triggers recalculations when resources history or parameters change
  useEffect(() => {
    calculateFTestAndNotify();
  }, [resources, alpha, activeResId]);

  const handleNoiseChange = (resId: string, val: number) => {
    setInjectedNoise(prev => ({
      ...prev,
      [resId]: val
    }));
    if (val > 3) {
      onAppendLedger(
        'AUTHORITY', 
        `Injected target disturbance parameters`, 
        `Stimulating stochastic variance on ${resources.find(r => r.id === resId)?.name}`
      );
    }
  };

  const getResourceIcon = (type: MCPResource['type'], state: MCPResource['state']) => {
    let colorClass = "text-cyan-400";
    if (state === "warning") colorClass = "text-amber-400 animate-pulse";
    else if (state === "anomaly") colorClass = "text-red-500 animate-flash";

    switch (type) {
      case 'sensor': return <Flame className={`w-5 h-5 ${colorClass}`} />;
      case 'database': return <Database className={`w-5 h-5 ${colorClass}`} />;
      case 'context': return <Radio className={`w-5 h-5 ${colorClass}`} />;
      case 'model': return <Cpu className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  // Categorize anomalies based on F-distribution thresholds relative to critical value
  const getAnomalyCounts = () => {
    let moderate = 0;
    let severe = 0;
    let extreme = 0;
    anomalies.forEach(anom => {
      const crit = anom.criticalValueF;
      const ratio = anom.testStatF;
      if (ratio >= crit && ratio < crit * 1.5) {
        moderate++;
      } else if (ratio >= crit * 1.5 && ratio < crit * 3.0) {
        severe++;
      } else if (ratio >= crit * 3.0) {
        extreme++;
      }
    });
    return {
      all: anomalies.length,
      moderate,
      severe,
      extreme
    };
  };

  const counts = getAnomalyCounts();

  const filteredAnomalies = anomalies.filter(anom => {
    if (fFilter === 'all') return true;
    const crit = anom.criticalValueF;
    const ratio = anom.testStatF;
    if (fFilter === 'moderate') {
      return ratio >= crit && ratio < crit * 1.5;
    }
    if (fFilter === 'severe') {
      return ratio >= crit * 1.5 && ratio < crit * 3.0;
    }
    if (fFilter === 'extreme') {
      return ratio >= crit * 3.0;
    }
    if (fFilter === 'custom') {
      return ratio >= customRangeMin && ratio <= customRangeMax;
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="VeklomAnomalyDetector">
      
      {/* List of MCP Resources & Controllers */}
      <div className="lg:col-span-5 bg-[#0a0c14]/85 border border-cyan-500/20 p-4 rounded-xl flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-cyan-400 w-5 h-5 animate-pulse" />
            <h3 className="text-md uppercase font-mono font-semibold tracking-wide text-cyan-300">
              MCP Microarchitecture Monitors
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
            Analyzes active telemetry vs base metrics. Move sliders to artificially introduce variance noise, triggering statistical F-bounds testing.
          </p>

          <div className="flex flex-col gap-3">
            {resources.map((res) => {
              return (
                <div 
                  key={res.id}
                  onClick={() => setActiveResId(res.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    activeResId === res.id 
                      ? 'bg-cyan-950/25 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
                      : 'bg-[#05070a]/40 border-slate-900/60 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(res.type, res.state)}
                      <span className="text-xs font-mono font-bold text-slate-200">{res.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{res.id}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3 bg-[#0d1x17]/40 p-2 rounded border border-slate-900/40">
                    <div>
                      <span>CURR: </span>
                      <span className={`font-bold ${
                        res.state === 'anomaly' ? 'text-red-500 font-extrabold' : res.state === 'warning' ? 'text-amber-400' : 'text-cyan-400'
                      }`}>
                        {res.value} {res.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">BASE VARIANCE: </span>
                      <span className="text-slate-300">1.62 {res.unit}²</span>
                    </div>
                  </div>

                  {/* Noise Injector Slider */}
                  <div className="flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">Disturbance Injection:</span>
                    <input 
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={injectedNoise[res.id] || 0}
                      onChange={(e) => handleNoiseChange(res.id, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <span className="text-[10px] font-mono text-slate-400 font-bold block min-w-[20px] text-right">
                      {injectedNoise[res.id] === 0 ? "OFF" : `+${injectedNoise[res.id]}x`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Statistical Controls */}
        <div className="mt-4 pt-4 border-t border-slate-900 flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400">ANOVA Alpha Limit (α)</span>
          <div className="flex gap-2">
            {[0.05, 0.01].map((val) => (
              <button
                key={val}
                onClick={() => setAlpha(val)}
                className={`px-3 py-1 rounded border transition-all cursor-pointer ${
                  alpha === val 
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)] font-semibold'
                    : 'bg-[#0d1117] border-slate-800 text-slate-500'
                }`}
              >
                {val} ({val === 0.05 ? "95%" : "99%"})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Probabilistic Curve (F-Distribution Mapping) */}
      <div className="lg:col-span-4 bg-[#0a0c14]/85 border border-cyan-500/20 p-4 rounded-xl flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              Anomalous Distribution (F-PDF)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              df1 = 9, df2 = 9
            </span>
          </div>

          <div className="w-full h-[200px] border border-slate-900 bg-[#05070a]/90 rounded-lg p-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getFDistributionPlotData()}>
                <XAxis dataKey="x" stroke="#334155" fontSize={9} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#05070a', borderColor: '#22d3ee', fontSize: '10px', fontFamily: 'monospace' }} 
                  labelStyle={{ color: '#64748b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="density" 
                  stroke="#22d3ee" 
                  fill="url(#colorDensity)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorDensity" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.15}/>
                    {/* Visualizing critical point at F=3.18 */}
                    <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.15}/>
                    <stop offset="55%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.35}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Draw Vertical Line indicators */}
            <div 
              className="absolute h-full top-0 border-l border-amber-500 border-dashed z-10"
              style={{ left: `${(fStat / 6.5) * 80 + 10}%` }}
              title={`Current F-statistic: ${fStat}`}
            >
              <div className="bg-amber-950/90 text-amber-300 border border-amber-500 text-[8px] font-mono p-1 rounded rounded-bl-none translate-x-1 mt-10 shadow-lg">
                F_stat: {fStat}
              </div>
            </div>

            <div 
              className="absolute h-full top-0 border-l border-red-500 z-10"
              style={{ left: `${(fCritical / 6.5) * 80 + 10}%` }}
              title={`Critical Value: ${fCritical}`}
            >
              <div className="bg-red-950/95 text-red-350 border border-red-500 text-[8px] font-mono p-1 rounded rounded-tr-none -translate-x-full mt-2 select-none shadow-lg">
                F_crit: {fCritical}
              </div>
            </div>
          </div>
        </div>

        {/* F-Test Metrics list */}
        <div className="mt-4 border-t border-slate-900 pt-3">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2 font-medium">
            F-Test Variance Hypothesis Results
          </span>
          <div className="flex flex-col gap-2 font-mono text-xs text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-slate-920">
              <span className="text-slate-500">H₀ (Null Hypothesis)</span>
              <span className="text-slate-400">Variance is within stable limits</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-920">
              <span className="text-slate-500">F-Statistic Variance Ratio ($F$)</span>
              <span className={`font-bold ${fStat > fCritical ? 'text-red-400' : 'text-cyan-400'}`}>
                {fStat}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-920">
              <span className="text-slate-500">Critical Value (F-beta at α = {alpha})</span>
              <span className="text-slate-300">{fCritical}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Probability value ($p$-Value)</span>
              <span className={`font-bold ${pValue < alpha ? 'text-red-400' : 'text-cyan-400'}`}>
                {pValue}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Anomaly Alerts ledger (The "Feet") */}
      <div className="lg:col-span-3 bg-[#0a0c14]/85 border border-cyan-500/20 p-4 rounded-xl flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
            <div className="flex items-center gap-1.5">
              <Bell className="text-red-400 w-4 h-4 animate-pulse" />
              <span className="text-xs font-mono font-bold text-red-400 font-semibold text-red-400">ANOMALY REVIEW BOARD</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">{filteredAnomalies.length} / {anomalies.length}</span>
          </div>

          {/* Filtering Interface */}
          <div className="mb-4 bg-[#05070a]/60 border border-slate-900 rounded-lg p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-mono text-cyan-400 font-extrabold tracking-wider">
                F-Distribution Filter
              </span>
              <span className="text-[8px] font-mono text-slate-500">(df1=9, df2=9)</span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
              <button
                onClick={() => setFFilter('all')}
                className={`py-1 px-1 rounded border transition-all text-center cursor-pointer truncate ${
                  fFilter === 'all'
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                    : 'bg-transparent border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-805'
                }`}
                title="All detected anomalies"
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setFFilter('moderate')}
                className={`py-1 px-1 rounded border transition-all text-center cursor-pointer truncate ${
                  fFilter === 'moderate'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                    : 'bg-transparent border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-805'
                }`}
                title="F_crit <= F < 1.5 * F_crit (Moderate deviance)"
              >
                Mod ({counts.moderate})
              </button>
              <button
                onClick={() => setFFilter('severe')}
                className={`py-1 px-1 rounded border transition-all text-center cursor-pointer truncate ${
                  fFilter === 'severe'
                    ? 'bg-orange-950/40 border-orange-500/50 text-orange-400 font-bold shadow-[0_0_8px_rgba(249,115,22,0.1)]'
                    : 'bg-transparent border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-805'
                }`}
                title="1.5 * F_crit <= F < 3.0 * F_crit (Significant drift)"
              >
                Sev ({counts.severe})
              </button>
              <button
                onClick={() => setFFilter('extreme')}
                className={`py-1 px-1 rounded border transition-all text-center cursor-pointer truncate ${
                  fFilter === 'extreme'
                    ? 'bg-red-950/30 border-red-500/50 text-red-400 font-bold shadow-[0_0_8px_rgba(239,68,68,0.1)]'
                    : 'bg-transparent border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-805'
                }`}
                title="F >= 3.0 * F_crit (Severe breach)"
              >
                Ext ({counts.extreme})
              </button>
            </div>

            {/* Custom Range select button */}
            <button
              onClick={() => setFFilter('custom')}
              className={`w-full py-1 text-[9px] font-mono rounded border transition-all text-center cursor-pointer ${
                fFilter === 'custom'
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                  : 'bg-transparent border-slate-900 text-slate-500 hover:text-slate-300 hover:border-slate-805'
              }`}
            >
              Custom Range Slider...
            </button>

            {/* Custom Range Sliders */}
            {fFilter === 'custom' && (
              <div className="space-y-1.5 mt-1 pt-2 border-t border-slate-900 text-[9px] font-mono text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Min F-Ratio:</span>
                  <span className="text-cyan-400 font-bold">{customRangeMin.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={customRangeMin}
                  onChange={(e) => setCustomRangeMin(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-850 rounded appearance-none cursor-pointer accent-cyan-500"
                />

                <div className="flex justify-between items-center mt-1">
                  <span>Max F-Ratio:</span>
                  <span className="text-cyan-350 font-bold text-cyan-350">{customRangeMax.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="40.0"
                  step="0.5"
                  value={customRangeMax}
                  onChange={(e) => setCustomRangeMax(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-850 rounded appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scroll pr-1">
            {filteredAnomalies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center font-mono">
                <CheckCircle2 className="w-6 h-6 text-cyan-550/30 mb-2" />
                <span className="text-[10px]">No anomalies match the F-distribution filter.</span>
              </div>
            ) : (
              filteredAnomalies.map((anom) => (
                <div 
                  key={anom.id}
                  className="bg-red-950/10 border border-red-900/40 p-2.5 rounded text-[10px] font-mono leading-relaxed"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-red-400 font-bold uppercase tracking-wider">{anom.id}</span>
                    <span className="text-slate-500 text-[9px]">
                      {new Date(anom.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[10px] line-clamp-3 mb-1.5">{anom.description}</p>
                  
                  <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1.5 border-t border-red-950">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
                      Auto: QUARANTINED
                    </span>
                    <span className="text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded">F: {anom.testStatF.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Metrics */}
        <div className="mt-4 pt-4 border-t border-slate-900">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Governance Protection:</span>
            <span className="text-cyan-400 font-bold">L5 Active Enforce</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
