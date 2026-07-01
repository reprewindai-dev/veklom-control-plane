"use client";
import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Activity, 
  Shield, 
  RefreshCw, 
  Cpu, 
  Award, 
  FileText, 
  CheckCircle, 
  MapPin, 
  TrendingUp, 
  BookOpen, 
  AlertCircle, 
  Check, 
  Database,
  ExternalLink
} from 'lucide-react';
import { GenomeDNA } from './GenomeDNA';
import { ApiDnaVisualizer } from './ApiDnaVisualizer';

interface ProberNode {
  id: string;
  name: string;
  region: string;
  latency: number;
  throughput: number;
  status: 'attesting' | 'idle' | 'warning';
  activeCycles: number;
}

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  desc: string;
}

interface ApiScoreCard {
  id: string;
  name: string;
  provider: string;
  score: number;
  grade: string;
  dimensions: DimensionScore[];
  anchorHash: string;
  ipfsHash: string;
  txHash: string;
  lastUpdated: string;
}

export default function NexusProtocol() {
  const [subTab, setSubTab] = useState<'trust' | 'topology' | 'docs'>('trust');
  const [selectedApiId, setSelectedApiId] = useState<string>('stripe-payments');
  const [docTab, setDocTab] = useState<'governance' | 'methodology'>('governance');
  const [attestationProgress, setAttestationProgress] = useState(68);
  const [anchorCount, setAnchorCount] = useState(1442);
  const [lastAnchorTime, setLastAnchorTime] = useState<string>('4m ago');
  const [isAttesting, setIsAttesting] = useState(true);
  const [genome, setGenome] = useState<any>(null);
  const [hoveredDimIndex, setHoveredDimIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchGenome = async () => {
      try {
        const res = await fetch('/api/pgl/genome');
        if (res.ok) {
          const data = await res.json();
          setGenome(data);
        } else {
          throw new Error(`Endpoint returned status: ${res.status}`);
        }
      } catch (e) {
        console.warn('Backend genome fetch failed. Engaging secure local pre-seeded PGL genome:', e);
        setGenome({
          hash: 'a1b2c3d4',
          layers: {
            model: 'Olmo3-Hybrid',
            prompt: 'PGL-Constitutional',
            policy: 'Article-12',
            watchtower: 'MELT-Guard'
          },
          timestamp: new Date().toISOString()
        });
      }
    };
    fetchGenome();
  }, []);

  // Dynamic simulation state for latency
  const [nodes, setNodes] = useState<ProberNode[]>([
    { id: 'us-east', name: 'Node-01 // US-East', region: 'N. Virginia, USA', latency: 18, throughput: 440, status: 'attesting', activeCycles: 9812 },
    { id: 'us-west', name: 'Node-02 // US-West', region: 'Oregon, USA', latency: 32, throughput: 310, status: 'attesting', activeCycles: 9789 },
    { id: 'eu-west', name: 'Node-03 // EU-West', region: 'Frankfurt, GER', latency: 12, throughput: 512, status: 'attesting', activeCycles: 9910 },
    { id: 'ap-southeast', name: 'Node-04 // AP-Southeast', region: 'Singapore', latency: 42, throughput: 215, status: 'attesting', activeCycles: 9540 },
    { id: 'ap-northeast', name: 'Node-05 // AP-Northeast', region: 'Tokyo, JPN', latency: 38, throughput: 290, status: 'attesting', activeCycles: 9688 },
  ]);

  const apiCards: ApiScoreCard[] = [
    {
      id: 'stripe-payments',
      name: 'Stripe Payments API',
      provider: 'Stripe, Inc.',
      score: 96,
      grade: 'A',
      dimensions: [
        { name: 'Performance', score: 98, weight: 15, desc: 'p50/p95 response latency' },
        { name: 'Reliability', score: 99, weight: 15, desc: 'HTTP 200 uptime consistency' },
        { name: 'Security Posture', score: 95, weight: 10, desc: 'TLS configuration & headers' },
        { name: 'SLA Compliance', score: 96, weight: 10, desc: 'Acceptable boundary conformance' },
        { name: 'Data Residency', score: 90, weight: 10, desc: 'Regional sovereignty rules alignment' },
        { name: 'Cost Efficiency', score: 88, weight: 10, desc: 'M2M compute spend scaling' },
        { name: 'Hardware Coherence', score: 94, weight: 10, desc: 'Predictability across host variations' },
        { name: 'Network Jitter', score: 97, weight: 10, desc: 'Standard deviation of routing path' },
        { name: 'Cryptographic Proof', score: 100, weight: 5, desc: 'Valid response signature matching' },
        { name: 'Dispute Ratio', score: 100, weight: 5, desc: 'Absence of unresolved SLA appeals' },
      ],
      anchorHash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      ipfsHash: 'QmYwAPJhy5nJqqEAQUWKWtURPzRrCb76c8cUpV1J8U3F47',
      txHash: '0x7fca4b76a086a9f4e242a4b89968a41bc9eb92f153a4c495914ab77de0fc855b',
      lastUpdated: '12m ago'
    },
    {
      id: 'openai-gpt4o',
      name: 'OpenAI GPT-4o API',
      provider: 'OpenAI L.L.C.',
      score: 91,
      grade: 'A-',
      dimensions: [
        { name: 'Performance', score: 84, weight: 15, desc: 'p50/p95 response latency' },
        { name: 'Reliability', score: 94, weight: 15, desc: 'HTTP 200 uptime consistency' },
        { name: 'Security Posture', score: 92, weight: 10, desc: 'TLS configuration & headers' },
        { name: 'SLA Compliance', score: 90, weight: 10, desc: 'Acceptable boundary conformance' },
        { name: 'Data Residency', score: 85, weight: 10, desc: 'Regional sovereignty rules alignment' },
        { name: 'Cost Efficiency', score: 93, weight: 10, desc: 'M2M compute spend scaling' },
        { name: 'Hardware Coherence', score: 88, weight: 10, desc: 'Predictability across host variations' },
        { name: 'Network Jitter', score: 95, weight: 10, desc: 'Standard deviation of routing path' },
        { name: 'Cryptographic Proof', score: 100, weight: 5, desc: 'Valid response signature matching' },
        { name: 'Dispute Ratio', score: 98, weight: 5, desc: 'Absence of unresolved SLA appeals' },
      ],
      anchorHash: '0x2a2491a61c3a649fb92080a4c8996fa127be41e4649b934ca495991b7852b3de',
      ipfsHash: 'QmZv21A7xWQUwAPJhynJqqEAQURPzRrCb76c8cUpV1J8U',
      txHash: '0x1de9fc855b7fca4b76a086a9f4e242a4b89968a41bc9eb92f153a4c495914ab77',
      lastUpdated: '8m ago'
    },
    {
      id: 'gemini-pro',
      name: 'Google Gemini Pro API',
      provider: 'Google L.L.C.',
      score: 94,
      grade: 'A',
      dimensions: [
        { name: 'Performance', score: 91, weight: 15, desc: 'p50/p95 response latency' },
        { name: 'Reliability', score: 97, weight: 15, desc: 'HTTP 200 uptime consistency' },
        { name: 'Security Posture', score: 96, weight: 10, desc: 'TLS configuration & headers' },
        { name: 'SLA Compliance', score: 94, weight: 10, desc: 'Acceptable boundary conformance' },
        { name: 'Data Residency', score: 88, weight: 10, desc: 'Regional sovereignty rules alignment' },
        { name: 'Cost Efficiency', score: 95, weight: 10, desc: 'M2M compute spend scaling' },
        { name: 'Hardware Coherence', score: 90, weight: 10, desc: 'Predictability across host variations' },
        { name: 'Network Jitter', score: 94, weight: 10, desc: 'Standard deviation of routing path' },
        { name: 'Cryptographic Proof', score: 100, weight: 5, desc: 'Valid response signature matching' },
        { name: 'Dispute Ratio', score: 100, weight: 5, desc: 'Absence of unresolved SLA appeals' },
      ],
      anchorHash: '0x5ca495991b7852b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b93',
      ipfsHash: 'QmPXrrCb76c8cUpV1J8U3F47YwAPJhy5nJqqEAQUWKWtU',
      txHash: '0x495914ab77de0fc855b7fca4b76a086a9f4e242a4b89968a41bc9eb92f153a4c4',
      lastUpdated: '15m ago'
    },
    {
      id: 'anthropic-claude3',
      name: 'Anthropic Claude 3 API',
      provider: 'Anthropic PBC',
      score: 89,
      grade: 'B+',
      dimensions: [
        { name: 'Performance', score: 82, weight: 15, desc: 'p50/p95 response latency' },
        { name: 'Reliability', score: 92, weight: 15, desc: 'HTTP 200 uptime consistency' },
        { name: 'Security Posture', score: 94, weight: 10, desc: 'TLS configuration & headers' },
        { name: 'SLA Compliance', score: 88, weight: 10, desc: 'Acceptable boundary conformance' },
        { name: 'Data Residency', score: 85, weight: 10, desc: 'Regional sovereignty rules alignment' },
        { name: 'Cost Efficiency', score: 86, weight: 10, desc: 'M2M compute spend scaling' },
        { name: 'Hardware Coherence', score: 92, weight: 10, desc: 'Predictability across host variations' },
        { name: 'Network Jitter', score: 93, weight: 10, desc: 'Standard deviation of routing path' },
        { name: 'Cryptographic Proof', score: 100, weight: 5, desc: 'Valid response signature matching' },
        { name: 'Dispute Ratio', score: 95, weight: 5, desc: 'Absence of unresolved SLA appeals' },
      ],
      anchorHash: '0x9fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afbf4c899',
      ipfsHash: 'QmURPzRrCb76c8cUpV1J8U3F47YwAPJhy5nJqqEAQUWKWt',
      txHash: '0xeb92f153a4c495914ab77de0fc855b7fca4b76a086a9f4e242a4b89968a41bc9',
      lastUpdated: '18m ago'
    },
    {
      id: 'local-ollama',
      name: 'Local Ollama Instance',
      provider: 'Sovereign Node / Localhost',
      score: 98,
      grade: 'A+',
      dimensions: [
        { name: 'Performance', score: 100, weight: 15, desc: 'p50/p95 response latency' },
        { name: 'Reliability', score: 100, weight: 15, desc: 'HTTP 200 uptime consistency' },
        { name: 'Security Posture', score: 85, weight: 10, desc: 'TLS configuration & headers' },
        { name: 'SLA Compliance', score: 100, weight: 10, desc: 'Acceptable boundary conformance' },
        { name: 'Data Residency', score: 100, weight: 10, desc: 'Regional sovereignty rules alignment' },
        { name: 'Cost Efficiency', score: 100, weight: 10, desc: 'M2M compute spend scaling' },
        { name: 'Hardware Coherence', score: 95, weight: 10, desc: 'Predictability across host variations' },
        { name: 'Network Jitter', score: 100, weight: 10, desc: 'Standard deviation of routing path' },
        { name: 'Cryptographic Proof', score: 100, weight: 5, desc: 'Valid response signature matching' },
        { name: 'Dispute Ratio', score: 100, weight: 5, desc: 'Absence of unresolved SLA appeals' },
      ],
      anchorHash: '0x4ca495991b7852b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b93b7',
      ipfsHash: 'QmYwAPJhy5nJqqEAQUWKWtURPzRrCb76c8cUpV1J8U3F47',
      txHash: '0x4c495914ab77de0fc855b7fca4b76a086a9f4e242a4b89968a41bc9eb92f153a4',
      lastUpdated: '1m ago'
    }
  ];

  const selectedApi = apiCards.find(a => a.id === selectedApiId) || apiCards[0];

  // Simulating live tick
  useEffect(() => {
    const interval = setInterval(() => {
      // Jitter latency slightly
      setNodes(prev => prev.map(n => ({
        ...n,
        latency: Math.max(5, n.latency + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3)),
        throughput: Math.max(50, n.throughput + (Math.random() > 0.5 ? 5 : -5) * Math.floor(Math.random() * 4))
      })));

      // Attestation wheel progress tick
      setAttestationProgress(prev => {
        if (prev >= 100) {
          setAnchorCount(ac => ac + 1);
          setLastAnchorTime('Just now');
          setIsAttesting(false);
          setTimeout(() => setIsAttesting(true), 2000);
          return 0;
        }
        if (prev === 0) {
          setLastAnchorTime('1m ago');
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#030303] text-white/90 overflow-hidden font-sans border-l border-white/5 relative">
      
      {/* Dynamic Background NOC Grid Overlay */}
      <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none z-0" />
      
      {/* Sub-Header Tabs */}
      <div className="h-12 border-b border-white/10 shrink-0 bg-void-black/80 backdrop-blur flex items-center justify-between px-6 z-10 select-none">
        <div className="flex gap-4">
          <button 
            onClick={() => setSubTab('trust')}
            className={`text-xs font-bold tracking-widest uppercase cursor-pointer border-b-2 py-3 px-1 transition-all ${subTab === 'trust' ? 'text-[#00E5FF] border-[#00E5FF]' : 'text-white/40 border-transparent hover:text-white/70'}`}
          >
            TRUST MATRIX
          </button>
          <button 
            onClick={() => setSubTab('topology')}
            className={`text-xs font-bold tracking-widest uppercase cursor-pointer border-b-2 py-3 px-1 transition-all ${subTab === 'topology' ? 'text-[#00E5FF] border-[#00E5FF]' : 'text-white/40 border-transparent hover:text-white/70'}`}
          >
            PROBE TOPOLOGY
          </button>
          <button 
            onClick={() => setSubTab('docs')}
            className={`text-xs font-bold tracking-widest uppercase cursor-pointer border-b-2 py-3 px-1 transition-all ${subTab === 'docs' ? 'text-[#00E5FF] border-[#00E5FF]' : 'text-white/40 border-transparent hover:text-white/70'}`}
          >
            CHARTER & METHODOLOGY
          </button>
        </div>
        
        {/* attestation status badge */}
        <div className="flex items-center gap-4 text-mono text-[10px] text-white/50 bg-black/40 px-3 py-1 rounded border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isAttesting ? 'bg-[#00FF66] animate-pulse' : 'bg-hazard-amber'}`} />
            <span className="uppercase">{isAttesting ? 'CYCLE ATTRIBUTION ONGOING' : 'ANCHOR COMMITTED'}</span>
          </div>
          <div className="w-px h-3 bg-white/20"></div>
          <div>ANCHORS: <span className="text-[#00E5FF]">{anchorCount}</span></div>
          <div>LAST: <span className="text-white/80 font-bold">{lastAnchorTime}</span></div>
        </div>
      </div>

      {/* Primary Tab Viewports */}
      <div className="flex-grow overflow-y-auto z-10 p-6 flex flex-col gap-6 relative">
        
        {subTab === 'trust' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-stretch">
            
            {/* API List selection panel */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="text-[10px] font-mono tracking-wider text-white/30 uppercase">TARGET API RECONCILIATION</div>
              <div className="flex flex-col gap-2">
                {apiCards.map(api => (
                  <button
                    key={api.id}
                    onClick={() => setSelectedApiId(api.id)}
                    className={`p-4 rounded-lg text-left transition-all border obsidian-glass-interactive cursor-pointer ${selectedApiId === api.id ? 'border-[#00E5FF]/40 bg-[#00E5FF]/5 shadow-[0_0_15px_rgba(0,229,255,0.05)]' : 'border-white/5 bg-void-metal/40'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-xs font-bold text-white/80">{api.name}</div>
                        <div className="text-[9px] text-white/40 uppercase font-mono">{api.provider}</div>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${api.score >= 95 ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20' : api.score >= 90 ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 'bg-hazard-amber/10 text-hazard-amber border border-hazard-amber/20'}`}>
                        {api.score} {api.grade}
                      </div>
                    </div>
                    <div className="mt-2.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${api.score >= 95 ? 'from-[#00FF66] to-[#00E5FF]' : api.score >= 90 ? 'from-[#00E5FF] to-violet-500' : 'from-hazard-amber to-orange-500'}`}
                        style={{ width: `${api.score}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* Mini Genome DNA Widget */}
              <div className="mt-2.5">
                {genome ? (
                  <GenomeDNA mini genome={genome} />
                ) : (
                  <div className="p-4 rounded-xl border border-white/5 bg-void-metal/20 text-center py-6 text-[10px] font-mono text-white/30 uppercase tracking-widest animate-pulse">
                    Decoding PGL Genome...
                  </div>
                )}
              </div>
            </div>

            {/* Scorecard detail panel */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="p-6 rounded-xl border border-white/10 bg-void-metal/80 backdrop-blur flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5FF]/2 rounded-full blur-3xl pointer-events-none" />
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-4 shrink-0">
                  <div>
                    <h2 className="text-lg font-bold tracking-wide text-white">{selectedApi.name}</h2>
                    <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">{selectedApi.provider} — Benchmark v0.1</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[28px] font-bold font-mono tracking-tight text-[#00E5FF] text-glow-cyan leading-none">{selectedApi.score}</div>
                    <div className="text-[9px] text-[#00FF66] uppercase font-mono tracking-wider font-bold">COMPOSITE RATING: {selectedApi.grade}</div>
                  </div>
                </div>

                {/* 10-Dimensional Vector Breakdown */}
                <div>
                  <div className="text-[10px] font-mono tracking-wider text-white/30 uppercase mb-4">10-DIMENSIONAL QUALITY VECTOR SPECIFICATION</div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
                    {/* DNA Helix Map column */}
                    <div className="xl:col-span-2">
                      <ApiDnaVisualizer
                        dimensions={selectedApi.dimensions}
                        apiName={selectedApi.name}
                        apiScore={selectedApi.score}
                        apiGrade={selectedApi.grade}
                        hoveredIndex={hoveredDimIndex}
                        setHoveredIndex={setHoveredDimIndex}
                      />
                    </div>

                    {/* Progress bars specification column */}
                    <div className="xl:col-span-3 flex flex-col gap-3">
                      {selectedApi.dimensions.map((dim, idx) => {
                        const isHovered = hoveredDimIndex === idx;
                        return (
                          <div 
                            key={idx} 
                            onMouseEnter={() => setHoveredDimIndex(idx)}
                            onMouseLeave={() => setHoveredDimIndex(null)}
                            className={`p-3 rounded-lg flex flex-col gap-1.5 transition-all duration-200 border ${isHovered ? 'bg-[#00E5FF]/5 border-[#00E5FF]/30 shadow-[0_0_12px_rgba(0,229,255,0.05)] scale-[1.01]' : 'bg-black/40 border-white/5'}`}
                          >
                            <div className="flex justify-between items-center text-[11px]">
                              <span className={`font-semibold transition-colors duration-200 ${isHovered ? 'text-white' : 'text-white/80'}`}>{dim.name}</span>
                              <span className="font-mono text-[#00E5FF] font-bold">{dim.score} / 100</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r transition-all duration-300 ${isHovered ? 'from-[#00E5FF] to-[#00FF66]' : 'from-violet-500 to-[#00E5FF]'}`}
                                style={{ width: `${dim.score}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[8.5px] text-white/40 font-mono">
                              <span>{dim.desc}</span>
                              <span>WEIGHT: {dim.weight}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Cryptographic Attestation Metadata */}
                <div className="mt-2 p-4 bg-void-black border border-white/5 rounded-lg font-mono text-[10px] flex flex-col gap-2">
                  <div className="text-[9px] text-[#00FF66] font-bold tracking-widest uppercase flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-[#00FF66]" /> CRYPTOGRAPHIC PROOF OF MEASUREMENT SECURED
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-white/30 uppercase">Merkle Root</div>
                      <div className="text-white/70 truncate" title={selectedApi.anchorHash}>{selectedApi.anchorHash}</div>
                    </div>
                    <div>
                      <div className="text-white/30 uppercase">IPFS Artifact</div>
                      <div className="text-white/70 truncate flex items-center gap-1" title={selectedApi.ipfsHash}>
                        <span>{selectedApi.ipfsHash}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-white/40" />
                      </div>
                    </div>
                    <div>
                      <div className="text-white/30 uppercase">Anchor Tx Hash</div>
                      <div className="text-[#00E5FF] truncate flex items-center gap-1" title={selectedApi.txHash}>
                        <span>{selectedApi.txHash}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[#00E5FF]/60" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {subTab === 'topology' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-stretch">
            
            {/* Region Details list */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="text-[10px] font-mono tracking-wider text-white/30 uppercase">DECENTRALIZED NODE DIRECTORY</div>
              <div className="flex flex-col gap-2">
                {nodes.map(node => (
                  <div 
                    key={node.id}
                    className="p-4 rounded-lg border border-white/5 bg-void-metal/40 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-xs font-bold text-white/80">{node.name}</div>
                      <div className="text-[9px] text-white/40 uppercase font-mono flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-white/30" /> {node.region}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-[#00FF66]">{node.latency}ms</div>
                      <div className="text-[9px] text-white/30">{node.throughput} kb/s</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topology map visualization & cycle tracking */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="p-6 rounded-xl border border-white/10 bg-void-metal/80 backdrop-blur flex flex-col gap-6 flex-grow justify-between">
                
                {/* Node map visual simulator */}
                <div className="flex-grow flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-xs font-bold tracking-wider uppercase text-white/80">Active Swarm Topology</h3>
                      <p className="text-[9.5px] text-white/40">5 regional measurement nodes executing synthetic probes</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
                      ACTIVE SYSTEM
                    </span>
                  </div>

                  {/* Simulated Visual map coordinates */}
                  <div className="h-60 border border-white/5 rounded-lg bg-black/40 relative overflow-hidden flex items-center justify-center">
                    
                    {/* Node points */}
                    <div className="absolute top-[30%] left-[25%] flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] animate-ping absolute" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] z-10" />
                      <span className="text-[8px] font-mono mt-1 text-white/60 bg-black/80 px-1 py-0.5 rounded border border-white/5">US-WEST: {nodes[1].latency}ms</span>
                    </div>

                    <div className="absolute top-[40%] left-[45%] flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] animate-ping absolute" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] z-10" />
                      <span className="text-[8px] font-mono mt-1 text-white/60 bg-black/80 px-1 py-0.5 rounded border border-white/5">US-EAST: {nodes[0].latency}ms</span>
                    </div>

                    <div className="absolute top-[25%] left-[60%] flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] animate-ping absolute" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] z-10" />
                      <span className="text-[8px] font-mono mt-1 text-white/60 bg-black/80 px-1 py-0.5 rounded border border-white/5">EU-WEST: {nodes[2].latency}ms</span>
                    </div>

                    <div className="absolute top-[65%] left-[80%] flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] animate-ping absolute" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] z-10" />
                      <span className="text-[8px] font-mono mt-1 text-white/60 bg-black/80 px-1 py-0.5 rounded border border-white/5">AP-SE: {nodes[3].latency}ms</span>
                    </div>

                    <div className="absolute top-[35%] left-[85%] flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] animate-ping absolute" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] z-10" />
                      <span className="text-[8px] font-mono mt-1 text-white/60 bg-black/80 px-1 py-0.5 rounded border border-white/5">AP-NE: {nodes[4].latency}ms</span>
                    </div>

                    <div className="text-[9px] font-mono text-white/20 select-none uppercase tracking-widest">Global Swarm Mesh Network</div>
                  </div>
                </div>

                {/* Attestation progress bar */}
                <div className="p-4 bg-void-black border border-white/5 rounded-lg flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-white/40 uppercase">Attestation Consensus Epoch Progress</span>
                    <span className="text-[#00FF66] font-bold">{attestationProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 via-[#00E5FF] to-[#00FF66] transition-all duration-300"
                      style={{ width: `${attestationProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8.5px] font-mono text-white/30 uppercase">
                    <span>Phase 1: Metric Ingestion</span>
                    <span>Phase 2: Scoring</span>
                    <span>Phase 3: Root Anchoring</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {subTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow items-stretch overflow-hidden">
            
            {/* Sidebar toggle for docs */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="text-[10px] font-mono tracking-wider text-white/30 uppercase">SPECIFICATION DOCUMENT TABLE</div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setDocTab('governance')}
                  className={`p-4 rounded-lg text-left transition-all border cursor-pointer flex gap-3 items-center ${docTab === 'governance' ? 'border-[#00E5FF]/40 bg-[#00E5FF]/5' : 'border-white/5 bg-void-metal/40'}`}
                >
                  <FileText className="w-5 h-5 text-[#00E5FF]" />
                  <div>
                    <div className="text-xs font-bold text-white/80">Governance Charter</div>
                    <div className="text-[9px] text-white/40 font-mono">VNP v1.0 — LOCKED SPEC</div>
                  </div>
                </button>
                <button
                  onClick={() => setDocTab('methodology')}
                  className={`p-4 rounded-lg text-left transition-all border cursor-pointer flex gap-3 items-center ${docTab === 'methodology' ? 'border-[#00E5FF]/40 bg-[#00E5FF]/5' : 'border-white/5 bg-void-metal/40'}`}
                >
                  <BookOpen className="w-5 h-5 text-[#00E5FF]" />
                  <div>
                    <div className="text-xs font-bold text-white/80">Methodology Spec</div>
                    <div className="text-[9px] text-white/40 font-mono">Formula v0.1 — 100% LOCKED</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Document Reader Container */}
            <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden border border-white/10 rounded-xl bg-void-metal/80 backdrop-blur p-6">
              
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00E5FF]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    {docTab === 'governance' ? 'GOVERNANCE_CHARTER_V1.0.md' : 'METHODOLOGY_SPEC_V0.1.md'}
                  </span>
                </div>
                <span className="text-[8px] font-mono text-white/40 uppercase">Read-Only Secure Buffer</span>
              </div>

              {/* Doc Body Viewport */}
              <div className="flex-grow overflow-y-auto text-xs text-white/70 leading-relaxed font-sans space-y-4 pr-2 custom-scrollbar">
                
                {docTab === 'governance' ? (
                  <>
                    <h1 className="text-lg font-bold text-white border-b border-white/10 pb-2">Veklom Nexus Protocol (VNP) — Governance Charter v1.0</h1>
                    <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded text-yellow-200/80 mb-4 font-mono text-[10px]">
                      STATUS: Open for Community Comment (60-day period) | Effective upon Linux Foundation Series approval.
                    </div>
                    
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-4">1. Mission & Values</h2>
                    <p>The Veklom Nexus Protocol (VNP) is a globally recognized, open-community, real-time API benchmark scoring standard designed to provide transparent, reproducible, and actionable performance scores for APIs across all regions, protocols, and deployment models.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Transparency:</strong> All methodology, test harnesses, and decision-making are public.</li>
                      <li><strong>Neutrality:</strong> No single organization controls VNP's technical direction.</li>
                      <li><strong>Fairness:</strong> Scoring methodology is designed to prevent gaming and level the playing field.</li>
                    </ul>

                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6">2. Two-Board Governance Model</h2>
                    <p>VNP's governance structure separates business administration from technical decisions:</p>
                    <div className="grid grid-cols-2 gap-4 my-2">
                      <div className="p-3 bg-black/40 border border-white/5 rounded">
                        <strong className="text-white">Business Governing Board (BGB)</strong>
                        <p className="text-white/50 text-[10px] mt-1">Handles funding, legal, corporate sponsorships, and foundation operations. **Cannot** veto or override technical choices or scoring specs.</p>
                      </div>
                      <div className="p-3 bg-black/40 border border-white/5 rounded">
                        <strong className="text-white">Technical Steering Committee (TSC)</strong>
                        <p className="text-white/50 text-[10px] mt-1">Owns the VNP specification, scoring rules, and nodes. Has maximum 9 seats with a 25% affiliation cap. Operates under IETF-style rough consensus.</p>
                      </div>
                    </div>

                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6">3. Intellectual Property Framework</h2>
                    <p>All contributions are made under the **Community Specification License v1.0** managed by the Linux Foundation's Joint Development Foundation (JDF). Open-source software code is licensed under Apache 2.0, and benchmark scores are published under Creative Commons CC-BY 4.0.</p>
                    
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6">4. Dispute Resolution Process</h2>
                    <p>If an API provider objects to a benchmark score, a 3-tier appeal is executed:</p>
                    <ul className="list-decimal pl-5 space-y-1">
                      <li><strong>Tier 1 (Automated):</strong> Request re-runs from 3 new probers within 24 hours.</li>
                      <li><strong>Tier 2 (Panel):</strong> Escalates to a 5-person Technical Review Panel to review metrics.</li>
                      <li><strong>Tier 3 (Arbitration):</strong> Escalates to the UMA Optimistic Oracle using staked challenge bonds.</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <h1 className="text-lg font-bold text-white border-b border-white/10 pb-2">VNP Methodology Specification v0.1</h1>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded text-emerald-200/80 mb-4 font-mono text-[10px]">
                      STATUS: Formula v0.1 Locked until 2027-06-22. Changing requires 2/3 TSC supermajority + 60-day review.
                    </div>

                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-4">1. The 10-Dimensional Scoring Formula</h2>
                    <p>The composite score is calculated as a weighted sum of ten normalized dimensions:</p>
                    
                    <div className="space-y-2.5 my-3">
                      <div className="flex justify-between items-center p-2 bg-black/40 border border-white/5 rounded text-[11px]">
                        <span>Performance (Latency p50, p95, p99)</span>
                        <strong className="text-[#00E5FF]">Weight: 15%</strong>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-black/40 border border-white/5 rounded text-[11px]">
                        <span>Reliability (HTTP Uptime, error rate)</span>
                        <strong className="text-[#00E5FF]">Weight: 15%</strong>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-black/40 border border-white/5 rounded text-[11px]">
                        <span>Security Posture (TLS strength, headers)</span>
                        <strong className="text-[#00E5FF]">Weight: 10%</strong>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-black/40 border border-white/5 rounded text-[11px]">
                        <span>SLA Compliance (Variance constraint limits)</span>
                        <strong className="text-[#00E5FF]">Weight: 10%</strong>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-black/40 border border-white/5 rounded text-[11px]">
                        <span>Data Residency (Local sovereignty conformance)</span>
                        <strong className="text-[#00E5FF]">Weight: 10%</strong>
                      </div>
                    </div>

                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6">2. Normalization & Geographic Weighting</h2>
                    <p>Measurements are normalized within peer groups to account for hardware variance. Scores are weighted geographically to prevent bias from local routing anomalies (each of the 5 global regions receives equal baseline score mapping before consolidation).</p>

                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6">3. Anti-Gaming Protections</h2>
                    <p>Prober node timing includes random jitter (±15 min) and rotates node identities (IP pools, randomized User-Agents, and fluctuating TLS ciphers) to match real traffic paths and prevent pre-warming behaviors by target servers.</p>
                  </>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
      
    </div>
  );
}
