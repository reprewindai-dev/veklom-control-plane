"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { Card, PageHeader, Button } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  Database, 
  GitPullRequest, 
  ArrowRight, 
  Shield, 
  CheckCircle, 
  Server,
  Activity,
  Lock,
  Cpu,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";

const TEMPLATES = [
  {
    id: "support-copilot",
    name: "Support Copilot",
    description: "Handles L1/L2 customer support tickets using your internal knowledge base.",
    icon: Bot,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    tools: ["Zendesk Reader", "Intercom Reply", "Semantic Search"],
    trustScore: 98
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    description: "Generates SQL, queries read-only databases, and visualizes business metrics.",
    icon: Database,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    tools: ["PostgreSQL (Read-Only)", "Chart Generator", "Jupyter Env"],
    trustScore: 95
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    description: "Automated PR reviews focusing on security, performance, and best practices.",
    icon: GitPullRequest,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    tools: ["GitHub API", "SonarQube Integration", "AST Parser"],
    trustScore: 99
  }
];

export default function DeployWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Form State
  const [config, setConfig] = useState({
    name: "",
    description: "",
    systemPrompt: ""
  });

  const [deploying, setDeploying] = useState(false);

  const handleNext = () => setStep(s => Math.min(4, s + 1));
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      await api<any>('/api/v1/agents/deploy', {
        method: 'POST',
        body: {
          templateId: selectedTemplate,
          name: config.name,
          description: config.description,
          systemPrompt: config.systemPrompt
        }
      });
    } catch (err) {
      console.error('Deployment failed, proceeding to agents view anyway', err);
    }
    router.push("/agents");
  };

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <Shell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {["Template", "Configuration", "Governance", "Deploy"].map((label, i) => (
              <div 
                key={label}
                className={`text-sm font-medium ${step >= i + 1 ? 'text-brand-400' : 'text-gray-500'}`}
              >
                {i + 1}. {label}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-brand-500"
              initial={{ width: "25%" }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <PageHeader 
                title="Select Agent Template" 
                subtitle="Choose a Veklom-certified agent template to begin. All templates are pre-audited for security."
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TEMPLATES.map(template => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedTemplate === template.id 
                        ? 'border-brand-500 bg-gray-800/80' 
                        : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg ${template.bgColor} border ${template.borderColor} flex items-center justify-center mb-4`}>
                      <template.icon className={`w-6 h-6 ${template.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-400 mb-4 h-16">{template.description}</p>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Included Tools</div>
                      <div className="flex flex-wrap gap-2">
                        {template.tools.map(tool => (
                          <span key={tool} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-medium">
                      <Shield className="w-3 h-3" />
                      {template.trustScore}% Trust
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-8">
                <Button onClick={handleNext} disabled={!selectedTemplate} className="gap-2">
                  Configure Agent <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && currentTemplate && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <PageHeader 
                title="Configure Agent" 
                subtitle={`Customize your ${currentTemplate.name} for your specific needs.`}
              />
              <Card className="max-w-2xl">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Agent Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder={`e.g., Prod ${currentTemplate.name}`}
                      value={config.name}
                      onChange={e => setConfig({...config, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="Brief description of the agent's responsibilities"
                      value={config.description}
                      onChange={e => setConfig({...config, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Base System Prompt</label>
                    <textarea 
                      className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors font-mono text-sm"
                      placeholder="You are a helpful AI assistant..."
                      value={config.systemPrompt}
                      onChange={e => setConfig({...config, systemPrompt: e.target.value})}
                    />
                  </div>
                </div>
              </Card>
              <div className="flex justify-between max-w-2xl mt-8">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext} disabled={!config.name} className="gap-2">
                  Review Governance <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && currentTemplate && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <PageHeader 
                title="Governance & Security" 
                subtitle="Review the Proof of Governed Logic (PGL) constraints that will be enforced on this agent."
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-6">
                    <Shield className="text-brand-400" /> Active Guardrails
                  </h3>
                  <div className="space-y-4">
                    {[
                      { icon: Lock, title: "Sandboxed Execution", desc: "Agent tools run in isolated, ephemeral V8 isolates." },
                      { icon: Activity, title: "Audit Logging", desc: "100% of LLM generations and tool calls are logged." },
                      { icon: Shield, title: "PII Scrubbing", desc: "Outbound data is automatically redacted." },
                    ].map((rule, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                        <rule.icon className="w-5 h-5 text-gray-400 shrink-0" />
                        <div>
                          <div className="font-medium text-gray-200">{rule.title}</div>
                          <div className="text-sm text-gray-400 mt-1">{rule.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-6">
                    <CheckCircle className="text-green-400" /> PGL Certification
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-400">Template Hash</div>
                      <div className="font-mono text-sm text-gray-300">0x8f2...4c9e</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-gray-400">Trust Score</div>
                      <div className="text-green-400 font-medium">{currentTemplate.trustScore}%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-gray-400">Policy Group</div>
                      <div className="px-2 py-1 bg-brand-500/10 text-brand-400 rounded text-sm">Strict</div>
                    </div>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="text-sm text-yellow-200">
                        By proceeding, this agent's actions will be cryptographically attributed to your operator identity on the Veklom Ledger.
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext} className="gap-2">
                  Target Infrastructure <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && currentTemplate && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <PageHeader 
                title="Deploy to Production" 
                subtitle="Select your deployment target and provision the agent."
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border-2 border-brand-500 bg-gray-800/50 cursor-pointer relative">
                  <div className="absolute top-4 right-4 bg-brand-500 text-white text-xs px-2 py-1 rounded font-medium">
                    Recommended
                  </div>
                  <Server className="w-8 h-8 text-brand-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Veklom Cloud</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Fully managed, auto-scaling secure enclave. Zero setup required.
                  </p>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Instant deployment</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Global edge routing</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl border-2 border-gray-800 hover:border-gray-700 bg-gray-900/50 cursor-pointer">
                  <Cpu className="w-8 h-8 text-gray-500 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">BYOS (Self-Hosted)</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Deploy to your own AWS/GCP infrastructure using our Terraform modules.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Keep data in your VPC</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Custom network rules</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={handleBack} disabled={deploying}>Back</Button>
                <Button 
                  onClick={handleDeploy} 
                  disabled={deploying}
                  className="gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 px-8"
                >
                  {deploying ? (
                    <>Deploying... <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /></>
                  ) : (
                    <>Deploy Agent <Zap className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Shell>
  );
}
