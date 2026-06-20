"use client";

import React, { useState, useEffect, useRef } from "react";
import Shell from "@/components/Shell";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Wallet,
  Send,
  DollarSign,
  Code,
  ArrowRight,
  RefreshCw,
  Terminal,
  Activity,
  Award,
  Cpu,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Server,
  Network
} from "lucide-react";

// ============ CONFIGURATION ============
const CONFIG = {
  VEKLOM_ADDRESS: "0x3a74772e925b54F7dAD7FD95c9Ba30825033f970",
  VEKLOM_ENS: "veklom.base.eth",
  USDC_TOKEN: "0x833589fCD6eDb6E08f4c7C32D4f71b3228cdeC9F",
};

export default function VeklomDiscoveryPage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [balanceUSDC, setBalanceUSDC] = useState(1000.0);
  const [currentTab, setCurrentTab] = useState<"ap2" | "acp" | "x402" | "mpp" | "security">("ap2");

  // AP2 Simulator State
  const [ap2Type, setAp2Type] = useState<"intent" | "cart" | "payment">("intent");
  const [ap2SpendLimit, setAp2SpendLimit] = useState(50.0);
  const [ap2Logs, setAp2Logs] = useState<string[]>([]);
  const [ap2Mandate, setAp2Mandate] = useState<any>(null);
  const [ap2Status, setAp2Status] = useState<"idle" | "signing" | "success">("idle");

  // x402 Simulator State
  const [selectedEndpoint, setSelectedEndpoint] = useState("/api/v1/inference/custom-agent");
  const [x402Status, setX402Status] = useState<"idle" | "challenged" | "signing" | "submitting" | "success">("idle");
  const [x402Logs, setX402Logs] = useState<string[]>([]);
  const [paymentRequirements, setPaymentRequirements] = useState<any>(null);
  const [signatureData, setSignatureData] = useState<string>("");
  const [executionIdentity, setExecutionIdentity] = useState<any>(null);

  // MPP Simulator State
  const [mppSessionActive, setMppSessionActive] = useState(false);
  const [mppBalance, setMppBalance] = useState(0.0);
  const [mppLogs, setMppLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mppCallsCount, setMppCallsCount] = useState(0);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ACP Simulator State
  const [acpStep, setAcpStep] = useState<"idle" | "requesting" | "negotiating" | "escrow" | "complete">("idle");
  const [acpLogs, setAcpLogs] = useState<string[]>([]);
  const [negotiatedSLOs, setNegotiatedSLOs] = useState({
    uptime: 99.9,
    latency: 150,
    cost: 0.02,
  });

  // Security Exploit Sandbox State
  const [selectedExploit, setSelectedExploit] = useState<"free-rider" | "context-replay">("free-rider");
  const [securityMitigationActive, setSecurityMitigationActive] = useState(true);
  const [exploitStatus, setExploitStatus] = useState<"idle" | "running" | "breached" | "blocked">("idle");
  const [exploitLogs, setExploitLogs] = useState<string[]>([]);

  // Global Notification logs
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showNotification = (text: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Connect wallet helper
  const connectWallet = async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setWalletConnected(true);
    setConnecting(false);
    showNotification("Base wallet connected via Base MCP", "success");
  };

  // ============ AP2 FUNCTIONS ============
  const generateAP2Mandate = async () => {
    setAp2Status("signing");
    setAp2Logs([
      `[Enclave] Fetching user keypair: did:veklom:operator_alice#key-1...`,
      `[Client] Encoding JSON-LD mandate with credentialSubject data...`,
      `[Client] Generating Ed25519Signature2020 proof parameters...`,
    ]);

    await new Promise((r) => setTimeout(r, 1200));

    const uuid = "8b9d31f2-104c-4e8a-821f-" + Math.floor(100000000000 + Math.random() * 900000000000).toString(16);
    const mockSig = "eyJhbGciOiJFUzI1NksiLCJjcml0IjpbImJjbiJdLCJiY24iOiJ2ZWtsb20ifQ.." + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

    const mandate = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://veklom.com/contexts/ap2/v1"
      ],
      "id": `urn:uuid:${uuid}`,
      "type": ["VerifiableCredential", "AgentPaymentsMandate"],
      "issuer": "did:veklom:operator_alice",
      "issuanceDate": new Date().toISOString(),
      "credentialSubject": {
        "id": "did:veklom:agent_nexus_01",
        "mandateType": ap2Type === "intent" ? "IntentMandate" : ap2Type === "cart" ? "CartMandate" : "PaymentMandate",
        "spendLimit": `${ap2SpendLimit.toFixed(2)} USDC`,
        "allowedEndpoints": [
          "https://api.veklom.com/api/v1/*"
        ],
        "expirationDate": "2026-12-31T23:59:59Z"
      },
      "proof": {
        "type": "JsonWebSignature2020",
        "created": new Date().toISOString(),
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:veklom:operator_alice#key-1",
        "jws": mockSig
      }
    };

    setAp2Mandate(mandate);
    setAp2Logs((prev) => [
      ...prev,
      `[Client] Cryptographic signature generated successfully.`,
      `[Client] Submitting signed mandate to VNP authorization verifier...`,
      `[Verifier Node] Verifying signature against DID verificationMethod... Passed.`,
      `[Verifier Node] Validating mandate policy constraints... Spend limit of $${ap2SpendLimit.toFixed(2)} USDC successfully delegated.`,
      `[Verifier Node] Active Mandate registered under uuid: ${uuid}`,
    ]);
    setAp2Status("success");
    showNotification("AP2 Mandate successfully signed and verified!", "success");
  };

  // ============ x402 FUNCTIONS ============
  const triggerX402Request = () => {
    setX402Status("challenged");
    const nonce = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const amountUSDC = selectedEndpoint === "/api/v1/inference/custom-agent" ? 0.05 : 0.12;

    const reqs = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        PaymentRequirements: [
          { name: "recipient", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "bytes32" },
          { name: "resource", type: "string" },
        ],
      },
      primaryType: "PaymentRequirements",
      domain: {
        name: "VNP x402 Billing Gateway",
        version: "1",
        chainId: 8453,
        verifyingContract: "0x0000000000000000000000000000000000000000",
      },
      message: {
        recipient: CONFIG.VEKLOM_ADDRESS,
        amount: Math.round(amountUSDC * 1000000).toString(), // in micro-USDC
        nonce: nonce,
        resource: selectedEndpoint,
      },
    };

    setPaymentRequirements(reqs);
    setX402Logs([
      `[Client] Initiating GET request to: https://api.veklom.com${selectedEndpoint}`,
      `[Gateway] Intercepted request. Authorization signature header missing.`,
      `[Gateway] Returning HTTP 402 Payment Required challenge.`,
      `[Client] Received PaymentRequirements EIP-712 metadata challenge (see inspector below).`,
    ]);
  };

  const approveAndSignX402 = async () => {
    if (!walletConnected) {
      showNotification("Please connect your wallet first", "error");
      return;
    }
    setX402Status("signing");
    setX402Logs((prev) => [...prev, `[Base MCP] Requesting EIP-712 signature over PaymentRequirements payload...`]);

    await new Promise((r) => setTimeout(r, 1500));
    const mockSig = "0x" + Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setSignatureData(mockSig);
    setX402Logs((prev) => [
      ...prev,
      `[Base MCP] Signature generated successfully: ${mockSig.substring(0, 18)}...`,
      `[Client] Deducting on-chain gas + USDC fees...`,
    ]);

    const amountUSDC = selectedEndpoint === "/api/v1/inference/custom-agent" ? 0.05 : 0.12;
    setBalanceUSDC((prev) => Math.max(0, prev - amountUSDC));

    setX402Status("submitting");
    await new Promise((r) => setTimeout(r, 1500));

    const mockTxHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const mockEiHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

    setX402Logs((prev) => [
      ...prev,
      `[Client] Retrying GET request to: https://api.veklom.com${selectedEndpoint}`,
      `  -> Header: Authorization: x402 signature=${mockSig.substring(0, 12)}...`,
      `  -> Header: X-Veklom-TxHash: ${mockTxHash}`,
      `[Gateway] Verifying EIP-712 signature against public key... Passed.`,
      `[Gateway] Checking transaction hash inclusion on Base Sepolia... Confirmed.`,
      `[Gateway] Minting Execution Identity (EI) proof hash: ${mockEiHash.substring(0, 16)}...`,
      `[Gateway] HTTP 200 OK. Returning resource payload!`,
    ]);

    setExecutionIdentity({
      proofHash: mockEiHash,
      recipient: CONFIG.VEKLOM_ADDRESS,
      amount: amountUSDC,
      endpoint: selectedEndpoint,
      nonce: paymentRequirements?.message.nonce,
      timestamp: new Date().toISOString(),
    });
    setX402Status("success");
    showNotification("x402 Payment successful. Resource unlocked!", "success");
  };

  // ============ MPP FUNCTIONS ============
  const initializeMppSession = async () => {
    if (balanceUSDC < 1.0) {
      showNotification("Insufficient balance for session pre-auth", "error");
      return;
    }
    setBalanceUSDC((prev) => prev - 1.0);
    setMppBalance(1.0);
    setMppSessionActive(true);
    setMppLogs([
      `[MPP Session] Requesting session pre-authorization for $1.00 USDC...`,
      `[Base MCP] Signing one-time session mandate... Approved.`,
      `[MPP Gateway] Locked $1.00 USDC escrow session limit. Session key active.`,
    ]);
    showNotification("MPP session pre-authorized", "success");
  };

  const startMppStreaming = () => {
    if (!mppSessionActive || mppBalance <= 0) return;
    setIsStreaming(true);
  };

  const stopMppStreaming = () => {
    setIsStreaming(false);
  };

  useEffect(() => {
    if (isStreaming) {
      streamIntervalRef.current = setInterval(() => {
        setMppBalance((prevBal) => {
          if (prevBal <= 0.011) {
            setIsStreaming(false);
            setMppSessionActive(false);
            if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
            setMppLogs((prevLogs) => [
              ...prevLogs,
              `[MPP Session] Session credit limit exhausted. Active key suspended.`,
            ]);
            return 0.0;
          }
          const costPerCall = 0.005;
          const nextBal = prevBal - costPerCall;
          setMppCallsCount((c) => c + 1);
          setMppLogs((prevLogs) => [
            ...prevLogs.slice(-15),
            `GET /api/v1/telemetry/pulse - Settled: $${costPerCall.toFixed(3)} USDC (Session Remaining: $${nextBal.toFixed(3)} USDC) [Bypassed signature prompt - 90% gas reduction]`,
          ]);
          return nextBal;
        });
      }, 300);
    } else {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    }
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [isStreaming]);

  // ============ ACP FUNCTIONS ============
  const initiateACPNegotiation = async () => {
    setAcpStep("requesting");
    setAcpLogs([
      `[Agent A] Resolving target API DID (did:veklom:${CONFIG.VEKLOM_ENS})...`,
      `[Agent A] Requesting capabilities from target...`,
      `[Agent B] Returns REST endpoints and default SLA configurations.`,
    ]);

    await new Promise((r) => setTimeout(r, 1500));
    setAcpStep("negotiating");
    setAcpLogs((prev) => [
      ...prev,
      `[Agent A] Proposing target SLA parameters:`,
      `  -> Uptime target: >= 99.9%`,
      `  -> Latency limit: < 150ms`,
      `  -> Max cost per call: $0.02 USDC`,
      `[Agent B] Evaluating SLO baselines against history...`,
      `[Agent B] COUNTER-PROPOSAL: Latency limit set to < 140ms, cost $0.02 USDC.`,
      `[Agent A] Counter-proposal matches spending rules. Accepting terms.`,
    ]);

    await new Promise((r) => setTimeout(r, 1800));
    setAcpStep("escrow");
    setAcpLogs((prev) => [
      ...prev,
      `[Virtuals ACP] Creating Proof of Agreement (PoA) block...`,
      `[Virtuals ACP] Locking 10.00 USDC collateral from Agent A in smart contract...`,
      `[Virtuals ACP] Locking 10.00 USDC SLA assurance bond from Agent B...`,
    ]);
    setBalanceUSDC((prev) => Math.max(0, prev - 10.0));

    await new Promise((r) => setTimeout(r, 1500));
    setAcpStep("complete");
    setAcpLogs((prev) => [
      ...prev,
      `[Virtuals ACP] Escrow confirmed. Contract state: ACTIVE.`,
      `[Virtuals ACP] Evaluator agents deployed to verify SLA telemetry on the PGL.`,
    ]);
    showNotification("ACP Negotiation complete. Escrow locked!", "success");
  };

  const resetACP = () => {
    setAcpStep("idle");
    setAcpLogs([]);
  };

  // ============ SECURITY SANDBOX FUNCTIONS ============
  const triggerExploitSim = async () => {
    setExploitStatus("running");
    setExploitLogs([]);

    if (selectedExploit === "free-rider") {
      setExploitLogs([
        `[Attacker] Constructing parallel request payload with nonce: 0x7b2f...`,
        `[Attacker] Dispatching Request #1 (Inference) and Request #2 (Inference) concurrently...`,
      ]);

      await new Promise((r) => setTimeout(r, 1200));

      if (!securityMitigationActive) {
        setExploitLogs((prev) => [
          ...prev,
          `[Gateway] Naive Architecture Active (Optimistic verify).`,
          `[Gateway] Processing Request #1 -> Signature validated, checking settlement on-chain...`,
          `[Gateway] Processing Request #2 -> Signature validated, checking settlement on-chain...`,
          `[Gateway] Concurrency Synchronization Gap (2.5s finality lag) in effect.`,
          `[Gateway] Request #1: VERIFIED. Serving AI resource payload.`,
          `[Gateway] Request #2: VERIFIED. Serving AI resource payload.`,
          `[System] EXPLOIT BREACH: Attack successful! Attacker claimed 2x inference calls for the price of 1 (Free-Rider sync gap exploited).`,
        ]);
        setExploitStatus("breached");
        showNotification("Security breach: Free-rider exploit successful!", "error");
      } else {
        setExploitLogs((prev) => [
          ...prev,
          `[Gateway] Defensive Architecture Active (Pessimistic Nonce Locking).`,
          `[Gateway] Request #1 arrives -> Nonce [0x7b2f...] marked as PENDING in local cache.`,
          `[Gateway] Request #2 arrives -> Nonce [0x7b2f...] cache look-up COLLISION detected!`,
          `[Gateway] Request #2 validation failed: Nonce already locked in active state-space.`,
          `[Gateway] Request #2 rejected: HTTP 409 Conflict.`,
          `[System] MITIGATION SUCCESSFUL: Race condition aborted. Attack blocked.`,
        ]);
        setExploitStatus("blocked");
        showNotification("Attack blocked: Pessimistic state lock active!", "success");
      }
    } else {
      setExploitLogs([
        `[Attacker] Intercepting signed payment proof header for GET /data/cheap-index ($0.01 USDC)...`,
        `[Attacker] Constructing replayed authorization header containing cheap endpoint signature...`,
        `[Attacker] Sending hijacked request to premium route: GET /api/v1/inference/premium-llama ($0.50 USDC)`,
      ]);

      await new Promise((r) => setTimeout(r, 1200));

      if (!securityMitigationActive) {
        setExploitLogs((prev) => [
          ...prev,
          `[Gateway] Naive Architecture Active (Context-Agnostic check).`,
          `[Gateway] Parsing header signature -> Signature matched owner public key.`,
          `[Gateway] Verifying transaction on-chain -> $0.01 USDC transfer verified.`,
          `[Gateway] Validation check passed (Signature matches verify key).`,
          `[Gateway] HTTP 200 OK. Serving premium llama inference (Price: $0.50 USDC).`,
          `[System] EXPLOIT BREACH: Replay successful! Premium resource unlocked using low-cost payment signature.`,
        ]);
        setExploitStatus("breached");
        showNotification("Security breach: Context replay exploit successful!", "error");
      } else {
        setExploitLogs((prev) => [
          ...prev,
          `[Gateway] Defensive Architecture Active (Cryptographic Context-Binding enabled).`,
          `[Gateway] Extracting path binding domain parameter from EIP-712 payload...`,
          `[Gateway] Signed target path context: "/api/v1/data/cheap-index"`,
          `[Gateway] Actual request path context: "/api/v1/inference/premium-llama"`,
          `[Gateway] Verification failed: Request context does not match signature path binding!`,
          `[Gateway] Request rejected: HTTP 403 Forbidden.`,
          `[System] MITIGATION SUCCESSFUL: Replay attempt blocked by request-bound signature check.`,
        ]);
        setExploitStatus("blocked");
        showNotification("Attack blocked: Context-binding verification active!", "success");
      }
    }
  };

  const highlightJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Shell>
      <div className="max-w-[1300px] mx-auto space-y-8 font-sans text-slate-300 selection:bg-cyan-500/30">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-xl ${
                notification.type === "success"
                  ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-400"
                  : notification.type === "error"
                  ? "bg-rose-950/80 border-rose-500/30 text-rose-400"
                  : "bg-blue-950/80 border-blue-500/30 text-blue-400"
              }`}
            >
              {notification.type === "success" ? <CheckCircle2 size={16} /> : notification.type === "error" ? <AlertTriangle size={16} /> : <Activity size={16} />}
              <span className="text-xs font-semibold">{notification.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-[#11151C] to-transparent border border-[#1E2430] rounded-2xl p-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full uppercase">
                Interactive Sandbox
              </span>
              <span className="text-[10px] font-mono text-slate-500">veklom.base.eth</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Veklom Discovery</h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Explore the Three-Layer Payments & Commerce Stack designed for the machine economy. Test instant pay-per-call (x402), streaming micropayments (MPP), and autonomous agent-to-agent contract negotiation (ACP).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="bg-[#0A0D14] border border-[#1E2430] rounded-xl px-5 py-3 flex flex-col justify-center min-w-[160px]">
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">USDC Balance</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">${balanceUSDC.toFixed(2)}</span>
            </div>

            <button
              onClick={connectWallet}
              disabled={walletConnected || connecting}
              className={`px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                walletConnected
                  ? "bg-cyan-600 border border-cyan-500 text-white shadow-cyan-500/10 cursor-default"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 border border-cyan-400/30 text-white shadow-cyan-500/20"
              }`}
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-3.5 h-3.5" />
                  {walletConnected ? "Base Mainnet Connected" : "Connect Base Wallet"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Switching Menu */}
        <div className="flex border-b border-[#1E2430]">
          {([
            { id: "ap2", label: "AP2 Mandates (Authorization)", icon: Lock, color: "text-blue-400" },
            { id: "acp", label: "Dual-ACP (Commerce)", icon: Shield, color: "text-purple-400" },
            { id: "x402", label: "x402 Payments (Settlement Stateless)", icon: DollarSign, color: "text-green-400" },
            { id: "mpp", label: "MPP Sessions (Settlement Streaming)", icon: Send, color: "text-cyan-400" },
            { id: "security", label: "Security & Exploit Sandbox", icon: AlertTriangle, color: "text-rose-400" },
          ] as const).map((tab) => {
            const TabIcon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-4 text-xs font-semibold tracking-wider uppercase transition-colors relative ${
                  active ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <TabIcon className={`w-4 h-4 ${tab.color}`} />
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="discovery-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Panel Contexts */}
        <div className="min-h-[480px]">
          {currentTab === "ap2" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* AP2 Controller Panel */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#11151C] border border-[#1E2430] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-bold text-sm uppercase font-mono tracking-wide">AP2 Mandate Manager</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    The Authorization Layer manages user-delegated spending power using Google's AP2 Mandate framework. Generate ECDSA-signed JSON-LD objects defining strict daily bounds and verified endpoints prior to code compilation.
                  </p>

                  <div className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Mandate Category</label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { id: "intent", label: "Intent" },
                          { id: "cart", label: "Cart" },
                          { id: "payment", label: "Payment" },
                        ] as const).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setAp2Type(t.id);
                              setAp2Status("idle");
                              setAp2Logs([]);
                              setAp2Mandate(null);
                            }}
                            className={`py-2 rounded-lg border text-center transition-colors font-bold ${
                              ap2Type === t.id
                                ? "bg-blue-500/10 border-blue-500 text-blue-400"
                                : "bg-[#0A0D14] border-[#1E2430] text-slate-400 hover:text-white"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Authorized Spend Cap (USDC)</label>
                      <input
                        type="number"
                        value={ap2SpendLimit}
                        onChange={(e) => {
                          setAp2SpendLimit(Number(e.target.value));
                          setAp2Status("idle");
                          setAp2Mandate(null);
                        }}
                        className="w-full bg-[#0A0D14] border border-[#1E2430] focus:border-blue-500 rounded-lg py-2.5 px-3 text-white outline-none font-mono text-right"
                      />
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={generateAP2Mandate}
                        disabled={ap2Status === "signing"}
                        className="w-full bg-blue-500/15 hover:bg-blue-500/25 disabled:opacity-40 text-blue-300 border border-blue-500/30 py-3 rounded-xl font-bold text-center transition-colors flex items-center justify-center gap-1.5"
                      >
                        {ap2Status === "signing" ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Authorizing Mandate...
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" /> Sign AP2 Intent Mandate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#11151C] border border-[#1E2430] rounded-2xl p-5 space-y-3 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-white uppercase tracking-wider text-[10px] font-mono">Authorization Audit</span>
                  </div>
                  <ul className="space-y-2 text-slate-400 leading-relaxed text-[11px]">
                    <li className="flex items-start gap-1.5"><CheckCircle2 size={12} className="text-blue-400 mt-0.5 shrink-0" /> Intent Mandates define daily spending caps.</li>
                    <li className="flex items-start gap-1.5"><CheckCircle2 size={12} className="text-blue-400 mt-0.5 shrink-0" /> Cart Mandates whitelist item codes and checkout price.</li>
                    <li className="flex items-start gap-1.5"><CheckCircle2 size={12} className="text-blue-400 mt-0.5 shrink-0" /> PGL validates ECDSA signature keys before request compilation.</li>
                  </ul>
                </div>
              </div>

              {/* AP2 Terminal and Mandate JSON */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-[#0A0D14] border border-[#1E2430] rounded-2xl overflow-hidden flex flex-col h-[230px]">
                  <div className="bg-[#11151C] border-b border-[#1E2430] px-4 py-3 flex items-center gap-2 shrink-0">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">AP2 Enclave Logs</span>
                  </div>
                  <div className="p-4 space-y-2 overflow-auto flex-1 font-mono text-[11px] custom-scrollbar">
                    {ap2Logs.length === 0 ? (
                      <p className="text-slate-600 italic font-sans">Click authorize above to sign a credentials mandate object...</p>
                    ) : (
                      ap2Logs.map((log, index) => (
                        <div key={index} className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-[#0A0D14] border border-[#1E2430] rounded-2xl overflow-hidden flex flex-col h-[320px]">
                  <div className="bg-[#11151C] border-b border-[#1E2430] px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-blue-400" />
                      <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">Signed JSON-LD Mandate Payload</span>
                    </div>
                    <span className="text-[9px] font-mono text-blue-400 font-sans">JSON-LD</span>
                  </div>
                  <div className="p-4 overflow-auto flex-1 font-mono text-[11px] text-slate-400 custom-scrollbar">
                    {ap2Mandate ? (
                      <pre className="text-blue-300">{highlightJson(ap2Mandate)}</pre>
                    ) : (
                      <p className="text-slate-600 italic font-sans">Awaiting mandate generation.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === "x402" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* x402 Controller Panel */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#11151C] border border-[#1E2430] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-white font-bold text-sm uppercase font-mono tracking-wide">x402 Gateway Client</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Test the challenge-response flow where an API requires instant stablecoin payment per request. The gateway returns a 402 challenge, your agent signs the requirements, settles on-chain, and unlocks the resource.
                  </p>

                  <div className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Select Endpoint to Request</label>
                      <select
                        value={selectedEndpoint}
                        onChange={(e) => {
                          setSelectedEndpoint(e.target.value);
                          setX402Status("idle");
                          setX402Logs([]);
                          setExecutionIdentity(null);
                        }}
                        className="w-full bg-[#0A0D14] border border-[#1E2430] focus:border-cyan-500 rounded-lg py-2.5 px-3 text-white outline-none"
                      >
                        <option value="/api/v1/inference/custom-agent">GET /inference/custom-agent ($0.05 USDC)</option>
                        <option value="/api/v1/data/exclusive-feed">GET /data/exclusive-feed ($0.12 USDC)</option>
                      </select>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        onClick={triggerX402Request}
                        disabled={x402Status !== "idle" && x402Status !== "success"}
                        className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-40 text-cyan-400 border border-cyan-500/20 py-3 rounded-xl font-bold text-center transition-colors"
                      >
                        Request Protected Endpoint
                      </button>

                      <button
                        onClick={approveAndSignX402}
                        disabled={x402Status !== "challenged"}
                        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 text-emerald-400 border border-emerald-500/20 py-3 rounded-xl font-bold text-center transition-colors flex items-center justify-center gap-1.5"
                      >
                        {x402Status === "signing" ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating Signature...
                          </>
                        ) : x402Status === "submitting" ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Payment...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" /> Approve & Sign x402 Invoice
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Execution Identity Panel */}
                <AnimatePresence>
                  {executionIdentity && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="bg-[#11151C] border border-emerald-500/20 rounded-2xl p-6 space-y-4 shadow-xl"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-white font-semibold text-sm font-sans">Execution Identity (EI) Receipt</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                        Minted upon payment verification, recorded permanently on the Private Governance Ledger (PGL) for cryptographically auditable compliance proof.
                      </p>
                      <div className="bg-[#0A0D14] border border-[#1E2430] p-4 rounded-xl font-mono text-[10px] space-y-2">
                        <div className="flex justify-between"><span className="text-slate-500">Proof Hash:</span><span className="text-cyan-400 truncate max-w-[200px]">{executionIdentity.proofHash}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Recipient Address:</span><span className="text-slate-300 truncate max-w-[200px]">{executionIdentity.recipient}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">SLA Endpoint:</span><span className="text-slate-300">{executionIdentity.endpoint}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Price Paid:</span><span className="text-emerald-400 font-bold">${executionIdentity.amount.toFixed(2)} USDC</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Timestamp:</span><span className="text-slate-400">{executionIdentity.timestamp}</span></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* x402 Terminal and Payload Inspector */}
              <div className="lg:col-span-7 space-y-6">
                {/* Live Console Logs */}
                <div className="bg-[#0A0D14] border border-[#1E2430] rounded-2xl overflow-hidden flex flex-col h-[260px]">
                  <div className="bg-[#11151C] border-b border-[#1E2430] px-4 py-3 flex items-center gap-2 shrink-0">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">x402 Flow Console</span>
                  </div>
                  <div className="p-5 space-y-2 overflow-auto flex-1 font-mono text-[11px] custom-scrollbar">
                    {x402Logs.length === 0 ? (
                      <p className="text-slate-600 italic font-sans">Initiate request above to observe transaction steps...</p>
                    ) : (
                      x402Logs.map((log, index) => (
                        <div key={index} className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* EIP-712 inspector */}
                <div className="bg-[#0A0D14] border border-[#1E2430] rounded-2xl overflow-hidden flex flex-col h-[320px]">
                  <div className="bg-[#11151C] border-b border-[#1E2430] px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">EIP-712 Typed Payment Challenge Payload</span>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400 font-sans">JSON Format</span>
                  </div>
                  <div className="p-5 overflow-auto flex-1 font-mono text-[11.5px] text-slate-400 custom-scrollbar">
                    {paymentRequirements ? (
                      <pre className="text-cyan-300">{highlightJson(paymentRequirements)}</pre>
                    ) : (
                      <p className="text-slate-600 italic font-sans">No challenge payload active. Trigger client request to fetch challenge metadata.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === "mpp" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* MPP Controller */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#11151C] border border-[#1E2430] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-white font-bold text-sm uppercase font-mono tracking-wide">MPP Sessions Gateway</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    micropayments streaming allows agents to pre-authorize session limits. Once a session is established, high-frequency calls bypass individual wallet signature approvals, saving up to 90% in transaction overhead.
                  </p>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="bg-[#0A0D14] border border-[#1E2430] p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Session Limit Deposit</span>
                        <span className="text-base font-black text-cyan-400 font-mono">${mppBalance.toFixed(2)} USDC</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        mppSessionActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500 border border-slate-700"
                      }`}>
                        {mppSessionActive ? "SESSION ACTIVE" : "NO ACTIVE SESSION"}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        onClick={initializeMppSession}
                        disabled={mppSessionActive}
                        className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-40 text-cyan-400 border border-cyan-500/20 py-3 rounded-xl font-bold text-center transition-colors"
                      >
                        Initialize MPP Session ($1.00 USDC Deposit)
                      </button>

                      {isStreaming ? (
                        <button
                          onClick={stopMppStreaming}
                          className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-3 rounded-xl font-bold text-center transition-colors flex items-center justify-center gap-2"
                        >
                          <Pause className="w-4 h-4" /> Pause Micropayments Stream
                        </button>
                      ) : (
                        <button
                          onClick={startMppStreaming}
                          disabled={!mppSessionActive || mppBalance <= 0}
                          className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 text-emerald-400 border border-emerald-500/20 py-3 rounded-xl font-bold text-center transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" /> Stream Micropayments (10 calls/s)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#11151C] border border-[#1E2430] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <h4 className="text-white font-semibold text-sm font-sans">Session Statistics</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                    <div className="bg-[#0A0D14] p-3 rounded-xl border border-[#1E2430]">
                      <span className="text-slate-500 block text-[9px] mb-1 font-sans">TOTAL REQUESTS</span>
                      <span className="text-white font-black text-sm">{mppCallsCount} calls</span>
                    </div>
                    <div className="bg-[#0A0D14] p-3 rounded-xl border border-[#1E2430]">
                      <span className="text-slate-500 block text-[9px] mb-1 font-sans">SAVED FEES</span>
                      <span className="text-emerald-400 font-black text-sm">${(mppCallsCount * 0.002).toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MPP Stream Console */}
              <div className="lg:col-span-7">
                <div className="bg-[#0A0D14] border border-[#1E2430] rounded-2xl overflow-hidden flex flex-col h-[480px]">
                  <div className="bg-[#11151C] border-b border-[#1E2430] px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">MPP Micropayments Live Stream</span>
                    </div>
                    {isStreaming && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                  <div className="p-5 space-y-2 overflow-auto flex-1 font-mono text-[10.5px] text-slate-400 custom-scrollbar">
                    {mppLogs.length === 0 ? (
                      <p className="text-slate-600 italic font-sans">Unlock session and start streaming to view high-frequency requests...</p>
                    ) : (
                      mppLogs.map((log, index) => (
                        <div key={index} className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === "acp" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* ACP Negotiation Console */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#11151C] border border-[#1E2430] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-bold text-sm uppercase font-mono tracking-wide">Dual-ACP Service Negotiation</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Model agentic commerce lifecycle where client and server negotiate service parameters (SLIs), pledge collateral bonds, and commit a Proof of Agreement (PoA) before any API transactions commence.
                  </p>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="bg-[#0A0D14] border border-[#1E2430] p-4 rounded-xl space-y-3 font-mono">
                      <div className="text-[10px] text-slate-500 uppercase font-bold border-b border-[#1E2430] pb-1.5">Target SLA parameters</div>
                      <div className="flex justify-between"><span className="text-slate-400">Uptime Threshold:</span><span className="text-white font-bold">&gt;= {negotiatedSLOs.uptime}%</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">p99 Latency Limit:</span><span className="text-white font-bold">&lt; {negotiatedSLOs.latency}ms</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Service cost per call:</span><span className="text-emerald-400 font-bold">${negotiatedSLOs.cost.toFixed(2)} USDC</span></div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={initiateACPNegotiation}
                        disabled={acpStep !== "idle" && acpStep !== "complete"}
                        className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-40 text-purple-400 border border-purple-500/20 py-3 rounded-xl font-bold text-center transition-colors font-sans"
                      >
                        Negotiate SLA Contract
                      </button>

                      {(acpStep === "complete" || acpStep === "escrow") && (
                        <button
                          onClick={resetACP}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 rounded-xl text-xs font-semibold transition-colors font-sans"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Bond Escrow */}
                <AnimatePresence>
                  {acpStep === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-5 space-y-3 shadow-xl"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-purple-400" />
                        <h4 className="text-white font-semibold text-xs uppercase font-mono tracking-wide">Active Bond Escrow</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                        USDC collateral is locked in the virtuals negotiation contract, held as security. Payout / refund executes automatically based on DSLA Oracle performance analysis.
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
                        <div className="bg-[#0A0D14] border border-[#1E2430] p-2.5 rounded-xl">
                          <span className="text-slate-500 block text-[9px] mb-1 font-sans">CLIENT DEPOSIT</span>
                          <span className="text-emerald-400 font-bold">$10.00 USDC</span>
                        </div>
                        <div className="bg-[#0A0D14] border border-[#1E2430] p-2.5 rounded-xl">
                          <span className="text-slate-500 block text-[9px] mb-1 font-sans">PROVIDER ASSURANCE</span>
                          <span className="text-emerald-400 font-bold">$10.00 USDC</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ACP Negotiation Console logs */}
              <div className="lg:col-span-7">
                <div className="bg-[#0A0D14] border border-[#1E2430] rounded-2xl overflow-hidden flex flex-col h-[480px]">
                  <div className="bg-[#11151C] border-b border-[#1E2430] px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-purple-400" />
                      <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">Dual-ACP Negotiation Pipeline</span>
                    </div>
                    {acpStep !== "idle" && acpStep !== "complete" && <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
                  </div>
                  <div className="p-5 space-y-2.5 overflow-auto flex-1 font-mono text-[10.5px] text-slate-400 custom-scrollbar">
                    {acpLogs.length === 0 ? (
                      <p className="text-slate-600 italic font-sans">Initiate B2B negotiation to view communications telemetry...</p>
                    ) : (
                      acpLogs.map((log, index) => (
                        <div key={index} className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === "security" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Exploit Controller */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#11151C] border border-[#1E2430] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                    <h3 className="text-white font-bold text-sm uppercase font-mono tracking-wide">Security Exploit Sandbox</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Observe vulnerabilities inherent in naive machine payment integrations and test robust defensive mitigations (Pessimistic locking and Context-Binding).
                  </p>

                  <div className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Select Exploit Scenario</label>
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "free-rider", label: "Free-Rider Exploit (Sync Gap)", desc: "Exploit block finality latency to stream parallel requests" },
                          { id: "context-replay", label: "Context Replay (Ambiguity)", desc: "Use low-cost index request signature to fetch premium Llama AI model" }
                        ].map((ex) => (
                          <button
                            key={ex.id}
                            onClick={() => {
                              setSelectedExploit(ex.id as any);
                              setExploitStatus("idle");
                              setExploitLogs([]);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              selectedExploit === ex.id
                                ? "bg-rose-500/10 border-rose-500/40 text-white"
                                : "bg-[#0A0D14] border-[#1E2430] text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <div className="font-bold text-xs">{ex.label}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{ex.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mitigation Toggle */}
                    <div className="bg-[#0A0D14] border border-[#1E2430] p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-white font-bold text-xs block">Defensive Mitigation</span>
                        <span className="text-[10px] text-slate-500">
                          {selectedExploit === "free-rider" ? "Pessimistic Nonce Locking" : "Cryptographic Context-Binding"}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSecurityMitigationActive(!securityMitigationActive);
                          setExploitStatus("idle");
                          setExploitLogs([]);
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                          securityMitigationActive ? "bg-emerald-500" : "bg-slate-700"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                            securityMitigationActive ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={triggerExploitSim}
                      disabled={exploitStatus === "running"}
                      className={`w-full py-3 rounded-xl font-bold text-center transition-colors border ${
                        exploitStatus === "running"
                          ? "bg-slate-800 border-slate-700 text-slate-500"
                          : "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {exploitStatus === "running" ? (
                        <span className="flex items-center justify-center gap-1.5 font-sans">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Launching Attack...
                        </span>
                      ) : (
                        `Simulate Exploit Attack`
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Exploit Simulator Logs */}
              <div className="lg:col-span-7">
                <div className="bg-[#0A0D14] border border-[#1E2430] rounded-2xl overflow-hidden flex flex-col h-[480px]">
                  <div className="bg-[#11151C] border-b border-[#1E2430] px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-rose-400 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">Defensive Exploit Terminal</span>
                    </div>
                    {exploitStatus === "breached" ? (
                      <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase">SYSTEM BREACHED</span>
                    ) : exploitStatus === "blocked" ? (
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">ATTACK BLOCKED</span>
                    ) : exploitStatus === "running" ? (
                      <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase animate-pulse">ATTACKING...</span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded uppercase">STANDBY</span>
                    )}
                  </div>
                  <div className="p-5 space-y-2.5 overflow-auto flex-1 font-mono text-[10.5px] text-slate-400 custom-scrollbar">
                    {exploitLogs.length === 0 ? (
                      <p className="text-slate-600 italic font-sans">Trigger simulated exploit to log execution telemetry details...</p>
                    ) : (
                      exploitLogs.map((log, index) => {
                        let color = "text-slate-400";
                        if (log.includes("EXPLOIT BREACH")) color = "text-rose-400 font-bold";
                        if (log.includes("MITIGATION SUCCESSFUL")) color = "text-emerald-400 font-bold";
                        return (
                          <div key={index} className={`${color} whitespace-pre-wrap leading-relaxed`}>
                            {log}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informative Footer */}
        <footer className="border-t border-[#1E2430] bg-[#11151C]/30 rounded-2xl py-6 px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-sans">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">VNP Payments Stack Discovery</p>
            <p>EIP-712 Signature validation • USDC Escrows • Session key authorization</p>
          </div>
          <p className="font-mono text-[11px] text-slate-400 bg-[#0A0D14] border border-[#1E2430] px-3.5 py-1.5 rounded-lg">
            Facilitator contract: {CONFIG.VEKLOM_ADDRESS}
          </p>
        </footer>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E2430; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2A3441; }
      `}} />
    </Shell>
  );
}
