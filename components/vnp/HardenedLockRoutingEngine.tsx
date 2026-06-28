import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Lock,
  Unlock,
  Terminal,
  Code,
  Activity,
  Trash2,
  RefreshCw,
  Clock,
  Gauge,
  Sliders,
  Sparkles,
  Info,
  Server,
  Zap,
  Search,
  Check,
  TrendingUp,
  X,
  Cpu,
  Copy
} from 'lucide-react';

// --- CONFIG & SEED DATA ---

const KEYSPACE_POOL = [
  'lock:user_auth:9021',
  'lock:payment_charge:115',
  'lock:inventory_sku_993',
  'lock:order_checkout:583',
  'lock:db_backup_worker',
  'lock:report_generator_v2',
  'lock:stripe_webhook_771',
  'lock:cache_warmup_leader'
];

interface LuaLine {
  code: string;
  desc: string;
  perf: string;
}

const LUA_SCRIPTS: Record<string, { title: string; lines: LuaLine[] }> = {
  acquire: {
    title: "Lock Acquisition (with Re-entrancy & TTL)",
    lines: [
      { code: "-- KEYS[1]: lock key, ARGV[1]: client token, ARGV[2]: ttl (ms)", desc: "Definition of script inputs.", perf: "Meta" },
      { code: "if redis.call('exists', KEYS[1]) == 0 then", desc: "Checks if the lock key already exists in Redis. Fast, atomic O(1) existence lookup.", perf: "O(1)" },
      { code: "  redis.call('set', KEYS[1], ARGV[1])", desc: "Sets the lock value to the unique client token (ensuring owner tracking).", perf: "O(1)" },
      { code: "  redis.call('pexpire', KEYS[1], ARGV[2])", desc: "Sets precise lease expiration in milliseconds to prevent infinite deadlocks.", perf: "O(1)" },
      { code: "  return 1", desc: "Returns 1 (Success) indicating the lock was successfully created.", perf: "O(1)" },
      { code: "elseif redis.call('get', KEYS[1]) == ARGV[1] then", desc: "Self lock ownership check. If the current client already owns the lock, authorize re-entrancy.", perf: "O(1)" },
      { code: "  redis.call('pexpire', KEYS[1], ARGV[2])", desc: "Refreshes the lease TTL on re-entering to extend the atomic transaction window.", perf: "O(1)" },
      { code: "  return 1", desc: "Returns 1 (Success) showing successful re-entrant acquisition.", perf: "O(1)" },
      { code: "else", desc: "Fallback: The lock is currently acquired by another client.", perf: "Meta" },
      { code: "  return 0", desc: "Returns 0 (Failure): Lock acquisition blocked. Client will need to retry or backoff.", perf: "O(1)" },
      { code: "end", desc: "Terminate conditional block.", perf: "Meta" }
    ]
  },
  release: {
    title: "Safe Release Lock (Validate Ownership)",
    lines: [
      { code: "-- KEYS[1]: lock key, ARGV[1]: client token", desc: "Definition of script inputs.", perf: "Meta" },
      { code: "if redis.call('get', KEYS[1]) == ARGV[1] then", desc: "Crucial safety step: verify that the releasing client is indeed the owner.", perf: "O(1)" },
      { code: "  return redis.call('del', KEYS[1])", desc: "If owned by active client, delete key atomically to release lock. Returns 1.", perf: "O(1)" },
      { code: "else", desc: "Lock is owned by another transaction or expired. Prevent releasing someone else's lease.", perf: "Meta" },
      { code: "  return 0", desc: "Returns 0 (Failure): Release disallowed. Protection against lock theft.", perf: "O(1)" },
      { code: "end", desc: "Closing block.", perf: "Meta" }
    ]
  },
  renew: {
    title: "Dynamic Lease Renewal (Heartbeat)",
    lines: [
      { code: "-- KEYS[1]: lock key, ARGV[1]: client token, ARGV[2]: extend_time (ms)", desc: "Definition of script inputs.", perf: "Meta" },
      { code: "if redis.call('get', KEYS[1]) == ARGV[1] then", desc: "Verify active ownership before allowing extension.", perf: "O(1)" },
      { code: "  redis.call('pexpire', KEYS[1], ARGV[2])", desc: "Refresh state expiry delay atomically.", perf: "O(1)" },
      { code: "  return 1", desc: "Returns 1 (Success) indicating lock extended.", perf: "O(1)" },
      { code: "else", desc: "Lock expired or hijacked. Client must fail-safe and abort operation.", perf: "Meta" },
      { code: "  return 0", desc: "Failure: lock represents a stale session. Force cleanup.", perf: "O(1)" },
      { code: "end", desc: "Closing conditional block.", perf: "Meta" }
    ]
  }
};

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'failed' | 'expired' | 'system' | 'warn';
  message: string;
  latency?: number;
  operation: string;
  key: string;
}

interface SimulationTick {
  timeLabel: string;
  successes: number;
  failures: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  totalRequests: number;
  p95Latency: number;
}

interface ActiveLock {
  key: string;
  clientId: string;
  expiresAt: number;
  durationMax: number;
  acquiredAt: number;
  leaseHistory?: { timestamp: number; type: 'acquire' | 'renew' }[];
}

const getSparklineData = (lock: ActiveLock) => {
  const history = lock.leaseHistory || [];
  if (history.length === 0) {
    return [{ time: 0, val: 100 }];
  }

  const start = lock.acquiredAt;
  const end = Date.now();
  const duration = Math.max(1000, end - start);
  
  const points = [];
  const step = duration / 14; // 15 points total
  
  for (let i = 0; i < 15; i++) {
    const t = start + i * step;
    
    let activeEvent = null;
    for (const ev of history) {
      if (ev.timestamp <= t) {
        if (!activeEvent || ev.timestamp > activeEvent.timestamp) {
          activeEvent = ev;
        }
      }
    }
    
    if (!activeEvent) {
      points.push({ time: i, val: 0 });
      continue;
    }
    
    const leaseDuration = lock.durationMax || 10000;
    const elapsedSinceEvent = t - activeEvent.timestamp;
    const remainingLease = Math.max(0, leaseDuration - elapsedSinceEvent);
    const percentage = Math.round((remainingLease / leaseDuration) * 100);
    
    points.push({
      time: i,
      val: percentage
    });
  }
  
  return points;
};

