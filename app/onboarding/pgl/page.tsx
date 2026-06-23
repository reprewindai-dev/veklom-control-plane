"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { Button, ErrorBox } from "@/components/ui";
import { motion, AnimatePresence } from "motion/react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileKey,
  Landmark,
  Layers,
  Shield,
  User,
  Wallet,
  Activity,
  Fingerprint,
  Globe,
  Database,
  Lock,
} from "lucide-react";

const STEPS = [
  { id: "identity", label: "Operator Identity", icon: User },
  { id: "workspace", label: "Workspace Authority", icon: Layers },
  { id: "certificate", label: "Agent Certificate", icon: FileKey },
  { id: "genome", label: "Genome Setup", icon: Cpu },
  { id: "ledger", label: "Ledger Root", icon: Landmark },
  { id: "payment", label: "Payment Binding", icon: Wallet },
  { id: "proof", label: "First Proof", icon: Shield },
];

interface PGLStatus {
  mode: string;
  mode_display: string;
  has_pgl_profile: boolean;
  requires_onboarding: boolean;
  workspace_id: string;
  profile: {
    certificate_id: string;
    actor_id: string;
    genome_hash: string;
    status: string;
    ledger_event_count: number;
    chain_head: string | null;
  } | null;
}

export default function PGLOnboardingPage() {
  const router = useRouter();
  const status = useApi<PGLStatus>("/api/v1/pgl/status");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [operator, setOperator] = useState({ name: "", email: "" });
  const [workspace, setWorkspace] = useState({
    name: "",
    authority_level: "standard",
    compliance_frameworks: [] as string[],
  });
  const [agent, setAgent] = useState({
    name: "",
    jurisdiction: "US",
    declared_purpose: "",
    intended_use: "",
    risk_category: "low",
  });
  const [genome, setGenome] = useState({
    tools: ["web_search", "file_access"],
    permissions: ["read", "write"],
    safety_rules: ["no_sensitive_data", "human_approval_required"],
  });
  const [wallet, setWallet] = useState({
    address: "",
    payment_methods: [] as string[],
  });
  const [mode, setMode] = useState<string>("local-dev");

  useEffect(() => {
    if (status.data?.mode) setMode(status.data.mode);
    if (status.data?.has_pgl_profile) router.replace("/dashboard");
  }, [status.data, router]);

  const [operatorId, setOperatorId] = useState<string>("");
  const [certificateId, setCertificateId] = useState<string>("");

  const handleNext = async () => {
    setLoading(true);
    setError(undefined);

    try {
      if (step === 0) {
        await api("/api/v1/pgl/onboarding/operator-identity", {
          body: { operator_name: operator.name, email: operator.email },
        });
      } else if (step === 1) {
        await api("/api/v1/pgl/onboarding/workspace-authority", {
          body: {
            name: workspace.name,
            authority_level: workspace.authority_level,
            permissions: workspace.compliance_frameworks,
          },
        });
      } else if (step === 2) {
        const certRes = await api<{ certificate_id: string }>(
          "/api/v1/pgl/onboarding/agent-certificate",
          {
            body: {
              agent_name: agent.name,
              agent_type: "autonomous",
              capabilities: genome.tools,
              safety_rules: genome.safety_rules,
              jurisdiction: agent.jurisdiction,
              declared_purpose: agent.declared_purpose,
              intended_use: agent.intended_use,
              risk_category: agent.risk_category,
              tools: genome.tools,
              permissions: genome.permissions,
            },
          }
        );
        setCertificateId(certRes.certificate_id || "");
      } else if (step === 3) {
        // Genome Preview (already submitted in step 2 technically, or handled locally)
      } else if (step === 4) {
        await api("/api/v1/pgl/onboarding/ledger-lineage", {
          body: { certificate_id: certificateId, genesis_block: "GENESIS" },
        });
      } else if (step === 5) {
        // Payment Binding
      } else if (step === 6) {
        await api("/api/v1/pgl/onboarding/first-proof", {
          body: {
            certificate_id: certificateId,
            proof_type: "identity_anchor",
            payload: { wallet_address: wallet.address },
          },
        });
        await api("/api/v1/pgl/onboarding/complete", { body: {} });
        router.replace("/dashboard");
        return;
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (status.isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-pulse text-brand-500 font-mono tracking-widest text-sm">
          INITIALIZING PGL PROTOCOL...
        </div>
      </div>
    );
  }

  const activeStep = STEPS[step];
  const Icon = activeStep.icon;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* LEFT PANEL: Data Visualization & Status */}
      <motion.div
        className="w-full md:w-1/2 lg:w-5/12 bg-[#0a0a0a] border-r border-white/5 p-8 lg:p-12 flex flex-col relative overflow-hidden"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Subtle background glow */}
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="z-10 flex-1 flex flex-col">
          <div className="mb-12">
            <h1 className="text-3xl lg:text-4xl font-light tracking-tight mb-2">
              Genome <span className="font-semibold text-brand-400">Ledger</span>
            </h1>
            <p className="text-ink-400 text-sm max-w-sm leading-relaxed">
              Provisioning Sovereign Authority node. Establishing secure telemetry
              and immutable operational chains.
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }}
                transition={{ duration: 0.4 }}
                className="w-full flex items-center justify-center"
              >
                {step === 0 && <OperatorVisualizer operator={operator} />}
                {step === 1 && <WorkspaceVisualizer workspace={workspace} />}
                {step === 2 && <AgentVisualizer agent={agent} />}
                {step === 3 && <GenomeVisualizer genome={genome} />}
                {step === 4 && <LedgerVisualizer workspace={workspace} />}
                {step === 5 && <WalletVisualizer wallet={wallet} />}
                {step === 6 && <ProofVisualizer />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 flex items-center gap-4">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <div className="text-xs font-mono text-ink-500 font-semibold tracking-widest">
              0{step + 1} / 0{STEPS.length}
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT PANEL: Interactive Forms */}
      <div className="flex-1 relative overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto p-8 lg:p-16 min-h-screen flex flex-col justify-center">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <ErrorBox message={error} />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6">
              <Icon className="w-3.5 h-3.5" />
              {activeStep.label}
            </div>
            <h2 className="text-3xl font-medium tracking-tight mb-2">
              {step === 0 && "Identify the Operator"}
              {step === 1 && "Establish Authority"}
              {step === 2 && "Issue Certificate"}
              {step === 3 && "Synthesize Genome"}
              {step === 4 && "Initialize Ledger"}
              {step === 5 && "Bind Payment"}
              {step === 6 && "Finalize Proof"}
            </h2>
            <p className="text-ink-400 text-sm">
              {step === 0 && "Who operates this sovereign node?"}
              {step === 1 && "Configure compliance frameworks and operational scope."}
              {step === 2 && "Define the baseline attributes of your first agent."}
              {step === 3 && "Select the capabilities and rigid safety rails."}
              {step === 4 && "Anchor the cryptographic genesis block."}
              {step === 5 && "Link an optional funding source for autonomous executions."}
              {step === 6 && "Run a localized proof to verify chain integrity."}
            </p>
          </motion.div>

          {/* Form Container with Glassmorphism */}
          <div className="bg-bg-800/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 lg:p-8 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 0 && (
                  <div className="space-y-5">
                    <div className="mb-6 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                      <h4 className="text-sm font-semibold text-brand-400 mb-1">Why this matters</h4>
                      <p className="text-xs text-brand-400/80 leading-relaxed">
                        Establishing a cryptographically bound Operator Identity ensures that all autonomous actions trace back to an authorized human. This prevents unauthorized usage and guarantees compliance with enterprise security models.
                      </p>
                    </div>
                    <Field
                      label="Full Name"
                      value={operator.name}
                      onChange={(v) => setOperator({ ...operator, name: v })}
                      placeholder="Jane Doe"
                    />
                    <Field
                      label="Secure Email"
                      value={operator.email}
                      onChange={(v) => setOperator({ ...operator, email: v })}
                      placeholder="operator@domain.com"
                    />
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    <div className="mb-4 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                      <h4 className="text-sm font-semibold text-brand-400 mb-1">Architectural Isolation</h4>
                      <p className="text-xs text-brand-400/80 leading-relaxed">
                        Authority levels dictate row-level security (RLS) deep within the database. By strictly defining compliance frameworks and authority here, you guarantee that even if an agent goes rogue, it is mathematically isolated from your core infrastructure.
                      </p>
                    </div>
                    <Field
                      label="Workspace Designation"
                      value={workspace.name}
                      onChange={(v) => setWorkspace({ ...workspace, name: v })}
                      placeholder="Alpha Core"
                    />
                    <Select
                      label="Authority Level"
                      value={workspace.authority_level}
                      onChange={(v) => setWorkspace({ ...workspace, authority_level: v })}
                      options={[
                        { value: "basic", label: "Basic — Standard operations" },
                        { value: "standard", label: "Standard — Enhanced controls" },
                        { value: "enterprise", label: "Enterprise — Full governance" },
                        { value: "sovereign", label: "Sovereign — Maximum isolation" },
                      ]}
                    />
                    <div>
                      <label className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-3">
                        Compliance Frameworks
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {["SOC2", "ISO27001", "GDPR", "HIPAA", "PCI-DSS"].map((f) => (
                          <ToggleButton
                            key={f}
                            label={f}
                            active={workspace.compliance_frameworks.includes(f)}
                            onClick={() => {
                              setWorkspace((prev) => ({
                                ...prev,
                                compliance_frameworks: prev.compliance_frameworks.includes(f)
                                  ? prev.compliance_frameworks.filter((x) => x !== f)
                                  : [...prev.compliance_frameworks, f],
                              }));
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div className="mb-4 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                      <h4 className="text-sm font-semibold text-brand-400 mb-1">Unforgeable AI Identity</h4>
                      <p className="text-xs text-brand-400/80 leading-relaxed">
                        Unlike traditional API keys, this certificate is cryptographically fused to the agent's behavior pattern. If an unknown entity attempts to execute under this name, the runtime enforcement network will instantly terminate the connection.
                      </p>
                    </div>
                    <Field
                      label="Agent Designation"
                      value={agent.name}
                      onChange={(v) => setAgent({ ...agent, name: v })}
                      placeholder="Nexus-1"
                    />
                    <div className="grid grid-cols-2 gap-5">
                      <Select
                        label="Jurisdiction"
                        value={agent.jurisdiction}
                        onChange={(v) => setAgent({ ...agent, jurisdiction: v })}
                        options={[
                          { value: "US", label: "United States" },
                          { value: "EU", label: "European Union" },
                          { value: "UK", label: "United Kingdom" },
                          { value: "CA", label: "Canada" },
                        ]}
                      />
                      <Select
                        label="Risk Profile"
                        value={agent.risk_category}
                        onChange={(v) => setAgent({ ...agent, risk_category: v })}
                        options={[
                          { value: "low", label: "Low Risk" },
                          { value: "medium", label: "Medium Risk" },
                          { value: "high", label: "High Risk" },
                        ]}
                      />
                    </div>
                    <Field
                      label="Declared Purpose"
                      value={agent.declared_purpose}
                      onChange={(v) => setAgent({ ...agent, declared_purpose: v })}
                      placeholder="Codebase refactoring and analysis"
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8">
                    <div className="mb-2 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                      <h4 className="text-sm font-semibold text-brand-400 mb-1">The Laws of Physics for Your Agent</h4>
                      <p className="text-xs text-brand-400/80 leading-relaxed">
                        These are not soft prompts. The Genome defines the absolute capabilities and hard constraints enforced at the network proxy layer. If an agent tries to use an unapproved tool, the packet is dropped before it reaches the target.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-3">
                        Tool Access
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["web_search", "file_access", "api_calls", "database_query", "code_execution", "email"].map((t) => (
                          <ToggleButton
                            key={t}
                            label={t.replace("_", " ")}
                            active={genome.tools.includes(t)}
                            onClick={() => {
                              setGenome((p) => ({
                                ...p,
                                tools: p.tools.includes(t) ? p.tools.filter((x) => x !== t) : [...p.tools, t],
                              }));
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-3">
                        System Permissions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["read", "write", "execute", "network", "admin"].map((p) => (
                          <ToggleButton
                            key={p}
                            label={p}
                            active={genome.permissions.includes(p)}
                            onClick={() => {
                              setGenome((prev) => ({
                                ...prev,
                                permissions: prev.permissions.includes(p)
                                  ? prev.permissions.filter((x) => x !== p)
                                  : [...prev.permissions, p],
                              }));
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-3 text-red-400">
                        Hard Rails
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["no_sensitive_data", "human_approval_required", "rate_limited", "audit_logging"].map((r) => (
                          <ToggleButton
                            key={r}
                            label={r.replace(/_/g, " ")}
                            active={genome.safety_rules.includes(r)}
                            danger
                            onClick={() => {
                              setGenome((prev) => ({
                                ...prev,
                                safety_rules: prev.safety_rules.includes(r)
                                  ? prev.safety_rules.filter((x) => x !== r)
                                  : [...prev.safety_rules, r],
                              }));
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div className="mb-2 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                      <h4 className="text-sm font-semibold text-brand-400 mb-1">Your Mathematical Truth</h4>
                      <p className="text-xs text-brand-400/80 leading-relaxed">
                        The ledger root forms the unalterable foundation of your evidence chain. 
                        Every subsequent action, proof, and execution by this agent will be cryptographically hashed to this block. You now have mathematical proof of what your agents do, eliminating liability and enabling trust.
                      </p>
                    </div>
                    <div className="p-6 rounded-xl bg-[#0a0a0a] border border-white/5 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-brand-400" />
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-widest text-ink-500 mb-1 font-semibold">
                            Genesis Block
                          </div>
                          <div className="font-mono text-sm text-white/90">
                            ledger://{workspace.name.toLowerCase().replace(/\s+/g, "-") || "workspace"}/root
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <Field
                      label="Web3 Address or Billing ID (Optional)"
                      value={wallet.address}
                      onChange={(v) => setWallet({ ...wallet, address: v })}
                      placeholder="0x..."
                    />
                    <div>
                      <label className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-3">
                        Allowed Methods
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {["stripe", "paypal", "crypto", "wire"].map((m) => (
                          <ToggleButton
                            key={m}
                            label={m}
                            active={wallet.payment_methods.includes(m)}
                            onClick={() => {
                              setWallet((p) => ({
                                ...p,
                                payment_methods: p.payment_methods.includes(m)
                                  ? p.payment_methods.filter((x) => x !== m)
                                  : [...p.payment_methods, m],
                              }));
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="py-8 text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-20 h-20 mx-auto rounded-full bg-brand-500/20 flex items-center justify-center mb-6"
                    >
                      <CheckCircle2 className="w-10 h-10 text-brand-400" />
                    </motion.div>
                    <h3 className="text-xl font-medium">All Systems Go</h3>
                    <p className="text-ink-400 text-sm max-w-sm mx-auto">
                      Your sovereign architecture is prepared. Initiating the first cryptographic proof to unlock the control plane.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || loading}
              className="hover:bg-white/5 text-ink-300"
            >
              Go Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                loading ||
                (step === 0 && (!operator.name || !operator.email)) ||
                (step === 1 && !workspace.name) ||
                (step === 2 && !agent.name)
              }
              className="bg-brand-500 hover:bg-brand-400 text-bg-900 font-semibold px-8 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
            >
              {loading ? (
                <span className="animate-pulse">Processing Sequence...</span>
              ) : step === STEPS.length - 1 ? (
                <>
                  Initialize Control Plane <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Proceed <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {mode !== "live" && (
            <div className="mt-12 text-center">
              <Link
                href="/dashboard"
                className="text-xs text-ink-500 hover:text-ink-300 border-b border-dashed border-ink-600 pb-0.5 transition-colors"
              >
                Skip initialization (Replay Mode)
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Visualizer Components (Left Panel) ---

function OperatorVisualizer({ operator }: { operator: { name: string; email: string } }) {
  return (
    <div className="relative w-full max-w-sm aspect-square flex flex-col items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-dashed border-brand-500/20 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-8 border border-white/5 rounded-full"
      />
      <div className="z-10 bg-bg-900/80 backdrop-blur p-6 rounded-2xl border border-white/10 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto bg-brand-500/10 rounded-full flex items-center justify-center mb-4">
          <Fingerprint className="w-8 h-8 text-brand-400" />
        </div>
        <div className="text-xl font-medium text-white mb-1">
          {operator.name || "Awaiting Operator"}
        </div>
        <div className="text-sm text-ink-500 font-mono">
          {operator.email || "Identify yourself..."}
        </div>
      </div>
    </div>
  );
}

function WorkspaceVisualizer({
  workspace,
}: {
  workspace: { name: string; authority_level: string; compliance_frameworks: string[] };
}) {
  return (
    <div className="w-full">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white/5 rounded-xl">
            <Globe className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-ink-500 font-semibold mb-1">
              Active Zone
            </div>
            <div className="text-lg font-medium">
              {workspace.name || "Unassigned"}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-ink-400">Authority Clearance</span>
              <span className="text-brand-400 uppercase font-mono">
                {workspace.authority_level}
              </span>
            </div>
            <div className="h-2 w-full bg-bg-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand-500"
                initial={{ width: 0 }}
                animate={{
                  width:
                    workspace.authority_level === "basic"
                      ? "25%"
                      : workspace.authority_level === "standard"
                      ? "50%"
                      : workspace.authority_level === "enterprise"
                      ? "75%"
                      : "100%",
                }}
              />
            </div>
          </div>
          {workspace.compliance_frameworks.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <div className="text-xs text-ink-500 mb-3 uppercase tracking-wider font-semibold">
                Active Frameworks
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {workspace.compliance_frameworks.map((f) => (
                    <motion.div
                      key={f}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="px-2 py-1 text-xs font-mono bg-white/5 border border-white/10 rounded text-ink-300"
                    >
                      {f}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentVisualizer({ agent }: { agent: any }) {
  // Translate agent properties into chart data
  const data = [
    { subject: "Risk Profile", A: agent.risk_category === "high" ? 90 : agent.risk_category === "medium" ? 60 : 30, fullMark: 100 },
    { subject: "Autonomy", A: 80, fullMark: 100 },
    { subject: "Isolation", A: agent.jurisdiction === "EU" ? 95 : 70, fullMark: 100 },
    { subject: "Capabilities", A: agent.name ? 85 : 40, fullMark: 100 },
    { subject: "Scope", A: agent.declared_purpose ? 75 : 30, fullMark: 100 },
  ];

  return (
    <div className="w-full h-80 flex flex-col items-center">
      <div className="text-center mb-2">
        <h3 className="font-mono text-brand-400 text-lg uppercase tracking-widest">
          {agent.name || "NEXUS-?"}
        </h3>
        <p className="text-xs text-ink-500 uppercase">{agent.jurisdiction} Node</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#888", fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Agent"
            dataKey="A"
            stroke="#10b981"
            strokeWidth={2}
            fill="#10b981"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function GenomeVisualizer({ genome }: { genome: any }) {
  const jsonString = JSON.stringify(
    {
      version: "v1.0.0-rc",
      tools: genome.tools,
      perms: genome.permissions,
      constraints: genome.safety_rules,
    },
    null,
    2
  );

  return (
    <div className="w-full font-mono text-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-white/5 border-b border-white/5 px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-amber-500/50" />
          <div className="w-2 h-2 rounded-full bg-brand-500/50" />
          <span className="ml-2 text-xs text-ink-500">genome.json</span>
        </div>
        <div className="p-4 overflow-x-auto text-brand-400/80">
          <pre>
            <motion.code
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={jsonString}
            >
              {jsonString}
            </motion.code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function LedgerVisualizer({ workspace }: { workspace: any }) {
  return (
    <div className="w-full flex flex-col items-center gap-4">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.2 }}
          className={`w-64 p-4 rounded-xl border flex items-center justify-between ${
            i === 1
              ? "bg-brand-500/10 border-brand-500/30"
              : "bg-[#0a0a0a] border-white/5 opacity-50"
          }`}
        >
          <div>
            <div className="text-xs text-ink-500 uppercase tracking-widest mb-1">
              {i === 1 ? "Genesis Block" : `Block #${i - 1}`}
            </div>
            <div className="font-mono text-xs text-white/80">
              {i === 1
                ? `hash_${Math.random().toString(16).slice(2, 10)}`
                : "pending..."}
            </div>
          </div>
          <Database className={`w-4 h-4 ${i === 1 ? "text-brand-400" : "text-ink-600"}`} />
        </motion.div>
      ))}
    </div>
  );
}

function WalletVisualizer({ wallet }: { wallet: any }) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="aspect-[1.6] rounded-2xl bg-gradient-to-br from-bg-800 to-bg-900 border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="flex justify-between items-start">
          <Activity className="w-6 h-6 text-ink-400" />
          <div className="flex gap-1">
            {wallet.payment_methods.map((m: string) => (
              <div key={m} className="w-6 h-4 bg-white/10 rounded-sm" />
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-widest mb-2 font-mono">
            Bound Address
          </div>
          <div className="font-mono text-sm truncate">
            {wallet.address || "0x0000...0000"}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofVisualizer() {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-brand-500/20 rounded-full blur-xl"
      />
      <Shield className="w-20 h-20 text-brand-400 relative z-10" />
    </div>
  );
}

// --- Reusable Form Components ---

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-2">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-ink-600 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-bg-900 text-white">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
  danger,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
        active
          ? danger
            ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
            : "bg-brand-500/20 text-brand-400 border border-brand-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
          : "bg-white/5 text-ink-400 border border-white/5 hover:bg-white/10 hover:text-ink-300"
      }`}
    >
      {label}
    </button>
  );
}
