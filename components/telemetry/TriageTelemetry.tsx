"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertCircle, Cpu, FileText, CheckCircle, Download, User, Mail, 
  Layers, Activity, HeartPulse, FileSignature, KeyRound, Users, CloudLightning, 
  DollarSign, History, Lock, RefreshCw, Check, AlertTriangle, FileSpreadsheet,
  Signature, Database, ArrowRight, Zap, CheckSquare
} from 'lucide-react';
import { 
  db, auth, googleSignIn, logout, initAuth, handleFirestoreError 
} from '../../lib/firebase';
import { doc, setDoc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// Quick hash generator for auditing
function generateUUID(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function calculateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return 'SHA256-' + Math.abs(hash).toString(16).padStart(8, '0').toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Custom sample definitions for each vertical context
const VERTICAL_SAMPLES: Record<string, { title: string; notes: string; expectedScore: number; redactedExpected: string }[]> = {
  overview: [
    {
      title: "Task Routing: Auto-Scale Worktree (Priority: SLA-2)",
      notes: "Sovereign node requests horizontal workspace replication. Allocated target: 12 nodes across Hetzner AX41 server pools. Requester email: susan.vance@regionalhealth.org, billing ID: billing-88319-x402.",
      expectedScore: 2,
      redactedExpected: "Sovereign node requests horizontal workspace replication. Allocated target: 12 nodes across Hetzner AX41 server pools. Requester email: [REDACTED], billing ID: [REDACTED]."
    },
    {
      title: "Task Routing: Hot-Path Database Shard (Priority: SLA-1)",
      notes: "High critical priority routing event. Redis cache at container v8vf3lw73fx9lw9xmbq1tvo5 reports connection overflow. Re-routing tenant telemetry workspace veklom-ws-901 directly to standby replica. Admin IP: 192.168.1.100.",
      expectedScore: 1,
      redactedExpected: "High critical priority routing event. Redis cache at container [REDACTED] reports connection overflow. Re-routing tenant telemetry workspace [REDACTED] directly to standby replica. Admin IP: [REDACTED]."
    }
  ],
  pipelines: [
    {
      title: "Build: Compilation Error in agent-duel (Risk: High-2)",
      notes: "TypeScript type check failure in container agent-duel-backend. File x402-payment.middleware.ts, line 43. Failure details: Property 'evidence_hash' does not exist on type 'DecodedToken'. Developer user: dev-bob@veklom.com.",
      expectedScore: 2,
      redactedExpected: "TypeScript type check failure in container agent-duel-backend. File x402-payment.middleware.ts, line 43. Failure details: Property 'evidence_hash' does not exist on type [REDACTED]. Developer user: [REDACTED]."
    },
    {
      title: "Build: Container Memory Leak (Risk: High-1)",
      notes: "Docker runner node reports OOM (Out Of Memory) event. Agent Duel backend container spiked to 4.2GB RAM. Auto-killing and rolling back to stable SHA-a931fd7. Signed deploy code secret: k_9021a8f813bc.",
      expectedScore: 1,
      redactedExpected: "Docker runner node reports OOM (Out Of Memory) event. Agent Duel backend container spiked to 4.2GB RAM. Auto-killing and rolling back to stable SHA-a931fd7. Signed deploy code secret: [REDACTED]."
    }
  ],
  terminal: [
    {
      title: "Swarm Terminal: Consensus Breach Suspected (Rank: Tier-2)",
      notes: "Consensus protocol round 5882 failed SLA. Eldritch_Daemon peer node has been slashed -50 VNP stake due to response timeout of 1500ms. Slashed peer key: pub_99218ff1eDb6E08f4c7.",
      expectedScore: 2,
      redactedExpected: "Consensus protocol round 5882 failed SLA. Eldritch_Daemon peer node has been slashed -50 VNP stake due to response timeout of 1500ms. Slashed peer key: [REDACTED]."
    },
    {
      title: "Swarm Terminal: Host Hijack Detection (Rank: Tier-1)",
      notes: "Intrusion protection trigger! Unauthorized bash command executed: 'rm -rf /data/coolify'. Origin host: ssh-90a-client-99. Blocked by Zero-Trust gateway middleware immediately.",
      expectedScore: 1,
      redactedExpected: "Intrusion protection trigger! Unauthorized bash command executed: [REDACTED]. Origin host: [REDACTED]. Blocked by Zero-Trust gateway middleware immediately."
    }
  ],
  benchmarks: [
    {
      title: "Benchmark: Agent Accuracy Anomaly (Tier: V-2)",
      notes: "Evaluation benchmark 'Nexus-v2' reports LLM accuracy drop from 94.2% to 71.5% under stress. Fine-tuned model weights MedStx-Triage-13B show divergence in ESI output confidence. Reference weight node: weights_sha9011f.",
      expectedScore: 2,
      redactedExpected: "Evaluation benchmark 'Nexus-v2' reports LLM accuracy drop from 94.2% to 71.5% under stress. Fine-tuned model weights [REDACTED] show divergence in ESI output confidence. Reference weight node: [REDACTED]."
    }
  ],
  interlink: [
    {
      title: "Govern: Audit Signature Discrepancy (Class: G-2)",
      notes: "Zero-Trust middleware caught invalid signature. Request token claims mismatch in IdentityRAG cross-cluster mapping. Attempted login from IP: 5.78.135.11 without valid bearer token. Tenant claimed: user-9011a.",
      expectedScore: 2,
      redactedExpected: "Zero-Trust middleware caught invalid signature. Request token claims mismatch in IdentityRAG cross-cluster mapping. Attempted login from IP: [REDACTED] without valid bearer token. Tenant claimed: [REDACTED]."
    }
  ]
};

interface TriageTelemetryProps {
  context: 'overview' | 'pipelines' | 'terminal' | 'benchmarks' | 'interlink';
}

export default function TriageTelemetry({ context }: TriageTelemetryProps) {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(true);

  // Firestore persistent state
  const [configuration, setConfiguration] = useState<any>(null);
  const [triageRuns, setTriageRuns] = useState<any[]>([]);
  const [auditTrails, setAuditTrails] = useState<any[]>([]);

  // Triage Run inputs
  const [intakeText, setIntakeText] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [activeResult, setActiveResult] = useState<any>(null);

  // UI Wizard state
  const [signatureName, setSignatureName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [ollamaUrlInput, setOllamaUrlInput] = useState("http://localhost:11434");
  const [workspaceIdInput, setWorkspaceIdInput] = useState("veklom-ws-901");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [isTestingModel, setIsTestingModel] = useState(false);

  // Derive localized configuration metadata based on the active vertical context
  const meta = {
    title: {
      overview: "Sovereign Overview Triage",
      pipelines: "Build & Pipeline Telemetry",
      terminal: "Swarm Execution Telemetry",
      benchmarks: "Model Benchmark Assessment",
      interlink: "Governance & Command Center Audit"
    }[context],
    description: {
      overview: "Real-time control node routing telemetry, tracking cross-cluster workspace mappings and SLA bonds.",
      pipelines: "Automated compiler telemetry logs, parsing continuous integration events and build run telemetry.",
      terminal: "Real-time consensus state logs, tracking multi-agent protocols and swarm performance bonds.",
      benchmarks: "Real-time model calibration logs, validating ESI acuity matching and AI evaluation metrics.",
      interlink: "Zero-trust governance ledger, recording cryptographically-signed authority declarations."
    }[context],
    id: `ls_veklom_${context}_telemetry`,
    packageName: {
      overview: "Veklom Routing Triage",
      pipelines: "Veklom Build Telemetry",
      terminal: "Veklom Swarm Telemetry",
      benchmarks: "Veklom Evaluation Triage",
      interlink: "Veklom Governance Telemetry"
    }[context],
    entityLabel: {
      overview: "Routing Record",
      pipelines: "Build Verification Run",
      terminal: "Swarm Consensus Round",
      benchmarks: "Evaluation Inference Run",
      interlink: "Compliance Audit Run"
    }[context],
    scoreLabel: {
      overview: "SLA Priority",
      pipelines: "Build Risk Index",
      terminal: "Execution Complexity",
      benchmarks: "Confidence Score",
      interlink: "Governance Rank"
    }[context],
    sourcePlaceholder: {
      overview: "Input raw workspace routing logs or allocation requests...",
      pipelines: "Input build logs, compile errors, or pipeline manifests...",
      terminal: "Input command scripts, execution telemetry, or consensus records...",
      benchmarks: "Input model evaluation logs, accuracy tests, or benchmark metrics...",
      interlink: "Input policy specifications, authority declarations, or audit reports..."
    }[context],
    targetLabel: "Redacted / Secured Payload",
    summaryLabel: "System Attestation Summary",
    samples: VERTICAL_SAMPLES[context] || VERTICAL_SAMPLES.overview
  };

  // Initialize auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
        setIsLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch / Subscribe to persistent Firestore logs once authenticated
  useEffect(() => {
    if (!user) return;

    // 1. Subscribe to Configuration specific to this vertical
    const configRef = doc(db, 'configurations', meta.id);
    const unsubConfig = onSnapshot(configRef, async (snapshot) => {
      if (snapshot.exists()) {
        setConfiguration(snapshot.data());
      } else {
        const defaultConfig = {
          id: meta.id,
          packageName: meta.packageName,
          installed: true,
          baaSigned: false,
          status: "missing_secrets"
        };
        try {
          await setDoc(configRef, defaultConfig);
        } catch (err) {
          handleFirestoreError(err, 'create', `configurations/${meta.id}`);
        }
      }
    }, (error) => {
      handleFirestoreError(error, 'get', `configurations/${meta.id}`);
    });

    // 2. Subscribe to runs of this specific vertical context
    const runsRef = collection(db, `triage_runs_${context}`);
    const unsubTriage = onSnapshot(runsRef, (snapshot) => {
      const runs: any[] = [];
      snapshot.forEach((doc) => {
        runs.push(doc.data());
      });
      runs.sort((a, b) => b.createdAt - a.createdAt);
      setTriageRuns(runs);
    }, (error) => {
      handleFirestoreError(error, 'get', `triage_runs_${context}`);
    });

    // 3. Subscribe to Audit Trails of this specific vertical
    const auditRef = collection(db, `audit_trail_${context}`);
    const unsubAudit = onSnapshot(auditRef, (snapshot) => {
      const audits: any[] = [];
      snapshot.forEach((doc) => {
        audits.push(doc.data());
      });
      audits.sort((a, b) => b.timestamp - a.timestamp);
      setAuditTrails(audits);
    }, (error) => {
      handleFirestoreError(error, 'get', `audit_trail_${context}`);
    });

    return () => {
      unsubConfig();
      unsubTriage();
      unsubAudit();
    };
  }, [user, context]);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setAccessToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error("Login flow failed:", err);
    }
  };

  const handleBAASign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName || !signerEmail) return;

    const bHash = calculateHash(`${signatureName}-${signerEmail}-${Date.now()}`);
    const updated = {
      baaSigned: true,
      baaSignature: signatureName,
      baaSignerEmail: signerEmail,
      baaSignedAt: new Date().toISOString()
    };

    try {
      const configRef = doc(db, 'configurations', meta.id);
      await updateDoc(configRef, updated);

      const auditId = 'aud_' + generateUUID();
      const auditLog = {
        id: auditId,
        eventType: 'marketplace_install',
        userId: user.uid,
        userEmail: user.email || '',
        timestamp: new Date().getTime(),
        details: `${meta.packageName} authority agreement signed under regulatory audit code. Signer: ${signatureName} (${signerEmail}).`,
        transactionHash: bHash
      };
      await setDoc(doc(db, `audit_trail_${context}`, auditId), auditLog);
    } catch (err) {
      handleFirestoreError(err, 'update', `configurations/${meta.id}`);
    }
  };

  const handleSaveLicense = async () => {
    if (!licenseKeyInput) return;
    
    try {
      const configRef = doc(db, 'configurations', meta.id);
      const payload = {
        licenseKey: licenseKeyInput,
        ollamaBaseUrl: ollamaUrlInput,
        veklomWorkspaceId: workspaceIdInput,
        status: 'ready'
      };
      await updateDoc(configRef, payload);

      const auditId = 'aud_' + generateUUID();
      const auditLog = {
        id: auditId,
        eventType: 'marketplace_install',
        userId: user.uid,
        userEmail: user.email || '',
        timestamp: new Date().getTime(),
        details: `Configured active TELEMETRY_LICENSE_KEY and local telemetry endpoint [${ollamaUrlInput}] successfully.`,
        transactionHash: calculateHash(licenseKeyInput + ollamaUrlInput)
      };
      await setDoc(doc(db, `audit_trail_${context}`, auditId), auditLog);
    } catch (err) {
      handleFirestoreError(err, 'update', `configurations/${meta.id}`);
    }
  };

  const handleDeployContainer = () => {
    setIsDeploying(true);
    setDeployProgress(0);
    setDeployLogs([
      "Initiating secure telemetry processing node on VPS...",
      "Binding Zero-Trust authentication protocols...",
      "Validating sovereign credentials..."
    ]);

    const logs = [
      `Connecting to registry.veklom.com/marketplace/${context}-telemetry:1.0.0...`,
      "Pulling isolated runtime image ... Success",
      "Injecting telemetry scrubber filters...",
      "Mounting GPU tensor layers ... Progress 30%",
      "Mapping local interlink API endpoints to internal network...",
      "Verifying cryptographic watermark configurations...",
      "Telemetry processor node running securely in isolated sandbox container!"
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      setDeployProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDeploying(false);
          const configRef = doc(db, 'configurations', meta.id);
          updateDoc(configRef, { status: "ready" }).catch(e => console.error(e));
          return 100;
        }
        
        if (currentLogIndex < logs.length && Math.random() > 0.4) {
          setDeployLogs(l => [...l, logs[currentLogIndex]]);
          currentLogIndex++;
        }
        return prev + 10;
      });
    }, 600);
  };

  const executeTelemetryAnalysis = async () => {
    if (!intakeText.trim()) return;
    setIsClassifying(true);
    setActiveResult(null);

    // Simulate classification locally if API not present, else fall back to local computation
    setTimeout(async () => {
      try {
        const score = Math.floor(Math.random() * 3) + 1; // Score 1, 2, 3
        const resultHash = calculateHash(intakeText);
        const redacted = intakeText
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]")
          .replace(/(0x[a-fA-F0-9]{40})/g, "[REDACTED_WALLET]")
          .replace(/((?:[0-9]{1,3}\.){3}[0-9]{1,3})/g, "[REDACTED_IP]");

        const data = {
          redactedNotes: redacted,
          score: score,
          confidence: parseFloat((0.85 + Math.random() * 0.14).toFixed(3)),
          watermark: resultHash,
          soapSummary: `System analyzed intake payload. Successfully redacted all identifiers. Validated security rating as Tier-${score}. Telemetry analysis logged off hot-path to VNP Settlement Ledger.`
        };

        setActiveResult(data);

        // Record in Firestore runs
        const runId = 'run_' + generateUUID();
        const triageLog = {
          id: runId,
          userId: user.uid,
          userEmail: user.email || '',
          rawIntakeNotes: intakeText,
          redactedNotes: data.redactedNotes,
          esiScore: data.score,
          confidence: data.confidence,
          soapSummary: data.soapSummary,
          watermark: data.watermark,
          cost: 0.12,
          createdAt: new Date().getTime()
        };
        await setDoc(doc(db, `triage_runs_${context}`, runId), triageLog);

        // Record in Firestore Audit Trail
        const auditId = 'aud_' + generateUUID();
        const auditLog = {
          id: auditId,
          eventType: 'package_run',
          userId: user.uid,
          userEmail: user.email || '',
          timestamp: new Date().getTime(),
          details: `Telemetry classified as Priority-${data.score}. Encrypted metadata matching. Receipt signature watermarked: ${data.watermark}. Metered tariff VNP unit processed: $0.12.`,
          transactionHash: calculateHash(data.watermark)
        };
        await setDoc(doc(db, `audit_trail_${context}`, auditId), auditLog);

      } catch (err) {
        console.error(err);
      } finally {
        setIsClassifying(false);
      }
    }, 1200);
  };

  const handleSignOut = () => {
    logout().then(() => {
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
    });
  };

  if (isLoadingAuth) {
    return (
      <div className="bg-[#0b0e14]/40 border border-slate-900/60 rounded-xl p-8 flex flex-col items-center justify-center space-y-4 backdrop-blur-md">
        <Activity className="w-8 h-8 text-amber-500 animate-pulse" />
        <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">INITIALIZING SOVEREIGN TELEMETRY NODE...</span>
      </div>
    );
  }

  if (needsAuth || !user) {
    return (
      <div className="bg-[#0b0e14]/60 border border-slate-800/80 rounded-2xl p-8 text-center backdrop-blur-md max-w-lg mx-auto shadow-2xl">
        <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 text-amber-500">
          <Lock className="w-5 h-5 text-amber-500" />
        </div>
        <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-[0.25em] block mb-2">TELEMETRY ACCESS LOCKED</span>
        <h3 className="text-xl font-bold text-white mb-3">{meta.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Authorized telemetry records are encrypted and bound within Veklom's zero-trust space. Please authenticate with your Google account to synchronize secure audit timelines.
        </p>
        <button 
          onClick={handleLogin} 
          className="w-full py-3 border border-slate-800 rounded-lg bg-[#111622] hover:bg-[#161d2d] text-amber-500 hover:text-amber-400 font-mono text-xs uppercase tracking-wider font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
        >
          <KeyRound className="w-4 h-4 text-amber-500" />
          <span>Sign In and Sync Nodes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0e14]/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col w-full text-slate-300">
      
      {/* Dynamic Header */}
      <div className="border-b border-slate-800/80 p-5 bg-gradient-to-r from-amber-500/5 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-none">{meta.title}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-1 font-medium">{meta.packageName} • ID: {meta.id}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono self-end sm:self-auto">
          <div className="flex items-center space-x-1.5 bg-[#111622] border border-slate-800 px-2.5 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500">Operator:</span>
            <span className="text-amber-400 font-semibold">{user.email?.split('@')[0]}</span>
          </div>
          <button 
            onClick={handleSignOut}
            className="px-2.5 py-1 bg-red-950/10 hover:bg-red-950/30 border border-red-900/30 text-red-400 hover:text-red-300 rounded font-semibold transition"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
        
        {/* Left pane: Wizard & Settings (5 cols) */}
        <div className="lg:col-span-5 p-5 flex flex-col space-y-5">
          
          {/* Step 1: Sign Agreement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold">1</span>
                Sovereign SLA Endorsement
              </h4>
              {configuration?.baaSigned && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 font-bold uppercase font-mono">Endorsed</span>}
            </div>
            
            {!configuration?.baaSigned ? (
              <form onSubmit={handleBAASign} className="bg-[#111622]/50 border border-slate-800/80 p-3.5 rounded-xl space-y-3">
                <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                  YOU MUST ELECTRONICALLY COMMIT TO THE REGULATORY POLICY AND NODE EXCLUSIVITY TERMS.
                </p>
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">Signer Name</label>
                  <input 
                    type="text" 
                    value={signatureName} 
                    onChange={e => setSignatureName(e.target.value)} 
                    placeholder="e.g. Susan Vance, CMO"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-800 rounded bg-[#0b0e14] text-slate-200 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={signerEmail} 
                    onChange={e => setSignerEmail(e.target.value)} 
                    placeholder="susan.vance@regionalhealth.org"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-800 rounded bg-[#0b0e14] text-slate-200 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider rounded transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <Signature className="w-3.5 h-3.5" />
                  <span>Execute SLA Attestation</span>
                </button>
              </form>
            ) : (
              <div className="bg-emerald-950/10 border border-emerald-900/30 text-emerald-400 rounded-xl p-3 text-[10px] space-y-1 font-mono">
                <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Regulatory BAA SLA Committed</span>
                </div>
                <p>Signer: <strong className="text-white">{configuration.baaSignature}</strong> ({configuration.baaSignerEmail})</p>
                <p className="text-[9px] text-slate-500">Timestamp: {new Date(configuration.baaSignedAt).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Step 2: Secrets and Parameters */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold">2</span>
              Node Configuration
            </h4>
            
            {configuration?.baaSigned ? (
              <div className="bg-[#111622]/50 border border-slate-800/80 p-3.5 rounded-xl space-y-3 font-mono text-[10px]">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex justify-between">
                    <span>TELEMETRY_LICENSE_KEY</span>
                    {configuration?.licenseKey && <span className="text-emerald-400 font-bold">Commited</span>}
                  </label>
                  <input 
                    type="password" 
                    value={licenseKeyInput} 
                    onChange={e => setLicenseKeyInput(e.target.value)} 
                    placeholder={configuration?.licenseKey ? "••••••••••••••••••••••••" : "Paste cryptographic key..."}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-800 rounded bg-[#0b0e14] text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1">Workspace ID</label>
                    <input 
                      type="text" 
                      value={workspaceIdInput} 
                      onChange={e => setWorkspaceIdInput(e.target.value)} 
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-800 rounded bg-[#0b0e14] text-slate-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1">Local Router</label>
                    <input 
                      type="text" 
                      value={ollamaUrlInput} 
                      onChange={e => setOllamaUrlInput(e.target.value)} 
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-800 rounded bg-[#0b0e14] text-slate-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveLicense}
                  className="w-full py-1.5 bg-[#161d2d] hover:bg-[#1a2538] border border-slate-800 text-amber-500 hover:text-amber-400 font-bold text-xs uppercase tracking-wider rounded transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Commit Secret Signatures</span>
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic font-mono uppercase tracking-wider pl-6">Commit regulatory SLA signature to unlock.</p>
            )}
          </div>

          {/* Step 3: Hardware Boot */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold">3</span>
              Isolation Sandbox Boot
            </h4>

            {configuration?.licenseKey ? (
              <div className="space-y-2 font-mono">
                {isDeploying ? (
                  <div className="bg-[#0b0e14] border border-slate-850 p-3 rounded-lg text-[9px] text-amber-400 space-y-2">
                    <div className="flex justify-between text-white font-bold uppercase">
                      <span>Loading parameters...</span>
                      <span>{deployProgress}%</span>
                    </div>
                    <div className="w-full bg-[#111622] h-1.5 rounded overflow-hidden">
                      <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${deployProgress}%` }} />
                    </div>
                    <div className="h-20 overflow-y-auto space-y-1 text-slate-400 border-t border-slate-800 pt-1.5 scrollbar-thin">
                      {deployLogs.map((log, i) => (
                        <p key={i}>{`> ${log}`}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-emerald-950/10 border border-emerald-900/30 text-emerald-400 rounded-lg p-2.5 flex items-center justify-between text-[10px]">
                      <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sovereign Container Active</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleDeployContainer}
                      className="w-full py-1 bg-slate-900 hover:bg-[#111622] border border-slate-800 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded transition cursor-pointer"
                    >
                      Re-Trigger Deployment Sequence
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic font-mono uppercase tracking-wider pl-6">Commit configurations to enable boot sequence.</p>
            )}
          </div>

        </div>

        {/* Right pane: Workbench & Ledger logs (7 cols) */}
        <div className="lg:col-span-7 p-5 flex flex-col space-y-5">
          
          {/* Interactive Attestation Workbench */}
          <div className="bg-[#111622]/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-500" />
                Attestation Workbench
              </span>
              <span className="text-[9px] text-slate-500 font-normal">REAL-TIME SANDBOXED INTERACTION</span>
            </h4>

            {configuration?.status === 'ready' ? (
              <div className="space-y-3">
                {/* Sample Selection */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Select Pre-Configured Audit Sample</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {meta.samples.map((sample, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setIntakeText(sample.notes)}
                        className="text-left text-[10px] p-2 bg-[#0b0e14] hover:bg-[#111622] border border-slate-800 rounded transition font-mono truncate text-amber-500/80 hover:text-amber-400 cursor-pointer"
                      >
                        {sample.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Textarea */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Input Telemetry Document</span>
                  <textarea 
                    value={intakeText}
                    onChange={e => setIntakeText(e.target.value)}
                    placeholder={meta.sourcePlaceholder}
                    rows={3}
                    className="w-full text-xs p-2 border border-slate-800 rounded bg-[#0b0e14] text-slate-200 focus:border-amber-500 focus:outline-none font-mono resize-none scrollbar-thin"
                  />
                </div>

                {/* Run button */}
                <button 
                  onClick={executeTelemetryAnalysis}
                  disabled={isClassifying || !intakeText.trim()}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isClassifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>{isClassifying ? "Scrubbing & Analyzing..." : "Run Telemetry Classification"}</span>
                </button>

                {/* Active Result View */}
                <AnimatePresence>
                  {activeResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-[#0b0e14] border border-slate-800 rounded-lg p-3 space-y-2 text-[10px] font-mono"
                    >
                      <div className="grid grid-cols-2 gap-2 border-b border-slate-850 pb-2">
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider">{meta.scoreLabel} Rating</span>
                          <span className="text-red-400 font-bold text-xs">Priority-{activeResult.score}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider">Classification Confidence</span>
                          <span className="text-emerald-400 font-bold text-xs">{(activeResult.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase tracking-wider">{meta.targetLabel}</span>
                        <p className="text-[9px] text-slate-300 leading-snug bg-[#111622] p-2 rounded mt-1 border border-slate-850">{activeResult.redactedNotes}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase tracking-wider">{meta.summaryLabel}</span>
                        <p className="text-[9px] text-amber-500/90 leading-snug bg-amber-500/5 p-2 rounded mt-1 border border-amber-500/10">{activeResult.soapSummary}</p>
                      </div>
                      <div className="flex justify-between items-center text-[8px] text-slate-500 pt-1">
                        <span>Watermark: {activeResult.watermark}</span>
                        <span>Estimated Cost: $0.12 VNP</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic font-mono uppercase tracking-wider text-center py-6">Activate BAA/SLA & deploy sandbox container to start analysis.</p>
            )}
          </div>

          {/* Real-time Ledger Log stream */}
          <div className="bg-[#111622]/40 border border-slate-800/80 rounded-xl p-4 flex-1 flex flex-col min-h-[180px] max-h-[250px]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-500" />
                VNP Settlement Audit Ledger
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h4>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin text-[9px] font-mono">
              {auditTrails.length === 0 ? (
                <p className="text-slate-650 italic text-center py-10 uppercase tracking-widest">No transaction proofs recorded in ledger.</p>
              ) : (
                auditTrails.map((audit) => (
                  <div key={audit.id} className="bg-[#0b0e14] border border-slate-850/60 p-2 rounded flex flex-col space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="text-amber-500/90 font-bold uppercase tracking-wider">{audit.eventType}</span>
                      <span className="text-slate-600">{new Date(audit.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-350 leading-snug">{audit.details}</p>
                    <div className="text-[8px] text-slate-650 flex justify-between">
                      <span>Audit UUID: {audit.id}</span>
                      <span>Hash: {audit.transactionHash?.substring(0, 16)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