export default function App() {
  const [origin, setOrigin] = useState('https://control.veklom.com');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // --- STATE ---
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [contentionLevel, setContentionLevel] = useState<'low' | 'medium' | 'high' | 'extreme'>('medium');
  const [refreshRate, setRefreshRate] = useState<number>(1000); // ms
  
  const [currentTab, setCurrentTab] = useState<'latency' | 'throughput' | 'distribution'>('latency');
  const [selectedScriptKey, setSelectedScriptKey] = useState<string>('acquire');
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(0);
  
  const [searchLogQuery, setSearchLogQuery] = useState<string>('');
  const [selectedChartPoint, setSelectedChartPoint] = useState<SimulationTick | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'failed' | 'expired' | 'system'>('all');
  const [logSort, setLogSort] = useState<'timestamp_newest' | 'latency_high_low' | 'latency_low_high'>('timestamp_newest');
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeLocks, setActiveLocks] = useState<Record<string, ActiveLock>>({});
  const [history, setHistory] = useState<SimulationTick[]>([]);

  // Ref to always hold the latest active locks to avoid nested state update anti-pattern in the interval
  const activeLocksRef = useRef<Record<string, ActiveLock>>({});
  useEffect(() => {
    activeLocksRef.current = activeLocks;
  }, [activeLocks]);

  // Integration & Universal API Mode State
  const [dataSourceMode, setDataSourceMode] = useState<'api' | 'simulated' | 'pasted'>('api');
  
  const resetSimulation = () => {};
  const forceEvictKey = (key: string) => {};
  const [apiConnectionStatus, setApiConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connected');
  const [integrationTab, setIntegrationTab] = useState<'curl' | 'node' | 'python' | 'go'>('curl');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [pastedLogsText, setPastedLogsText] = useState<string>('');
  const [pasteError, setPasteError] = useState<string>('');

  // Fetch telemetry real-time data from Express server when 'api' mode is active
  useEffect(() => {
    if (dataSourceMode !== 'api') return;

    let isSubscribed = true;
    const fetchApiTelemetry = async () => {
      try {
        const response = await api.get<any>('/api/v1/locks/logs');
        const data = response.data;
        
        if (isSubscribed) {
          setLogs(data.logs || []);
          setHistory(data.history || []);
          setActiveLocks(prev => {
            const incoming = data.activeLocks || {};
            const merged: Record<string, ActiveLock> = {};
            for (const [key, lock] of Object.entries(incoming) as [string, any][]) {
              const prevLock = prev[key];
              let leaseHistory = prevLock?.leaseHistory || [];
              
              if (!prevLock || prevLock.clientId !== lock.clientId || prevLock.acquiredAt !== lock.acquiredAt) {
                leaseHistory = [{ timestamp: lock.acquiredAt || Date.now(), type: 'acquire' as const }];
              } else if (prevLock.expiresAt !== lock.expiresAt) {
                leaseHistory = [...leaseHistory, { timestamp: Date.now(), type: 'renew' as const }].slice(-50);
              }
              merged[key] = {
                ...lock,
                leaseHistory
              };
            }
            return merged;
          });
          setStats(data.stats || {
            cumulativeAcquires: 0,
            cumulativeSuccesses: 0,
            cumulativeFailures: 0,
            cumulativeExpirations: 0,
            runningTicks: 0
          });
          setApiConnectionStatus('connected');
        }
      } catch (err) {
        if (isSubscribed) {
          setApiConnectionStatus('error');
        }
      }
    };

    fetchApiTelemetry();
    const intervalTimer = setInterval(fetchApiTelemetry, refreshRate);

    return () => {
      isSubscribed = false;
      clearInterval(intervalTimer);
    };
  }, [dataSourceMode, refreshRate]);
  
  // Script Cache simulated state
  const [isScriptCached, setIsScriptCached] = useState<boolean>(true);
  const [dbClientCount, setDbClientCount] = useState<number>(31);

  // Stats Counters
  const [stats, setStats] = useState({
    cumulativeAcquires: 0,
    cumulativeSuccesses: 0,
    cumulativeFailures: 0,
    cumulativeExpirations: 0,
    runningTicks: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  // --- LUA UTILS ---
  const selectedScript = useMemo(() => LUA_SCRIPTS[selectedScriptKey], [selectedScriptKey]);

  // Handle auto-scroll of console logs
  useEffect(() => {
    // Only auto-scroll to the bottom if the newest logs are not sorted to the top
    if (logSort !== 'timestamp_newest' && logSort !== 'latency_high_low' && logSort !== 'latency_low_high') {
      if (listEndRef.current) {
        listEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [logs, logSort]);

  // --- MATH FORMULAS FOR DESIGN CONTROLLER ---
  const getLatenciesForContention = useCallback((level: typeof contentionLevel) => {
    let avg = 1.2;
    let spread = 0.5;
    let baseMin = 0.3;
    let randomSpikePercent = 0.05;

    switch (level) {
      case 'low':
        avg = 0.8;
        spread = 0.3;
        baseMin = 0.2;
        randomSpikePercent = 0.02;
        break;
      case 'medium':
        avg = 1.4;
        spread = 0.7;
        baseMin = 0.4;
        randomSpikePercent = 0.08;
        break;
      case 'high':
        avg = 3.6;
        spread = 1.8;
        baseMin = 0.9;
        randomSpikePercent = 0.22;
        break;
      case 'extreme':
        avg = 9.4;
        spread = 4.8;
        baseMin = 2.1;
        randomSpikePercent = 0.45;
        break;
    }

    const calculatedAvg = avg + (Math.random() - 0.5) * spread;
    const min = Math.max(baseMin, calculatedAvg * 0.4 + (Math.random() * 0.1));
    
    // Spikes simulation (P95 tail latency)
    const hasSpike = Math.random() < randomSpikePercent;
    const spikeAdder = hasSpike ? (level === 'extreme' ? 18 + Math.random() * 15 : 5 + Math.random() * 8) : 0;
    const max = calculatedAvg * 1.8 + spikeAdder + Math.random() * 2;
    
    // Smooth averages
    const p95 = calculatedAvg * 1.4 + (hasSpike ? spikeAdder * 0.8 : Math.random() * 1.5);

    return {
      avg: parseFloat(calculatedAvg.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      p95: parseFloat(p95.toFixed(2))
    };
  }, []);

  const getSuccessRateForContention = useCallback((level: typeof contentionLevel, activeCount: number) => {
    // Increase failure chance if the keyspace database has high active lock density
    const keySaturationFactor = activeCount / KEYSPACE_POOL.length; // 0 to 1
    
    let baseSuccess = 0.95; // Low
    switch (level) {
      case 'low':
        baseSuccess = 0.96 - keySaturationFactor * 0.1;
        break;
      case 'medium':
        baseSuccess = 0.78 - keySaturationFactor * 0.15;
        break;
      case 'high':
        baseSuccess = 0.48 - keySaturationFactor * 0.25;
        break;
      case 'extreme':
        baseSuccess = 0.18 - keySaturationFactor * 0.15;
        break;
    }
    return Math.max(0.02, Math.min(0.99, baseSuccess));
  }, []);

  // --- WARM UP SIMULATION DATA ON MOUNT ---
  useEffect(() => {
    // Generate 25 data points to populate charts on layout launch
    const initialHistory: SimulationTick[] = [];
    let rollingTicks = 0;
    let rollingAcquires = 0;
    let rollingSuccesses = 0;
    let rollingFailures = 0;
    let rollingExpirations = 0;
    
    // Create random running set of active locks to seed
    const seededActiveLocks: Record<string, ActiveLock> = {};
    const now = Date.now();
    
    // Pre-populate 3-4 active locks with expired timer offsets
    const seedActiveCount = contentionLevel === 'low' ? 1 : contentionLevel === 'medium' ? 3 : 5;
    for (let i = 0; i < seedActiveCount; i++) {
      const lockKey = KEYSPACE_POOL[i % KEYSPACE_POOL.length];
      const duration = 10000 + Math.floor(Math.random() * 8000);
      const acquiredAt = now - (duration * Math.random());
      seededActiveLocks[lockKey] = {
        key: lockKey,
        clientId: `client:tx_${Math.random().toString(16).slice(2, 6)}`,
        expiresAt: now + (duration * Math.random()),
        durationMax: duration,
        acquiredAt: acquiredAt,
        leaseHistory: [{ timestamp: acquiredAt, type: 'acquire' }]
      };
    }

    for (let i = 24; i >= 0; i--) {
      rollingTicks++;
      const pointTime = new Date(now - i * refreshRate);
      const timeLabel = pointTime.toLocaleTimeString([], { hour12: false });
      
      const rate = getSuccessRateForContention(contentionLevel, Object.keys(seededActiveLocks).length);
      const requests = Math.floor(10 + Math.random() * 15);
      const successCount = Math.floor(requests * rate);
      const failCount = requests - successCount;
      
      const lats = getLatenciesForContention(contentionLevel);
      
      rollingAcquires += requests;
      rollingSuccesses += successCount;
      rollingFailures += failCount;

      initialHistory.push({
        timeLabel,
        successes: successCount,
        failures: failCount,
        avgLatency: lats.avg,
        minLatency: lats.min,
        maxLatency: lats.max,
        totalRequests: requests,
        p95Latency: lats.p95
      });
    }

    // Insert dummy logs to keep the styling beautiful
    const dummyLogs: LogEntry[] = [
      {
        id: 'warmup-0',
        timestamp: new Date(now - 8000).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
        type: 'system',
        operation: 'SYSTEM',
        key: 'global',
        message: 'Redis server initialized on port 6379'
      },
      {
        id: 'warmup-1',
        timestamp: new Date(now - 7000).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
        type: 'system',
        operation: 'EVAL',
        key: 'global',
        message: 'Pre-compiling Lua lock scripts (creating EVALSHA targets...)'
      },
      {
        id: 'warmup-2',
        timestamp: new Date(now - 6000).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
        type: 'info',
        operation: 'SYSTEM',
        key: 'global',
        message: 'Verification complete. Lua SHA acquired: d5a2f8c5b1b4...'
      },
      {
        id: 'warmup-3',
        timestamp: new Date(now - 4000).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
        type: 'success',
        operation: 'EVALSHA',
        key: KEYSPACE_POOL[0],
        latency: 1.25,
        message: 'Acquired lock user_auth safely. TTL lease 12000ms.'
      },
      ...Object.values(seededActiveLocks).map((l, index) => ({
        id: `warmup-lock-${index}`,
        timestamp: new Date(l.acquiredAt).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
        type: 'success' as const,
        operation: 'EVALSHA',
        key: l.key,
        latency: 1.1 + Math.random(),
        message: `Acquired lock: owner token '${l.clientId}', TTL lease ${l.durationMax}ms`
      }))
    ];

    setHistory(initialHistory);
    setActiveLocks(seededActiveLocks);
    setLogs(dummyLogs);
    setStats({
      cumulativeAcquires: rollingAcquires,
      cumulativeSuccesses: rollingSuccesses,
      cumulativeFailures: rollingFailures,
      cumulativeExpirations: rollingExpirations,
      runningTicks: rollingTicks,
    });
  }, []);

  // --- ACTIONS: EXPIRE COUNTER TIMER LOOP ---
  useEffect(() => {
    if (dataSourceMode === 'api') return;
    const expireTimerId = setInterval(() => {
      const rightNow = Date.now();
      const currentActiveLocks = activeLocksRef.current;
      const expiredKeys: string[] = [];
      const expiredLocksList: ActiveLock[] = [];

      for (const [k, lock] of Object.entries(currentActiveLocks) as [string, ActiveLock][]) {
        if (rightNow >= lock.expiresAt) {
          expiredKeys.push(k);
          expiredLocksList.push(lock);
        }
      }

      if (expiredKeys.length > 0) {
        // Sequentially execute all state updates at top-level within interval callback,
        // preventing cascading React update warnings.
        
        // 1. Evict expired locks
        setActiveLocks(prev => {
          const next = { ...prev };
          expiredKeys.forEach(k => delete next[k]);
          return next;
        });

        // 2. Logging
        setLogs(logsPrev => {
          const newExpiredLogs = expiredLocksList.map((lock, idx) => ({
            id: `expiry-${rightNow}-${lock.key}-${idx}`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
            type: 'expired' as const,
            operation: 'EXPIRED',
            key: lock.key,
            message: `Lease expired naturally. Lock target '${lock.key}' released by client: '${lock.clientId}'`
          }));
          return [...logsPrev, ...newExpiredLogs].slice(-100);
        });

        // 3. Increment expiration counter
        setStats(sPrev => ({
          ...sPrev,
          cumulativeExpirations: sPrev.cumulativeExpirations + expiredKeys.length
        }));
      }
    }, 250);

    return () => clearInterval(expireTimerId);
  }, []);

  // --- CORE ENGINE TRIGER TICK ---
  const triggerTick = useCallback(() => {
    const curTime = new Date();
    const nowStamp = curTime.toLocaleTimeString([], { hour12: false });
    const nowMs = curTime.getTime();

    // 1. Roll randomized requests inside the tick
    const activeLockKeys = Object.keys(activeLocks);
    const successPercent = getSuccessRateForContention(contentionLevel, activeLockKeys.length);
    
    // How many requests arrive this second?
    const requestCount = Math.floor(10 + Math.random() * 15 + (contentionLevel === 'extreme' ? 18 : contentionLevel === 'high' ? 8 : 0));
    let tickSuccesss = 0;
    let tickFailures = 0;
    
    const newLogs: LogEntry[] = [];
    const updatedLocks = { ...activeLocks };

    // Redis EVAL vs EVALSHA simulation (show occasional EVAL fallback on random nodes)
    const isCacheMiss = Math.random() < 0.03; // 3% chance of EVAL script compile log
    if (isCacheMiss) {
      newLogs.push({
        id: `cachemiss-${nowMs}`,
        timestamp: curTime.toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
        type: 'system',
        operation: 'SYSTEM',
        key: 'cluster',
        message: 'Redis returns NOSCRIPT error. Re-uploading lock Lua scripts, generating d5a2f8c5b1b4 SHA...'
      });
    }

    for (let r = 0; r < requestCount; r++) {
      const selectedKey = KEYSPACE_POOL[Math.floor(Math.random() * KEYSPACE_POOL.length)];
      const token = `client:tx_${Math.random().toString(16).slice(2, 6)}`;
      const latInfo = getLatenciesForContention(contentionLevel);
      const isCurrentlyHeld = !!updatedLocks[selectedKey];

      // Lock acquisition conditional check
      // Under contention, we might hit locks that already exist
      const roll = Math.random();
      const acquisitionSuccessful = !isCurrentlyHeld && (roll < successPercent);

      // 15% chance of renewal heartbeat if the lock is held
      const renewalAttempt = isCurrentlyHeld && (Math.random() < 0.15);

      if (renewalAttempt) {
        tickSuccesss++;
        const extendTtl = 6000 + Math.floor(Math.random() * 4000);
        const lock = updatedLocks[selectedKey];
        const oldHistory = lock.leaseHistory || [];
        
        updatedLocks[selectedKey] = {
          ...lock,
          expiresAt: nowMs + extendTtl,
          durationMax: extendTtl,
          leaseHistory: [...oldHistory, { timestamp: nowMs, type: 'renew' as const }].slice(-50)
        };

        newLogs.push({
          id: `renew-${nowMs}-${r}`,
          timestamp: new Date(nowMs + r * 15).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
          type: 'success',
          operation: 'EVALSHA',
          key: selectedKey,
          latency: Number((latInfo.avg * 0.65).toFixed(2)),
          message: `HEARTBEAT - Renewed atomic lock lease for ${extendTtl}ms. Client: ${lock.clientId}`
        });
      } else if (acquisitionSuccessful) {
        tickSuccesss++;
        const ttl = 8000 + Math.floor(Math.random() * 6000 + (contentionLevel === 'low' ? 3000 : 0));
        
        updatedLocks[selectedKey] = {
          key: selectedKey,
          clientId: token,
          expiresAt: nowMs + ttl,
          durationMax: ttl,
          acquiredAt: nowMs,
          leaseHistory: [{ timestamp: nowMs, type: 'acquire' as const }]
        };

        newLogs.push({
          id: `req-${nowMs}-${r}`,
          timestamp: new Date(nowMs + r * 15).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
          type: 'success',
          operation: isCacheMiss ? 'EVAL' : 'EVALSHA',
          key: selectedKey,
          latency: latInfo.avg,
          message: `SUCCESS - Acquired atomic lock lease for ${ttl}ms. Client: ${token}`
        });
      } else {
        tickFailures++;
        const reason = isCurrentlyHeld 
          ? `Lock already held by client '${updatedLocks[selectedKey].clientId}'` 
          : 'Contention check failed (atomic Lua check returned 0)';
        
        newLogs.push({
          id: `req-${nowMs}-${r}`,
          timestamp: new Date(nowMs + r * 15).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
          type: 'failed',
          operation: isCacheMiss ? 'EVAL' : 'EVALSHA',
          key: selectedKey,
          latency: Number((latInfo.avg * 0.85).toFixed(2)),
          message: `FAILED - lock busy. Reason: ${reason}`
        });
      }
    }

    // 2. Refresh states
    setActiveLocks(updatedLocks);
    setLogs(prev => [...prev, ...newLogs].slice(-100)); // cap logs at 100 entries for react render performance
    
    const latStats = getLatenciesForContention(contentionLevel);
    
    // 3. Append to recharts history array
    setHistory(prev => {
      const nextHistory = [...prev];
      nextHistory.push({
        timeLabel: nowStamp,
        successes: tickSuccesss,
        failures: tickFailures,
        avgLatency: latStats.avg,
        minLatency: latStats.min,
        maxLatency: latStats.max,
        totalRequests: requestCount,
        p95Latency: latStats.p95
      });
      return nextHistory.slice(-30); // Maintain last 30 intervals smoothly
    });

    // 4. Update core totals
    setStats(prev => ({
      ...prev,
      cumulativeAcquires: prev.cumulativeAcquires + requestCount,
      cumulativeSuccesses: prev.cumulativeSuccesses + tickSuccesss,
      cumulativeFailures: prev.cumulativeFailures + tickFailures,
      runningTicks: prev.runningTicks + 1
    }));
  }, [contentionLevel, activeLocks, getLatenciesForContention, getSuccessRateForContention]);

  // --- PROCESS TICK SCHEDULER ---
  useEffect(() => {
    if (isRunning && dataSourceMode === 'simulated') {
      timerRef.current = setInterval(() => {
        triggerTick();
      }, refreshRate);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, refreshRate, triggerTick, dataSourceMode]);

  // --- INTERACTION: EXPLICIT MANUAL OPERATIONS ---
  const triggerManualAcquire = async () => {
    const curTime = new Date();
    const nowMs = curTime.getTime();
    
    // Pick the first free lock key we can find, or randomly pick one to create contention
    const freeKeys = KEYSPACE_POOL.filter(k => !activeLocks[k]);
    const selectedKey = freeKeys.length > 0 ? freeKeys[0] : KEYSPACE_POOL[Math.floor(Math.random() * KEYSPACE_POOL.length)];
    const isCurrentlyHeld = !!activeLocks[selectedKey];
    
    const token = `client:manual_cl_${Math.random().toString(16).slice(2, 5)}`;
    const lat = parseFloat((0.45 + Math.random() * 0.5).toFixed(2));

    if (dataSourceMode === 'api') {
      try {
        const payload = {
          key: selectedKey,
          operation: 'EVALSHA',
          type: isCurrentlyHeld ? 'failed' : 'success',
          latency: lat,
          clientId: token,
          duration: 15000,
          message: isCurrentlyHeld 
            ? `MANUAL ACQU_DENIED (API Mode) - Lock key '${selectedKey}' occupied by client '${activeLocks[selectedKey].clientId}'`
            : `MANUAL ACQU_SUCCESS (API Mode) - Atomically reserved database lock with owner: '${token}'`
        };
        await api.post('/api/v1/locks/logs', payload);
      } catch (err) {
        console.error("API manual acquire failed:", err);
      }
      return;
    }

    if (!isCurrentlyHeld) {
      const ttl = 10000;
      setActiveLocks(prev => {
        const oldHistory = prev[selectedKey]?.leaseHistory || [];
        return {
          ...prev,
          [selectedKey]: {
            key: selectedKey,
            clientId: token,
            expiresAt: nowMs + ttl,
            durationMax: ttl,
            acquiredAt: nowMs,
            leaseHistory: [...oldHistory, { timestamp: nowMs, type: 'acquire' as const }].slice(-50)
          }
        };
      });

      setLogs(prev => [
        ...prev,
        {
          id: `manual-acq-${nowMs}`,
          timestamp: curTime.toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
          type: 'success',
          operation: 'EVALSHA',
          key: selectedKey,
          latency: lat,
          message: `MANUAL ACQU_SUCCESS - Atomically reserved database lock with owner: '${token}'`
        }
      ]);

      setStats(prev => ({
        ...prev,
        cumulativeAcquires: prev.cumulativeAcquires + 1,
        cumulativeSuccesses: prev.cumulativeSuccesses + 1
      }));
    } else {
      setLogs(prev => [
        ...prev,
        {
          id: `manual-acq-fail-${nowMs}`,
          timestamp: curTime.toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
          type: 'failed',
          operation: 'EVALSHA',
          key: selectedKey,
          latency: lat,
          message: `MANUAL ACQU_DENIED - Lock key '${selectedKey}' occupied by client '${activeLocks[selectedKey].clientId}'`
        }
      ]);

      setStats(prev => ({
        ...prev,
        cumulativeAcquires: prev.cumulativeAcquires + 1,
        cumulativeFailures: prev.cumulativeFailures + 1
      }));
    }
  };

  const renewLockKey = async (key: string) => {
    if (dataSourceMode === 'api') {
      try {
        const curTime = new Date();
        const nowMs = curTime.getTime();
        const owner = activeLocks[key]?.clientId || 'unknown';
        const payload = {
          key: key,
          operation: 'EVALSHA',
          type: 'success',
          latency: parseFloat((0.2 + Math.random() * 0.3).toFixed(2)),
          clientId: owner,
          duration: 10000,
          message: `MANUAL RENEW (API Mode) - Atomic heartbeat extended lease for lock '${key}' by owner: '${owner}'`
        };
        await api.post('/api/v1/locks/logs', payload);
      } catch (err) {
        console.error("API manual renew failed:", err);
      }
      return;
    }

    const curTime = new Date();
    const nowMs = curTime.getTime();
    if (activeLocks[key]) {
      const ttl = 10000;
      const oldHistory = activeLocks[key].leaseHistory || [];
      setActiveLocks(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          expiresAt: nowMs + ttl,
          durationMax: ttl,
          leaseHistory: [...oldHistory, { timestamp: nowMs, type: 'renew' as const }].slice(-50)
        }
      }));

      setLogs(prev => [
        ...prev,
        {
          id: `manual-renew-${nowMs}`,
          timestamp: curTime.toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
          type: 'success',
          operation: 'EVALSHA',
          key: key,
          latency: parseFloat((0.2 + Math.random() * 0.3).toFixed(2)),
          message: `MANUAL RENEW - Extended atomic lease duration for key '${key}' to 10000ms (Owner: '${activeLocks[key].clientId}')`
        }
      ]);
    }
  };

  const releaseLockKey = async (key: string) => {
    if (dataSourceMode === 'api') {
      try {
        await api.delete(`/api/v1/locks/lock/${encodeURIComponent(key)}`);
      } catch (err) {
        console.error("API release failed:", err);
      }
      return;
    }

    const curTime = new Date();
    const ownerToken = activeLocks[key]?.clientId || 'unknown';
    
    setActiveLocks(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    setLogs(prev => [
      ...prev,
      {
        id: `evict-${Date.now()}`,
        timestamp: curTime.toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
        type: 'expired',
        operation: 'DEL',
        key: key,
        message: `FORCE EVICTED - Lock key '${key}' purged manually. Released owner client: '${ownerToken}'`
      }
    ]);
  };

  const flushAllState = async () => {
    if (dataSourceMode === 'api') {
      try {
        await api.delete('/api/v1/locks/logs');
      } catch (err) {
        console.error("API flush failed:", err);
      }
      return;
    }

    setActiveLocks({});
    setHistory([]);
    setStats({
      cumulativeAcquires: 0,
      cumulativeSuccesses: 0,
      cumulativeFailures: 0,
      cumulativeExpirations: 0,
      runningTicks: 0,
    });
    setLogs([
      {
        id: `reset-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any),
        type: 'system',
        operation: 'FLUSHALL',
        key: 'global',
        message: 'Redis engine flushed. Cache keyspace evicted and throughput history cleared.'
      }
    ]);
  };

  // --- STATS COMPUTATIONS ---
  const currentAvgLatency = useMemo(() => {
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, point) => acc + point.avgLatency, 0);
    return parseFloat((sum / history.length).toFixed(2));
  }, [history]);

  const currentMaxLatency = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.max(...history.map(point => point.maxLatency));
  }, [history]);

  const successPercentage = useMemo(() => {
    const total = stats.cumulativeSuccesses + stats.cumulativeFailures;
    if (total === 0) return 100;
    return Math.round((stats.cumulativeSuccesses / total) * 100);
  }, [stats]);

  const currentOpsPerSec = useMemo(() => {
    if (history.length === 0) return 0;
    // return average requests of the last 3 tick blocks
    const subset = history.slice(-3);
    const sum = subset.reduce((acc, val) => acc + val.totalRequests, 0);
    return Math.round(sum / subset.length);
  }, [history]);

  // Logs filters computation
  const filteredLogs = useMemo(() => {
    const filtered = logs.filter(log => {
      // 1. Filter type
      if (logFilter !== 'all') {
        if (logFilter === 'success' && log.type !== 'success') return false;
        if (logFilter === 'failed' && log.type !== 'failed') return false;
        if (logFilter === 'expired' && log.type !== 'expired') return false;
        if (logFilter === 'system' && log.type !== 'system' && log.type !== 'warn') return false;
      }
      
      // 2. Query search
      if (searchLogQuery) {
        const query = searchLogQuery.toLowerCase();
        return (
          log.message.toLowerCase().includes(query) ||
          log.key.toLowerCase().includes(query) ||
          log.operation.toLowerCase().includes(query) ||
          log.timestamp.includes(query)
        );
      }
      return true;
    });

    // 3. Apply sorting options
    if (logSort === 'latency_high_low') {
      return [...filtered].sort((a, b) => {
        const latA = a.latency ?? 0;
        const latB = b.latency ?? 0;
        return latB - latA;
      });
    } else if (logSort === 'latency_low_high') {
      return [...filtered].sort((a, b) => {
        const latA = a.latency ?? 0;
        const latB = b.latency ?? 0;
        return latA - latB;
      });
    } else {
      // Default: 'timestamp_newest' (Newest at the top, chronological reverse order of insertion)
      return [...filtered].reverse();
    }
  }, [logs, logFilter, searchLogQuery, logSort]);

  // Latency bucket breakdowns
  const distributionData = useMemo(() => {
    let fast = 0;      // < 1ms
    let normal = 0;    // 1-3ms
    let warning = 0;   // 3-8ms
    let critical = 0;  // > 8ms

    history.forEach(tick => {
      const avg = tick.avgLatency;
      if (avg < 1.0) fast++;
      else if (avg < 3.0) normal++;
      else if (avg < 8.0) warning++;
      else critical++;
    });

    const total = Math.max(1, history.length);
    return [
      { name: 'Ultra-Fast (<1ms)', value: Math.round((fast / total) * 100), color: '#06b6d4' },
      { name: 'Normal (1-3ms)', value: Math.round((normal / total) * 100), color: '#10b981' },
      { name: 'Contested (3-8ms)', value: Math.round((warning / total) * 100), color: '#f59e0b' },
      { name: 'Spike (>8ms)', value: Math.round((critical / total) * 100), color: '#f43f5e' }
    ];
  }, [history]);

  return (
    <div id="lock-monitor-root" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* HEADER SECTION */}
      <header id="dashboard-header" className="border-b border-slate-900 bg-slate-950/80 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/50 border border-cyan-800/60 rounded-xl shadow-inner text-cyan-400">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white">Lock Acquisition Monitor</h1>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Real-time performance latency tracking & Redis Lua transaction analyzer</p>
            </div>
          </div>

          {/* TELEMETRY METRICS IN HEADER */}
          <div className="flex flex-wrap items-center gap-3 text-xs md:self-center">
            <div className="px-3 py-1.5 bg-slate-900/80 border border-slate-800/80 rounded-lg flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Redis-Node:</span>
              <span className="font-mono text-cyan-300 font-semibold bg-cyan-950/40 px-1 py-0.5 rounded">6379-Active</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-900/80 border border-slate-800/80 rounded-lg flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">SHA Caching:</span>
              <span className="font-mono text-emerald-300 font-semibold bg-emerald-950/40 px-1 py-0.5 rounded">Enabled (100%)</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-900/80 border border-slate-800/80 rounded-lg flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-slate-400">Clock (UTC):</span>
              <span className="font-mono text-violet-300 font-medium">2026-06-05 13:07:52</span>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* CONNECTION & DATA SOURCE CENTRAL PANEL */}
        <section id="datasource-config-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-md font-semibold text-white">Universal Data Connection Center</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Configure where this dashboard receives its telemetry. Connect your real-world applications or explore with the built-in active sandbox.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setDataSourceMode('simulated')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dataSourceMode === 'simulated'
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Simulated Sandbox
                </button>
                <button
                  onClick={() => setDataSourceMode('api')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dataSourceMode === 'api'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Live Ingest Router (Real Mode)
                </button>
                <button
                  onClick={() => setDataSourceMode('pasted')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dataSourceMode === 'pasted'
                      ? 'bg-purple-600 text-white font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Import File/Paste
                </button>
              </div>
            </div>

            {/* Simulated Sandbox Explainer & Controller */}
            {dataSourceMode === 'simulated' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-slate-950/40 p-4 border border-cyan-950/40 rounded-xl animate-fade-in">
                <div className="md:col-span-8 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Active Sandbox Mode</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-200">Local Automated Traffic Generator</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The dashboard is presently running a real-time reactive model loop that simulates transactional Redis workloads. 
                    No external configuration is required for this demo. Adjust contention settings below to observe graph fluctuations.
                  </p>
                </div>
                <div className="md:col-span-4 flex justify-end gap-3">
                  <div className="text-xs text-right bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 font-mono w-full">
                    <div className="text-slate-500 uppercase text-[10px]">Simulation State</div>
                    <div className="text-emerald-400 font-semibold mt-1">
                      {isRunning ? '▶ Running (Auto)' : '⏸ Paused'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live REST Ingest Explainer */}
            {dataSourceMode === 'api' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl">
                  <div className="md:col-span-8 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${apiConnectionStatus === 'connected' ? 'bg-cyan-500 animate-pulse' : 'bg-rose-500'}`}></span>
                      <span className={`text-xs font-semibold ${apiConnectionStatus === 'connected' ? 'text-cyan-400' : 'text-rose-400'} tracking-wide uppercase`}>
                        {apiConnectionStatus === 'connected' ? 'Listening for Live Telemetry Stream' : 'Connection Fault'}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-200">Universal Direct Ingestion Node</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This applet compiles with a real Node.js server. Integrate the code stub below in your real backend or script to pipe real lock latency, key hits, or application states directly into this view.
                    </p>
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-center">
                      <div className="text-slate-500 text-[10px] uppercase">Listener Status</div>
                      <div className="text-cyan-400 font-mono font-semibold text-xs mt-1 truncate">
                        {apiConnectionStatus === 'connected' ? 'Connected (Port 3000)' : 'Reconnecting...'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-[11px] font-mono select-all">
                      <span className="text-slate-500 px-1 truncate">POST Endpoint</span>
                      <input 
                        type="text" 
                        readOnly 
                        value={`${origin}/api/logs`} 
                        className="bg-transparent border-0 outline-0 ring-0 text-cyan-300 w-full font-mono text-right text-[10px]"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${origin}/api/logs`);
                          setCopiedText(true);
                          setTimeout(() => setCopiedText(false), 2000);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 transition-all font-sans cursor-pointer"
                        title="Copy API Endpoint"
                      >
                        {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stubs and Integration Tabs */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden p-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
                    <span className="text-xs font-semibold text-slate-300">Copy-Pasteable Integration Stubs</span>
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px]">
                      {(['curl', 'node', 'python', 'go'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setIntegrationTab(tab)}
                          className={`px-2.5 py-1 rounded capitalize font-medium cursor-pointer ${
                            integrationTab === tab ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-300 max-h-[160px] overflow-y-auto relative">
                    {integrationTab === 'curl' && (
                      <pre className="whitespace-pre-wrap">{`curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "lock:payment_charge:115",
    "operation": "EVALSHA",
    "type": "success",
    "latency": 1.45,
    "clientId": "client:remote_cl_09",
    "duration": 15000,
    "message": "Real lock acquired dynamically via cURL shell stub"
  }' \\
  \${origin}/api/logs`}</pre>
                    )}
                    {integrationTab === 'node' && (
                      <pre className="whitespace-pre-wrap">{`// Node.js redis client telemetry middleware
import axios from 'axios';

async function logToDashboard(key, type, latencyMs, clientToken, leaseTimeMs) {
  try {
    await axios.post('\${origin}/api/logs', {
      key,
      operation: 'EVALSHA',
      type: type, // 'success' | 'failed' | 'expired'
      latency: latencyMs,
      clientId: clientToken,
      duration: leaseTimeMs,
      message: \`Node.js redis acquire \${type} lock for key \${key}\`
    });
  } catch (err) {
    console.debug('Dashboard unreachable:', err.message);
  }
}`}</pre>
                    )}
                    {integrationTab === 'python' && (
                      <pre className="whitespace-pre-wrap">{`# Python Telemetry Hook decorator
import requests, time

def lock_telemetry(key_name, client_id, lease_ms):
    start = time.perf_counter()
    # Replace with real redis lock evaluation logic
    success = True 
    elapsed_ms = (time.perf_counter() - start) * 1000

    try:
        requests.post('\${origin}/api/logs', json={
            "key": key_name,
            "operation": "EVALSHA",
            "type": "success" if success else "failed",
            "latency": round(elapsed_ms, 2),
            "clientId": client_id,
            "duration": lease_ms,
            "message": f"Python lock client acquired key {key_name} dynamically."
        }, timeout=0.5)
    except Exception:
        pass`}</pre>
                    )}
                    {integrationTab === 'go' && (
                      <pre className="whitespace-pre-wrap">{`// Go telemetry post wrapper
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func LogEvent(key string, latency float64, success bool) {
    status := "success"
    if !success { status = "failed" }
    
    payload := map[string]interface{}{
        "key":       key,
        "operation": "EVALSHA",
        "type":      status,
        "latency":   latency,
        "message":   "Golang lock client performance callback",
    }
    
    body, _ := json.Marshal(payload)
    http.Post("\${origin}/api/logs", "application/json", bytes.NewBuffer(body))
}`}</pre>
                    )}
                    <button
                      onClick={() => {
                        let textToCopy = '';
                        if (integrationTab === 'curl') textToCopy = `curl -X POST -H "Content-Type: application/json" -d '{"key": "lock:payment_charge:115", "operation": "EVALSHA", "type": "success", "latency": 1.45, "clientId": "client:remote_cl_09", "duration": 15000, "message": "Real lock acquired dynamically via cURL shell stub"}' \${origin}/api/logs`;
                        else if (integrationTab === 'node') textToCopy = `// Node.js redis client telemetry middleware\nimport axios from 'axios';\n\nasync function logToDashboard(key, type, latencyMs, clientToken, leaseTimeMs) {\n  try {\n    await axios.post('\${origin}/api/logs', {\n      key,\n      operation: 'EVALSHA',\n      type: type,\n      latency: latencyMs,\n      clientId: clientToken,\n      duration: leaseTimeMs,\n      message: \`Node.js redis acquire \\\${type} lock for key \\\${key}\`\n    });\n  } catch (err) {\n    console.debug('Dashboard unreachable:', err.message);\n  }\n}`;
                        else if (integrationTab === 'python') textToCopy = `# Python Telemetry Hook\nimport requests, time\n\ndef lock_telemetry(key_name, client_id, lease_ms):\n    start = time.perf_counter()\n    success = True\n    elapsed_ms = (time.perf_counter() - start) * 1055\n    try:\n        requests.post('\${origin}/api/logs', json={\n            "key": key_name,\n            "operation": "EVALSHA",\n            "type": "success" if success else "failed",\n            "latency": round(elapsed_ms, 2),\n            "clientId": client_id,\n            "duration": lease_ms,\n            "message": f"Python lock client acquired key {key_name} dynamically."\n        }, timeout=0.5)\n    except Exception:\n        pass`;
                        else if (integrationTab === 'go') textToCopy = `package main\nimport (\n    "bytes"\n    "encoding/json"\n    "net/http"\n)\nfunc LogEvent(key string, latency float64, success bool) {\n    status := "success"\n    if !success { status = "failed" }\n    payload := map[string]interface{}{\n        "key":       key,\n        "operation": "EVALSHA",\n        "type":      status,\n        "latency":   latency,\n        "message":   "Golang lock client performance callback",\n    }\n    body, _ := json.Marshal(payload)\n    http.Post("\${origin}/api/logs", "application/json", bytes.NewBuffer(body))\n}`;
                        
                        navigator.clipboard.writeText(textToCopy);
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1 text-[10px] cursor-pointer"
                      title="Copy Integration Stub"
                    >
                      {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Stub</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Paste Raw Log Dump Section */}
            {dataSourceMode === 'pasted' && (
              <div className="space-y-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl animate-fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping block"></span>
                    <span className="text-xs font-semibold text-purple-400 tracking-wide uppercase">Raw Log Ingestion Mode</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-200">Import/Paste Engineering Log Telemetry</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Import real Redis log segments, CSV performance telemetry, or a complete JSON array. The dashboard parses timestamps, latency scores, operations, and success statuses to instantly map out charts.
                  </p>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={pastedLogsText}
                    onChange={(e) => {
                      setPastedLogsText(e.target.value);
                      setPasteError('');
                    }}
                    placeholder={`Paste a JSON array of lock telemetry:
[
  { "key": "lock:user_auth:312", "type": "success", "latency": 1.2, "message": "Success lock" },
  { "key": "lock:payment:555", "type": "failed", "latency": 0.8, "message": "Blocked client occupancy" }
]`}
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-800 focus:border-purple-500/80 rounded-xl p-3 outline-none text-slate-300"
                  />
                  
                  {pasteError && (
                    <div className="text-[11px] text-rose-400 font-mono flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{pasteError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        const sampleLogs = [
                          { key: 'lock:payment_charge:115', operation: 'EVALSHA', type: 'success', latency: 0.95, message: 'Sample Ingest lock payment success' },
                          { key: 'lock:user_auth:9021', operation: 'EVALSHA', type: 'success', latency: 1.15, message: 'Sample Ingest lock auth success' },
                          { key: 'lock:user_auth:9021', operation: 'EVALSHA', type: 'failed', latency: 0.35, message: 'Sample Ingest lock busy auth' },
                          { key: 'lock:inventory_sku_993', operation: 'EVALSHA', type: 'success', latency: 12.8, message: 'Sample Ingest lock inventory spike success' },
                          { key: 'lock:db_backup_worker', operation: 'DEL', type: 'released', latency: 0.45, message: 'Sample Ingest lock backup released' }
                        ];
                        setPastedLogsText(JSON.stringify(sampleLogs, null, 2));
                      }}
                      className="text-[11px] font-sans font-medium text-pink-400 hover:text-pink-300 transition-all cursor-pointer underline"
                    >
                      Pre-populate Sample Logs Template
                    </button>

                    <button
                      onClick={() => {
                        try {
                          if (!pastedLogsText.trim()) {
                            setPasteError("Pasted text is empty.");
                            return;
                          }
                          const parsed = JSON.parse(pastedLogsText);
                          const cleanArr = Array.isArray(parsed) ? parsed : [parsed];
                          
                          // Convert parsed events to real log format
                          const now = Date.now();
                          const nowStr = new Date().toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any);
                          
                          const newLogs: LogEntry[] = cleanArr.map((item: any, idx: number) => ({
                            id: item.id || `paste-${now}-${idx}-${Math.random().toString(16).slice(2, 4)}`,
                            timestamp: item.timestamp || nowStr,
                            type: item.type || 'success',
                            operation: item.operation || 'EVALSHA',
                            key: item.key || 'lock:pasted_res',
                            latency: parseFloat(item.latency) || 1.0,
                            message: item.message || `PASTED - Resource ${item.key ?? 'resource'} locked.`
                          }));

                          // Build custom simulation tick out of the paste events
                          let successes = 0;
                          let failures = 0;
                          let totalLat = 0;
                          let maxLat = 0;
                          let minLat = 999999;
                          newLogs.forEach(l => {
                            if (l.type === 'success') successes++;
                            else if (l.type === 'failed') failures++;
                            const lNum = l.latency || 1.0;
                            totalLat += lNum;
                            if (lNum > maxLat) maxLat = lNum;
                            if (lNum < minLat) minLat = lNum;
                          });
                          minLat = minLat === 999999 ? 0.3 : minLat;
                          const avgLat = newLogs.length > 0 ? parseFloat((totalLat / newLogs.length).toFixed(2)) : 1.0;

                          const newTick: SimulationTick = {
                            timeLabel: 'Import Tick',
                            successes,
                            failures,
                            avgLatency: avgLat,
                            minLatency: minLat,
                            maxLatency: maxLat,
                            totalRequests: newLogs.length,
                            p95Latency: parseFloat((avgLat * 1.25).toFixed(2))
                          };

                          setLogs(newLogs);
                          setHistory([newTick]);
                          setStats({
                            cumulativeAcquires: newLogs.length,
                            cumulativeSuccesses: successes,
                            cumulativeFailures: failures,
                            cumulativeExpirations: 0,
                            runningTicks: 1
                          });
                          setPasteError("");
                        } catch (err: any) {
                          setPasteError(`Invalid JSON sequence: ${err.message}`);
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95 shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Process & Map Telemetry</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* INTERACTIVE CONTROLS BAR */}
        <section id="control-bar-card" className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointers-events-none"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Play controls & Speed config */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                id="btn-toggle-play"
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all transform active:scale-95 ${
                  isRunning 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause Stream</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume Stream</span>
                  </>
                )}
              </button>

              <div className="flex items-center bg-slate-950/85 border border-slate-800 p-1 rounded-xl">
                <span className="text-xs text-slate-400 px-3 font-medium">Refresh Interval</span>
                { [500, 1000, 2000, 5000].map(ms => (
                  <button
                    key={ms}
                    id={`btn-interval-${ms}`}
                    onClick={() => setRefreshRate(ms)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all font-semibold ${
                      refreshRate === ms 
                        ? 'bg-cyan-500 text-slate-950 shadow-md' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ms >= 1000 ? `${ms/1000}s` : `${ms}ms`}
                  </button>
                ))}
              </div>
            </div>

            {/* Config Contentions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-300 font-semibold tracking-wider uppercase">Contention Level</span>
              </div>
              <div className="grid grid-cols-4 p-1 bg-slate-950/85 border border-slate-800 rounded-xl">
                { (['low', 'medium', 'high', 'extreme'] as const).map(level => {
                  const labelStyles = {
                    low: 'text-emerald-400 border-emerald-950/40 hover:bg-emerald-950/20 active:bg-emerald-950',
                    medium: 'text-cyan-400 border-cyan-950/40 hover:bg-cyan-950/20 active:bg-cyan-950',
                    high: 'text-amber-500 border-amber-950/40 hover:bg-amber-950/20 active:bg-amber-950',
                    extreme: 'text-rose-500 border-rose-950/40 hover:bg-rose-950/20 active:bg-rose-950'
                  };

                  const activeStyles = {
                    low: 'bg-emerald-500 text-slate-950 font-bold',
                    medium: 'bg-cyan-500 text-slate-950 font-bold',
                    high: 'bg-amber-500 text-slate-950 font-bold',
                    extreme: 'bg-rose-500 text-slate-950 font-bold'
                  };

                  const isSelected = contentionLevel === level;
                  
                  return (
                    <button
                      key={level}
                      id={`btn-contention-${level}`}
                      onClick={() => setContentionLevel(level)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize tracking-wide transition-all ${
                        isSelected 
                          ? activeStyles[level] 
                          : `text-slate-400 ${labelStyles[level]}`
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playground Manual Request Actions */}
            <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800/80">
              <button
                id="btn-manual-acquire"
                onClick={triggerManualAcquire}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-800/40 hover:border-cyan-500/80 text-cyan-400 rounded-lg text-xs transition-all active:scale-95 text-nowrap font-medium"
                title="EVALSHA Acquire lock script on Redis"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                <span>Acquire lock</span>
              </button>
              <button
                id="btn-reset-simulation"
                onClick={resetSimulation}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 rounded-lg transition-all"
                title="Flush keyspace and logs history"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* METRICS LEVEL SECTION */}
        <section id="metrics-deck" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* SUCCESS RATE CARD */}
          <div id="stat-card-success-rate" className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[120px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Lock Success Rate</p>
                <h3 className="text-3xl font-bold tracking-tight text-white mt-1">
                  {successPercentage}%
                </h3>
              </div>
              <div className={`p-2 rounded-xl border ${
                successPercentage > 80 
                  ? 'bg-emerald-950/30 border-emerald-800/20 text-emerald-400' 
                  : successPercentage > 50 
                    ? 'bg-amber-950/30 border-amber-800/20 text-amber-500' 
                    : 'bg-rose-950/30 border-rose-800/20 text-rose-400'
              }`}>
                <Gauge className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-auto">
              {/* Colored progress bar representation */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 ${
                    successPercentage > 80 ? 'bg-emerald-500' : successPercentage > 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${successPercentage}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-400 text-nowrap">
                {stats.cumulativeSuccesses}/{stats.cumulativeSuccesses + stats.cumulativeFailures} acq
              </span>
            </div>
          </div>

          {/* SCRIPT LATENCY CARD */}
          <div id="stat-card-latency" className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-[120px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Avg Script Latency</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <h3 className="text-3xl font-bold tracking-tight text-cyan-400">
                    {currentAvgLatency}
                  </h3>
                  <span className="text-xs text-cyan-500 font-mono font-semibold">ms</span>
                </div>
              </div>
              <div className="p-2 bg-cyan-950/30 border border-cyan-850/20 text-cyan-400 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/50 pt-1.5 mt-auto">
              <div>Min: <span className="text-emerald-400 font-semibold">{history.length > 0 ? Math.min(...history.map(h => h.minLatency)) : 0}ms</span></div>
              <div className="h-2.5 w-[1px] bg-slate-800"></div>
              <div>Max Load: <span className="text-rose-400 font-semibold">{currentMaxLatency}ms</span></div>
            </div>
          </div>

          {/* ACTIVE LOCK COUNTER */}
          <div id="stat-card-active-leases" className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-[120px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Active Leased Locks</p>
                <h3 className="text-3xl font-bold tracking-tight text-amber-500 mt-1">
                  {Object.keys(activeLocks).length}
                </h3>
              </div>
              <div className="p-2 bg-amber-950/30 border border-amber-850/20 text-amber-500 rounded-xl">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/50 pt-1.5 mt-auto">
              <span className="text-[10px] uppercase font-semibold font-mono text-slate-500">Keyspace Capacity</span>
              <span className="font-mono text-slate-300 font-semibold">
                {Object.keys(activeLocks).length} / {KEYSPACE_POOL.length} allocated
              </span>
            </div>
          </div>

          {/* DATABASE THROUGHPUT */}
          <div id="stat-card-throughput" className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-[120px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Cluster Throughput</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <h3 className="text-3xl font-bold tracking-tight text-violet-400">
                    {currentOpsPerSec}
                  </h3>
                  <span className="text-xs text-violet-500 font-semibold">ops/sec</span>
                </div>
              </div>
              <div className="p-2 bg-violet-950/30 border border-violet-850/20 text-violet-400 rounded-xl">
                <TrendingUp className="w-5 h-5 text-violet-400" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/50 pt-1.5 mt-auto">
              <span className="text-[10px] uppercase font-semibold font-mono text-slate-500">Total Runs</span>
              <span className="font-mono text-slate-300 font-semibold">
                {stats.cumulativeAcquires.toLocaleString()} EVALS
              </span>
            </div>
          </div>

        </section>

        {/* MIDDLE SECTION - CHARTS + CODE INSPECTOR */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* VISUALIZATION PANEL (7 col) */}
          <div id="chart-visualizer-container" className="lg:col-span-7 bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-800/65 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Live Stream Analytics</h2>
              </div>

              {/* Chart Tabs selector */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  id="tab-btn-latency"
                  onClick={() => setCurrentTab('latency')}
                  className={`px-3 py-1 text-xs rounded transition-all font-semibold ${
                    currentTab === 'latency' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Latency Streams
                </button>
                <button
                  id="tab-btn-throughput"
                  onClick={() => setCurrentTab('throughput')}
                  className={`px-3 py-1 text-xs rounded transition-all font-semibold ${
                    currentTab === 'throughput' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Acquisition Success
                </button>
                <button
                  id="tab-btn-distribution"
                  onClick={() => setCurrentTab('distribution')}
                  className={`px-3 py-1 text-xs rounded transition-all font-semibold ${
                    currentTab === 'distribution' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tail Spill
                </button>
              </div>
            </div>

            {/* DIAGNOSTIC ACTIVE PANEL HUD */}
            {selectedChartPoint && (
              <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in text-xs font-mono relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-cyan-950/60 text-cyan-400 font-bold uppercase tracking-wider text-[8px] border-b border-l border-slate-800/85 rounded-bl select-none">
                  Diagnostic Scope Active
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span className="font-bold">INSPECTING ATOMIC TICK: {selectedChartPoint.timeLabel}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Avg Latency: <span className="text-cyan-400 font-bold">{selectedChartPoint.avgLatency}ms</span> | Peak Spike: <span className="text-rose-400 font-bold">{selectedChartPoint.maxLatency}ms</span> | successes: <span className="text-emerald-400 font-bold">{selectedChartPoint.successes}</span> | fails: <span className="text-rose-400 font-bold">{selectedChartPoint.failures}</span>
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSearchLogQuery(selectedChartPoint.timeLabel);
                      setLogFilter('all');
                    }}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                      searchLogQuery === selectedChartPoint.timeLabel
                        ? 'bg-cyan-950/60 border-cyan-850 text-cyan-400 font-extrabold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    title="Filter executions log to this exact second"
                  >
                    <Search className="w-3 h-3 text-cyan-400" />
                    <span>Filter Second</span>
                  </button>
                  
                  {(() => {
                    // Try to find the highest spike log occurring during this second
                    const tickLogs = logs.filter(l => l.timestamp.startsWith(selectedChartPoint.timeLabel));
                    const sortedByLatency = [...tickLogs].sort((a,b) => (b.latency || 0) - (a.latency || 0));
                    const highestSpike = sortedByLatency[0];
                    
                    if (highestSpike && highestSpike.latency) {
                      const isIsolated = searchLogQuery === highestSpike.timestamp;
                      return (
                        <button
                          onClick={() => {
                            setSearchLogQuery(highestSpike.timestamp);
                            setLogFilter('all');
                          }}
                          className={`px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                            isIsolated
                              ? 'bg-rose-950/60 border-rose-800 text-rose-400 font-extrabold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                          title={`Isolate peak spike transaction at ${highestSpike.timestamp} (${highestSpike.latency}ms)`}
                        >
                          <Zap className="w-3 h-3 text-rose-400 fill-rose-950" />
                          <span>Isolate Spike ({highestSpike.latency}ms)</span>
                        </button>
                      );
                    }
                    return null;
                  })()}

                  {(() => {
                    // Find most contested key pattern during this tick
                    const tickLogs = logs.filter(l => l.timestamp.startsWith(selectedChartPoint.timeLabel));
                    const keyCounts: Record<string, number> = {};
                    tickLogs.forEach(l => {
                      if (l.key && l.key !== 'global' && l.key !== 'cluster') {
                        keyCounts[l.key] = (keyCounts[l.key] || 0) + 1;
                      }
                    });
                    const sortedKeys = Object.entries(keyCounts).sort((a, b) => b[1] - a[1]);
                    if (sortedKeys.length > 0) {
                      const busyKey = sortedKeys[0][0];
                      const isKeyFiltered = searchLogQuery === busyKey;
                      return (
                        <button
                          onClick={() => {
                            setSearchLogQuery(busyKey);
                            setLogFilter('all');
                          }}
                          className={`px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                            isKeyFiltered
                              ? 'bg-amber-950/60 border-amber-800 text-amber-400 font-extrabold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                          title={`Filter executions to the busy lock key: ${busyKey}`}
                        >
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>Filter Key ({busyKey.replace('lock:', '')})</span>
                        </button>
                      );
                    }
                    return null;
                  })()}

                  <button
                    onClick={() => {
                      setSelectedChartPoint(null);
                      setSearchLogQuery('');
                    }}
                    className="p-1.5 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 rounded-lg text-slate-400 hover:text-white transition-all ml-1 cursor-pointer"
                    title="Clear diagnostics scope filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* CHART DISPLAY CORE */}
            <div className="h-[280px]">
              {currentTab === 'latency' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={history} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        const clickedData = state.activePayload[0].payload as SimulationTick;
                        setSelectedChartPoint(clickedData);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d293d" opacity={0.6} />
                    <XAxis 
                      dataKey="timeLabel" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false}
                      label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', style: { fill: '#475569', fontSize: 10 }, offset: 10 }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const isPointLocked = selectedChartPoint?.timeLabel === label;
                          return (
                            <div className={`bg-slate-950/98 border p-3.5 rounded-xl shadow-2xl font-mono text-xs max-w-[280px] transition-all ${isPointLocked ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-slate-950' : 'border-slate-800'}`}>
                              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2">
                                <span className="text-white font-bold">{label}</span>
                                {isPointLocked && (
                                  <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded font-semibold animate-pulse">LOCKED</span>
                                )}
                              </div>
                              <div className="space-y-1">
                                {payload.map((p, i) => (
                                  <p key={i} style={{ color: p.color }} className="flex justify-between gap-6 py-0.5">
                                    <span>{p.name}:</span>
                                    <span className="font-bold">{p.value} ms</span>
                                  </p>
                                ))}
                              </div>
                              {isPointLocked ? (
                                <div className="mt-2.5 border-t border-cyan-950/40 pt-2 text-[10px] font-sans text-cyan-400/90 leading-normal">
                                  <div className="flex items-center gap-1.5 font-bold mb-1">
                                    <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                    <span>Quick Diagnostics Ready</span>
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-sans">Options active in HUD banner. Click elsewhere to switch target.</p>
                                </div>
                              ) : (
                                <div className="mt-2.5 border-t border-slate-900 pt-2 text-[10px] text-slate-500 font-sans flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                                  <span>Click point to run Quick Actions & isolate logs</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                    <Area 
                      type="monotone" 
                      dataKey="p95Latency" 
                      name="P95 Spike Latency" 
                      stroke="#f43f5e" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorMax)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avgLatency" 
                      name="Average Execution" 
                      stroke="#06b6d4" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorAvg)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="minLatency" 
                      name="Min Latency" 
                      stroke="#10b981" 
                      strokeWidth={1.5} 
                      strokeDasharray="4 4" 
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {currentTab === 'throughput' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={history} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        const clickedData = state.activePayload[0].payload as SimulationTick;
                        setSelectedChartPoint(clickedData);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d293d" opacity={0.6} />
                    <XAxis 
                      dataKey="timeLabel" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false}
                      label={{ value: 'Acquisitions / Tick', angle: -90, position: 'insideLeft', style: { fill: '#475569', fontSize: 10 }, offset: 10 }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const total = (payload[0]?.value as number || 0) + (payload[1]?.value as number || 0);
                          const pct = total > 0 ? Math.round(((payload[0]?.value as number || 0) / total) * 100) : 0;
                          const isPointLocked = selectedChartPoint?.timeLabel === label;
                          return (
                            <div className={`bg-slate-950/98 border p-3.5 rounded-xl shadow-2xl font-mono text-xs max-w-[280px] transition-all ${isPointLocked ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-slate-950' : 'border-slate-800'}`}>
                              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2">
                                <span className="text-white font-bold">{label}</span>
                                {isPointLocked && (
                                  <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded font-semibold animate-pulse">LOCKED</span>
                                )}
                              </div>
                              <div className="space-y-1">
                                {payload.map((p, i) => (
                                  <p key={i} style={{ color: p.color }} className="flex justify-between gap-6 py-0.5">
                                    <span>{p.name}:</span>
                                    <span className="font-bold">{p.value} requests</span>
                                  </p>
                                ))}
                              </div>
                              <div className="mt-2 border-t border-slate-900 pt-1.5 flex justify-between font-bold text-cyan-400">
                                <span>Success Rate:</span>
                                <span>{pct}%</span>
                              </div>
                              {isPointLocked ? (
                                <div className="mt-2.5 border-t border-cyan-950/40 pt-2 text-[10px] font-sans text-cyan-400/90 leading-normal">
                                  <div className="flex items-center gap-1.5 font-bold mb-1">
                                    <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                    <span>Quick Diagnostics Ready</span>
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-sans">Options active in HUD banner. Click elsewhere to switch target.</p>
                                </div>
                              ) : (
                                <div className="mt-2.5 border-t border-slate-900 pt-2 text-[10px] text-slate-500 font-sans flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                                  <span>Click point to run Quick Actions & isolate logs</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                    <Bar dataKey="successes" name="Success Acquisitions" fill="#10b981" radius={[2, 2, 0, 0]} stackId="a" />
                    <Bar dataKey="failures" name="Rejected (Namespace Busy)" fill="#f43f5e" radius={[2, 2, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {currentTab === 'distribution' && (
                <div className="flex flex-col md:flex-row items-center justify-around h-full p-4 gap-6">
                  {/* Custom progress bars representing tail distributions */}
                  <div className="w-full space-y-4">
                    <p className="text-xs text-slate-400 mb-2">
                      Tail latencies measure execution outliers. Below is the historical percentage of ticks categorised:
                    </p>
                    <div className="space-y-3">
                      {distributionData.map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-300 font-medium">{item.name}</span>
                            <span className="font-bold" style={{ color: item.color }}>{item.value}% of ticks</span>
                          </div>
                          <div className="bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ width: `${item.value}%`, backgroundColor: item.color }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Educational insight box based on selected contention load */}
                  <div className="w-full max-w-[260px] bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl text-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold uppercase tracking-wider text-[10px]">
                      <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span>Cluster Diagnoses</span>
                    </div>
                    { contentionLevel === 'low' && (
                      <p className="text-slate-400 leading-relaxed">
                        <strong className="text-emerald-400">Optimal Performance:</strong> The single keyspace locks are resolved instantly with minor network overlay. Under-congested nodes execute Lua scripts in sub-millisecond ranges.
                      </p>
                    )}
                    { contentionLevel === 'medium' && (
                      <p className="text-slate-400 leading-relaxed">
                        <strong className="text-cyan-400">Normal Operations:</strong> Moderate lease contentions are occurring. Single threading limits do not saturate context, resulting in highly stable atomic latency.
                      </p>
                    )}
                    { contentionLevel === 'high' && (
                      <p className="text-slate-400 leading-relaxed">
                        <strong className="text-amber-500">Resource Contention:</strong> Colliding atomic lock allocations block worker threads. Execution timers drift, generating outliers (tail spike latencies) above p95 bounds.
                      </p>
                    )}
                    { contentionLevel === 'extreme' && (
                      <p className="text-slate-400 leading-relaxed">
                        <strong className="text-rose-500">Lock storm warning:</strong> extreme concurrent attempts generate massive retries. Redis client queue is highly saturated, forcing script execution latency spikes.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick historical aggregate metrics info */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-slate-950/50 rounded-xl p-3 border border-slate-900">
              <div>
                <span className="text-slate-500 font-medium block">Total EVAL SHA runs</span>
                <span className="font-mono text-cyan-400 font-bold text-sm block mt-0.5">{stats.cumulativeAcquires}</span>
              </div>
              <div className="border-x border-slate-800/60">
                <span className="text-slate-500 font-medium block">Acq Success Ratio</span>
                <span className="font-mono text-emerald-400 font-bold text-sm block mt-0.5">{parseFloat(((stats.cumulativeSuccesses / Math.max(1, stats.cumulativeAcquires)) * 100).toFixed(1))}%</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Locks Expired</span>
                <span className="font-mono text-amber-500 font-bold text-sm block mt-0.5">{stats.cumulativeExpirations}</span>
              </div>
            </div>
          </div>

          {/* CODE INSPECTOR PANEL (5 col) */}
          <div id="lua-script-inspector" className="lg:col-span-5 bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800/65 pb-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Lua Script Inspector</h2>
              </div>
              
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 select-none">
                { Object.keys(LUA_SCRIPTS).map(key => (
                  <button
                    key={key}
                    id={`script-tab-${key}`}
                    onClick={() => {
                      setSelectedScriptKey(key);
                      setSelectedLineIndex(0);
                    }}
                    className={`px-2.5 py-1 text-[10px] rounded font-semibold capitalize transition-all ${
                      selectedScriptKey === key ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* MONOSPACE CODE EDITOR BLOCK */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] leading-relaxed relative flex flex-col justify-between overflow-x-auto min-h-[220px]">
              <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-40 select-none pointer-events-none">
                <span className="text-[9px] font-semibold bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">redis-lua</span>
              </div>

              <div id="code-lines-container" className="space-y-1">
                {selectedScript.lines.map((item, index) => {
                  const isHovered = hoveredLineIndex === index;
                  const isSelected = selectedLineIndex === index;
                  return (
                    <div
                      key={index}
                      onMouseEnter={() => setHoveredLineIndex(index)}
                      onMouseLeave={() => setHoveredLineIndex(null)}
                      onClick={() => setSelectedLineIndex(index)}
                      className={`flex items-start gap-3 px-2 py-0.5 rounded cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-cyan-950/70 border-l-2 border-cyan-400 text-cyan-200' 
                          : isHovered 
                            ? 'bg-slate-900 text-white' 
                            : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-4 text-right text-slate-600 select-none font-bold">{index + 1}</span>
                      <pre className="flex-1 whitespace-pre">{item.code}</pre>
                      
                      { item.perf !== 'Meta' && (
                        <span className={`text-[8px] px-1 py-0.2 rounded font-semibold tracking-wider font-mono uppercase ${
                          item.perf === 'O(1)' ? 'bg-emerald-950/60 border border-emerald-900/40 text-emerald-400' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {item.perf}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SELECTED LINE METADATA DESCRIPTOR */}
            <div id="inspector-line-explanation" className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-2 min-h-[90px]">
              {selectedLineIndex !== null ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 font-mono">
                      Line {selectedLineIndex + 1} Detail
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      Performance: {selectedScript.lines[selectedLineIndex].perf}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedScript.lines[selectedLineIndex].desc}
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-full text-slate-500 text-xs py-2 select-none">
                  <Info className="w-5 h-5 opacity-40 mb-1" />
                  <span>Click any line inside the code view above to inspect atomic operation details</span>
                </div>
              )}
            </div>

            {/* EDUCATIONAL ANNOTATION IN CARD */}
            <div className="text-[10px] text-slate-500 bg-slate-950/30 border border-slate-900 p-3 rounded-lg leading-relaxed flex items-start gap-2 select-none">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Why Lua Transactions?</strong> Running lock checks on Redis as a pre-compiled Lua script guarantees <strong>Atomicity</strong>. No concurrent client thread can inject commands between lookup and assignment, strictly preventing race conditions or double-allocations inside database memory.
              </span>
            </div>

          </div>

        </section>

        {/* BOTTOM SECTION - TERMINAL LOGS + ACTIVE LEASES KEYS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LOG CONSOLE (8 col) */}
          <div id="terminal-logs-card" className="lg:col-span-8 bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-4 h-[350px]">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/65 pb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Redis Execution Trace Log</h2>
              </div>

              {/* Console search bar */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-search-logs"
                    placeholder="Search logs..."
                    value={searchLogQuery}
                    onChange={(e) => setSearchLogQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white max-w-[150px] placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  {searchLogQuery && (
                    <button 
                      onClick={() => setSearchLogQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Sorting options dropdown */}
                <select
                  id="select-log-sort"
                  value={logSort}
                  onChange={(e) => setLogSort(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option className="bg-slate-950 text-white" value="timestamp_newest">Timestamp (Newest)</option>
                  <option className="bg-slate-950 text-white" value="latency_high_low">Latency (High to Low)</option>
                  <option className="bg-slate-950 text-white" value="latency_low_high">Latency (Low to High)</option>
                </select>

                {/* Clear local logs button */}
                <button
                  id="btn-clear-logs"
                  onClick={() => setLogs([])}
                  className="p-1 px-1.5 text-[10px] font-mono border border-slate-800 rounded text-slate-500 hover:text-slate-300 hover:border-slate-700 transition"
                  title="Clear live logs"
                >
                  Clear Screen
                </button>
              </div>
            </div>

            {/* CATEGORIES FILTERS TAGS */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono mr-1">Filter events:</span>
              {(['all', 'success', 'failed', 'expired', 'system'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  id={`btn-log-filter-${f}`}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] capitalize font-semibold transition-all ${
                    logFilter === f 
                      ? 'bg-slate-800 text-white font-bold border border-slate-600' 
                      : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* TERMINAL SHELL BLOCK */}
            <div className="bg-slate-950 border border-slate-900 rounded-xl flex-1 font-mono text-[10px] overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  let badgeColor = 'text-slate-400';
                  let logPrefixBg = 'bg-slate-900 text-slate-400';
                  
                  if (log.type === 'success') {
                    badgeColor = 'text-emerald-400';
                    logPrefixBg = 'bg-emerald-950/50 border border-emerald-900/30 text-emerald-400';
                  } else if (log.type === 'failed') {
                    badgeColor = 'text-rose-400';
                    logPrefixBg = 'bg-rose-950/50 border border-rose-900/30 text-rose-400';
                  } else if (log.type === 'expired') {
                    badgeColor = 'text-amber-500';
                    logPrefixBg = 'bg-amber-950/50 border border-amber-900/30 text-amber-500';
                  } else if (log.type === 'system') {
                    badgeColor = 'text-blue-400';
                    logPrefixBg = 'bg-blue-950/50 border border-blue-900/30 text-blue-400';
                  } else if (log.type === 'warn') {
                    badgeColor = 'text-amber-400';
                    logPrefixBg = 'bg-amber-950/60 border border-amber-900/30 text-amber-400';
                  }

                  const isExactHighlight = searchLogQuery && log.timestamp === searchLogQuery;

                  return (
                    <div 
                      key={log.id} 
                      className={`flex gap-2.5 py-1 border-b border-slate-900/20 hover:bg-slate-900/30 rounded px-1.5 transition-all ${
                        isExactHighlight 
                          ? 'bg-cyan-950/40 border-l-2 border-cyan-500 shadow-[inset_1px_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/10' 
                          : ''
                      }`}
                    >
                      <span className="text-slate-600 select-none flex-shrink-0">{log.timestamp}</span>
                      
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase tracking-wider text-[8px] font-mono select-none ${logPrefixBg}`}>
                          {log.operation}
                        </span>
                        
                        {log.latency !== undefined && (
                          <span className="text-[8px] text-cyan-500 bg-cyan-950/40 border border-cyan-900/30 rounded px-1">
                            {log.latency}ms
                          </span>
                        )}
                      </div>

                      <span className="text-slate-500 font-mono text-[9px] flex-shrink-0">
                        [{log.key !== 'global' ? log.key.replace('lock:', '') : log.key}]
                      </span>
                      
                      <span className={`flex-1 break-all ${badgeColor} ${isExactHighlight ? 'font-semibold text-white' : ''}`}>{log.message}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-slate-600 py-12 text-center">
                  <Terminal className="w-8 h-8 opacity-25 mb-2 animate-pulse" />
                  <span>No executions match criteria. Start or trigger transactions above.</span>
                </div>
              )}
              <div ref={listEndRef} />
            </div>
          </div>

          {/* ACTIVE KEYS namespace LIST (4 col) */}
          <div id="keyspace-lease-card" className="lg:col-span-4 bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-4 h-[350px]">
            <div className="border-b border-slate-800/65 pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Active Leased Keyspace</h2>
              </div>
            </div>

            {/* KEYSPACE LEASES MONITOR */}
            <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-4 overflow-y-auto space-y-3">
              {(Object.values(activeLocks) as ActiveLock[]).length > 0 ? (
                (Object.values(activeLocks) as ActiveLock[]).map((lock) => {
                  const nowStamp = Date.now();
                  const remainingMs = Math.max(0, lock.expiresAt - nowStamp);
                  const completionPercentage = Math.round((remainingMs / lock.durationMax) * 100);

                  return (
                    <div key={lock.key} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 space-y-2 relative transition-all hover:bg-slate-900/70">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                          <span className="text-[11px] font-mono text-cyan-200 font-semibold truncate" title={lock.key}>
                            {lock.key}
                          </span>
                        </div>
                        
                        {/* Interactive EVICT RELEASE and RENEW triggers */}
                        <div className="flex items-center gap-1">
                          {/* Manual Renew Heartbeat button */}
                          <button
                            onClick={() => renewLockKey(lock.key)}
                            id={`btn-renew-${lock.key}`}
                            className="text-slate-500 hover:text-cyan-400 p-1 rounded hover:bg-cyan-950/20 transition-all border border-transparent hover:border-cyan-900/30"
                            title="Trigger Manual Lock Renewal (EVALSHA Heartbeat)"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => forceEvictKey(lock.key)}
                            id={`btn-evict-${lock.key}`}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-900/30"
                            title="Trigger Safe Lock Release (EVAL DEL Lua code)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Lock Holder metadata & Sparkline Graph */}
                      <div className="text-[10px] font-mono text-slate-400 flex justify-between items-center gap-2">
                        <div className="flex flex-col truncate flex-1">
                          <span className="truncate">Owner: <strong className="text-slate-200 font-normal">{lock.clientId}</strong></span>
                          <span className="text-slate-500 text-[8px] mt-0.5">Lease History: {lock.leaseHistory?.length || 0} event(s)</span>
                        </div>

                        {/* Sparkline Visualizer */}
                        <div className="h-7 w-16 bg-slate-950/60 border border-slate-900/80 rounded px-1 flex items-center justify-center overflow-hidden flex-shrink-0" title="Lock Remaining Lease sawtooth activity graph">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getSparklineData(lock)} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                              <Line
                                type="monotone"
                                dataKey="val"
                                stroke="#f59e0b"
                                strokeWidth={1.2}
                                dot={false}
                                isAnimationActive={false}
                              />
                              <YAxis domain={[0, 100]} hide />
                              <XAxis hide />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Progress bar represent residual lease */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                          <span>Remaining Time:</span>
                          <span className="text-amber-400 font-bold">{(remainingMs / 1000).toFixed(1)}s left</span>
                        </div>
                        <div className="bg-slate-950 rounded-full h-1.5 border border-slate-900 overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600 h-full text-center py-10">
                  <Unlock className="w-8 h-8 text-emerald-500/40 mb-2" />
                  <span className="text-xs font-mono">ALL KEYS FREE</span>
                  <span className="text-[10px] text-slate-500 mt-1 max-w-[180px] leading-relaxed">
                    No active leases locked in the Redis server namespace. Try launching acquiring attempts.
                  </span>
                </div>
              )}
            </div>

            {/* FOOTER ADVICE INSIGHT */}
            <div className="text-[10px] text-slate-500 bg-slate-950/40 p-2.5 border border-slate-900 rounded-xl text-center font-mono">
              Keyspace Saturation: {Object.keys(activeLocks).length} / {KEYSPACE_POOL.length} namespace blocks
            </div>

          </div>

        </section>

      </main>

      {/* FOOTER CREDITS */}
      <footer id="global-credits" className="text-center py-8 text-xs text-slate-600 border-t border-slate-900 bg-slate-950/40">
        <p className="tracking-wide">Lock Acquisition Dashboard &copy; 2026 — Designed for Real-Time Redis Lua Distributed Lock Analysis.</p>
      </footer>

    </div>
  );
}
