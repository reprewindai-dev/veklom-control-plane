"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import Shell from "@/components/Shell";
import { Button, Card, PageHeader, ErrorBox } from "@/components/ui";
import {
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileKey,
  Fingerprint,
  Globe,
  KeyRound,
  Landmark,
  Layers,
  Link2,
  Shield,
  User,
  Wallet,
} from "lucide-react";

const STEPS = [
  { id: "identity", label: "Operator Identity", icon: User },
  { id: "workspace", label: "Workspace Authority", icon: Layers },
  { id: "certificate", label: "Agent Certificate", icon: FileKey },
  { id: "genome", label: "Genome Preview", icon: Cpu },
  { id: "ledger", label: "Ledger Root", icon: Landmark },
  { id: "payment", label: "Payment Binding", icon: Wallet },
  { id: "proof", label: "First Proof", icon: Shield },
];

interface PGLStatus {
  mode: string;
  mode_display: string;
  has_pgl_profile: boolean;
  requires_onboarding: boolean;
  profile: {
    agent_id: string;
    agent_name: string;
    certificate: {
      id: string;
      genome_version: string;
      genome_hash: string;
      jurisdiction: string;
    };
    operator: { id: string; name: string; email: string };
    workspace: { id: string; name: string };
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
    compliance_frameworks: [] as string[]
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
    safety_rules: ["no_sensitive_data", "human_approval_required"]
  });
  const [wallet, setWallet] = useState({ 
    address: "",
    payment_methods: [] as string[]
  });
  const [mode, setMode] = useState<string>("local-dev");

  useEffect(() => {
    if (status.data?.mode) {
      setMode(status.data.mode);
    }
    if (status.data?.has_pgl_profile) {
      router.replace("/dashboard");
    }
  }, [status.data, router]);

  const handleNext = async () => {
    setLoading(true);
    setError(undefined);

    try {
      if (step === 0) {
        await api("/api/v1/pgl/bootstrap-operator", {
          body: { name: operator.name, email: operator.email },
        });
      } else if (step === 1) {
        await api("/api/v1/pgl/create-workspace-authority", {
          body: { 
            name: workspace.name, 
            authority_level: workspace.authority_level,
            compliance_frameworks: workspace.compliance_frameworks,
            operator_id: "operator_1" 
          },
        });
      } else if (step === 2) {
        await api("/api/v1/pgl/issue-certificate", {
          body: {
            agent_name: agent.name,
            operator_id: "operator_1",
            workspace_id: "workspace_1",
            jurisdiction: agent.jurisdiction,
            declared_purpose: agent.declared_purpose,
            intended_use: agent.intended_use,
            risk_category: agent.risk_category,
          },
        });
      } else if (step === 3) {
        await api("/api/v1/pgl/create-genome", {
          body: {
            tools: genome.tools,
            permissions: genome.permissions,
            safety_rules: genome.safety_rules,
            agent_id: "agent_1",
            workspace_id: "workspace_1"
          },
        });
      } else if (step === 4) {
        await api("/api/v1/pgl/initialize-ledger", {
          body: { 
            workspace_id: "workspace_1",
            agent_id: "agent_1"
          },
        });
      } else if (step === 5) {
        await api("/api/v1/pgl/bind-payment", {
          body: {
            wallet_address: wallet.address,
            payment_methods: wallet.payment_methods,
            workspace_id: "workspace_1"
          },
        });
      } else if (step === 6) {
        await api("/api/v1/pgl/complete", { body: {} });
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
      <Shell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-ink-400">Loading PGL status...</div>
        </div>
      </Shell>
    );
  }

  const activeStep = STEPS[step];
  const Icon = activeStep.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Shell>
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="PGL Onboarding"
          subtitle="Create your Agent Authority profile before accessing production."
        />

        {error && <ErrorBox message={error} className="mb-4" />}

        <ModeIndicator mode={mode} />

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-ink-400 mb-2">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-bg-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`flex-1 h-1 rounded-full ${
                  i <= step ? "bg-brand-500" : "bg-bg-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-brand-500/10">
              <Icon className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{activeStep.label}</h2>
              <p className="text-sm text-ink-400">
                {step === 0 && "Create your operator identity for the PGL ledger."}
                {step === 1 && "Configure workspace authority level and compliance frameworks."}
                {step === 2 && "Issue the first agent birth certificate."}
                {step === 3 && "Define agent tools, permissions, and safety rules."}
                {step === 4 && "Initialize the tamper-evident ledger."}
                {step === 5 && "Connect payment methods for budget management (optional)."}
                {step === 6 && "Run the first harmless proof to verify the chain."}
              </p>
            </div>
          </div>

          {/* Step Forms */}
          {step === 0 && (
            <div className="space-y-4">
              <Field
                label="Operator Name"
                value={operator.name}
                onChange={(v) => setOperator({ ...operator, name: v })}
                placeholder="Your name"
              />
              <Field
                label="Email"
                value={operator.email}
                onChange={(v) => setOperator({ ...operator, email: v })}
                placeholder="you@example.com"
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field
                label="Workspace Name"
                value={workspace.name}
                onChange={(v) => setWorkspace({ ...workspace, name: v })}
                placeholder="My Workspace"
              />
              <div>
                <label className="text-xs text-ink-400">Authority Level</label>
                <select
                  value={workspace.authority_level}
                  onChange={(e) => setWorkspace({ ...workspace, authority_level: e.target.value })}
                  className="mt-1 w-full bg-bg-700 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-brand-500"
                >
                  <option value="basic">Basic - Standard operations</option>
                  <option value="standard">Standard - Enhanced controls</option>
                  <option value="enterprise">Enterprise - Full governance</option>
                  <option value="sovereign">Sovereign - Maximum isolation</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-400">Compliance Frameworks</label>
                <div className="space-y-2 mt-1">
                  {["SOC2", "ISO27001", "GDPR", "HIPAA", "PCI-DSS"].map(framework => (
                    <label key={framework} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={workspace.compliance_frameworks.includes(framework)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWorkspace(prev => ({
                              ...prev,
                              compliance_frameworks: [...prev.compliance_frameworks, framework]
                            }));
                          } else {
                            setWorkspace(prev => ({
                              ...prev,
                              compliance_frameworks: prev.compliance_frameworks.filter(f => f !== framework)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-ink-300 text-sm">{framework}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-bg-700/50 border border-border">
                <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">
                  Authority Preview
                </div>
                <code className="text-xs text-ink-300 font-mono">
                  authority://{workspace.name.toLowerCase().replace(/\s+/g, "-") || "workspace"}/{workspace.authority_level}
                </code>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field
                label="Agent Name"
                value={agent.name}
                onChange={(v) => setAgent({ ...agent, name: v })}
                placeholder="My First Agent"
              />
              <div className="grid grid-cols-2 gap-4">
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
                  label="Risk Category"
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
                placeholder="What will this agent do?"
              />
              <Field
                label="Intended Use"
                value={agent.intended_use}
                onChange={(v) => setAgent({ ...agent, intended_use: v })}
                placeholder="Production, testing, research..."
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-400">Available Tools</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {["web_search", "file_access", "api_calls", "database_query", "code_execution", "email"].map(tool => (
                    <label key={tool} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={genome.tools.includes(tool)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGenome(prev => ({
                              ...prev,
                              tools: [...prev.tools, tool]
                            }));
                          } else {
                            setGenome(prev => ({
                              ...prev,
                              tools: prev.tools.filter(t => t !== tool)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-ink-300 text-sm">{tool.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-ink-400">Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {["read", "write", "execute", "network", "admin"].map(perm => (
                    <label key={perm} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={genome.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGenome(prev => ({
                              ...prev,
                              permissions: [...prev.permissions, perm]
                            }));
                          } else {
                            setGenome(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(p => p !== perm)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-ink-300 text-sm">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-ink-400">Safety Rules</label>
                <div className="space-y-2 mt-1">
                  {["no_sensitive_data", "human_approval_required", "rate_limited", "audit_logging"].map(rule => (
                    <label key={rule} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={genome.safety_rules.includes(rule)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGenome(prev => ({
                              ...prev,
                              safety_rules: [...prev.safety_rules, rule]
                            }));
                          } else {
                            setGenome(prev => ({
                              ...prev,
                              safety_rules: prev.safety_rules.filter(r => r !== rule)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-ink-300 text-sm">{rule.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-bg-700/50 border border-border">
                <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">
                  Genome Preview
                </div>
                <code className="text-xs text-ink-300 font-mono block mb-2">
                  {`{
  "genome_version": "1.0.0",
  "genome_hash": "sha256:a1b2c3...",
  "tools": [${genome.tools.map(t => `"${t}"`).join(", ")}],
  "permissions": [${genome.permissions.map(p => `"${p}"`).join(", ")}],
  "safety_rules": [${genome.safety_rules.map(r => `"${r}"`).join(", ")}],
  "agent_id": "agent_${agent.name.toLowerCase().replace(/\s+/g, "_") || "alpha"}",
  "workspace_id": "ws_${workspace.name.toLowerCase().replace(/\s+/g, "_") || "default"}"
}`}
                </code>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-bg-700/50 border border-border">
                <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">
                  Ledger Root
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Landmark className="w-4 h-4 text-brand-500" />
                  <span className="font-mono text-ink-300">
                    ledger://{workspace.name.toLowerCase().replace(/\s+/g, "-") || "workspace"}/root
                  </span>
                </div>
              </div>
              <p className="text-sm text-ink-400">
                The ledger root is the first entry in your tamper-evident evidence
                chain. Every subsequent event will be hash-linked to this root.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <Field
                label="Wallet Address (Optional)"
                value={wallet.address}
                onChange={(v) => setWallet({ ...wallet, address: v })}
                placeholder="0x..."
              />
              <div>
                <label className="text-xs text-ink-400">Payment Methods</label>
                <div className="space-y-2 mt-1">
                  {["stripe", "paypal", "crypto", "wire"].map(method => (
                    <label key={method} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={wallet.payment_methods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWallet(prev => ({
                              ...prev,
                              payment_methods: [...prev.payment_methods, method]
                            }));
                          } else {
                            setWallet(prev => ({
                              ...prev,
                              payment_methods: prev.payment_methods.filter(m => m !== method)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-ink-300 text-sm capitalize">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-sm text-ink-400">
                Payment binding is optional. You can configure this later from Settings.
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-brand-500/10 border border-brand-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-brand-500" />
                  <span className="font-semibold">Ready to Complete</span>
                </div>
                <p className="text-sm text-ink-400">
                  We&apos;ll run a harmless proof to verify the PGL chain is intact,
                  then unlock your Today dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || loading}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                loading ||
                (step === 0 && (!operator.name || !operator.email)) ||
                (step === 1 && !workspace.name) ||
                (step === 2 && !agent.name)
              }
            >
              {loading ? (
                "Processing..."
              ) : step === STEPS.length - 1 ? (
                <>
                  Complete Onboarding <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continue <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Skip Notice */}
        {mode !== "live" && (
          <div className="mt-4 text-center">
            <Link
              href="/dashboard"
              className="text-xs text-ink-500 hover:text-ink-300"
            >
              Skip onboarding and use demo profile →
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}

function ModeIndicator({ mode }: { mode: string }) {
  const configs: Record<
    string,
    { label: string; color: string; description: string }
  > = {
    live: {
      label: "Live PGL",
      color: "bg-emerald-500",
      description: "Connected to production PGL registry",
    },
    replay: {
      label: "Replay Mode",
      color: "bg-amber-500",
      description: "Demo mode with cached responses",
    },
    "local-dev": {
      label: "Local Development",
      color: "bg-blue-500",
      description: "Local-only simulation",
    },
  };

  const config = configs[mode] || configs["local-dev"];

  return (
    <div className="mb-6 p-3 rounded-lg bg-bg-700/50 border border-border">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
        <div>
          <div className="text-sm font-medium">{config.label}</div>
          <div className="text-xs text-ink-400">{config.description}</div>
        </div>
      </div>
    </div>
  );
}

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
      <label className="text-xs text-ink-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-bg-700 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-brand-500"
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
      <label className="text-xs text-ink-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-bg-700 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-brand-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
