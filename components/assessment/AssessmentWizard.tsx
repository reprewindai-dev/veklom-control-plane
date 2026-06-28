"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Check, ArrowRight, ArrowLeft, RefreshCw, AlertTriangle,
  FileText, Cpu, CheckCircle2, Server, HelpCircle, AlertCircle, Info, ChevronRight, Play
} from "lucide-react";
import Link from "next/link";

// 12 Sidebar Diagnostic Questions & Hints
interface SidebarQuestion {
  id: number;
  question: string;
  hint: string;
}

const SIDEBAR_QUESTIONS: SidebarQuestion[] = [
  {
    id: 1,
    question: "Which AI touched production last?",
    hint: "No trace? Veklom PGL IdentityRAG maps every request to a cryptographically signed tenant ID.",
  },
  {
    id: 2,
    question: "Can you replay every AI action?",
    hint: "Black box? Veklom stores tamper-evident, step-by-step transaction replays in the x402 Ledger.",
  },
  {
    id: 3,
    question: "Who approved it?",
    hint: "Auto-pilot danger? Veklom enforces multi-sig and human-in-the-loop gates before tool execution.",
  },
  {
    id: 4,
    question: "Which policy allowed it?",
    hint: "Permissive default? Veklom's Zero-Trust Middleware checks requests against active JSON policy moats.",
  },
  {
    id: 5,
    question: "Which model executed it?",
    hint: "Model shadow IT? Veklom logs model routing, weights, and inference tokens across all provider gateways.",
  },
  {
    id: 6,
    question: "Which credentials were used?",
    hint: "Shared keys? Veklom wraps third-party API credentials in isolated workspace vaults, never exposing them to agents.",
  },
  {
    id: 7,
    question: "What data was accessed?",
    hint: "Data leakage? Veklom's Sanitizer & Schema Moat filters PII and prevents model extraction in real time.",
  },
  {
    id: 8,
    question: "What did it cost?",
    hint: "Runaway loops? Veklom's BudgetCheckMiddleware halts runaway recursive prompts instantly.",
  },
  {
    id: 9,
    question: "Could it have been blocked?",
    hint: "Read-only logs? Veklom sits in-line with tool access, providing real-time preventative blocking.",
  },
  {
    id: 10,
    question: "Can you prove compliance?",
    hint: "Vague telemetry? Veklom produces automated, auditor-ready compliance bundles matching SOC2, HIPAA, and GDPR.",
  },
  {
    id: 11,
    question: "Can you revoke the agent instantly?",
    hint: "No off button? Veklom includes a global, single-click emergency kill-switch for all active workspaces.",
  },
  {
    id: 12,
    question: "Would your auditor accept your evidence?",
    hint: "Unsigned logs? Veklom anchors every execution trace with SHA-256 evidence hashes and x402 Settlement Ledger seals.",
  },
];

// Wizard Step Definition
interface WizardStep {
  id: number;
  title: string;
  description: string;
  type: "single" | "multi";
  options: string[];
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: "Is Veklom built for you?",
    description: "What are you trying to protect?",
    type: "multi",
    options: [
      "Production systems",
      "Source code repositories",
      "Customer data",
      "Internal APIs",
      "AI agents",
      "Compliance",
      "Costs"
    ]
  },
  {
    id: 2,
    title: "What kind of company are you?",
    description: "A banking setup has different security boundaries than an early-stage startup.",
    type: "single",
    options: [
      "Healthcare",
      "Banking",
      "Insurance",
      "Government",
      "Defence",
      "Manufacturing",
      "SaaS",
      "Enterprise IT",
      "AI Startup",
      "Other"
    ]
  },
  {
    id: 3,
    title: "Where do your AI agents currently run?",
    description: "Select all hosting architectures and inference backends that apply.",
    type: "multi",
    options: [
      "OpenAI",
      "Anthropic",
      "Google Gemini",
      "Ollama",
      "Local LLMs",
      "Azure OpenAI",
      "AWS Bedrock",
      "Multiple providers"
    ]
  },
  {
    id: 4,
    title: "What can your AI access today?",
    description: "These connections represent potential lateral movement vectors for compromised agents.",
    type: "multi",
    options: [
      "GitHub",
      "GitLab",
      "Kubernetes",
      "AWS",
      "Azure",
      "GCP",
      "Databases",
      "CRM",
      "Slack",
      "Email",
      "Production APIs",
      "Customer records"
    ]
  },
  {
    id: 5,
    title: "What is your biggest concern?",
    description: "Choose the primary failure mode you need Veklom to neutralize.",
    type: "single",
    options: [
      "AI making unauthorized changes",
      "Compliance",
      "Cost overruns",
      "Shadow AI",
      "Data leakage",
      "No audit trail",
      "No approval workflow",
      "Model governance",
      "Security",
      "Reliability"
    ]
  },
  {
    id: 6,
    title: "How much control do your agents have?",
    description: "Understanding write capability and autonomous power is crucial for policy configuration.",
    type: "single",
    options: [
      "Read only",
      "Read & Write",
      "Deploy code",
      "Execute infrastructure",
      "Make purchases",
      "Unknown"
    ]
  },
  {
    id: 7,
    title: "What regulations matter?",
    description: "Veklom maps telemetry and audit evidence to compliance frameworks automatically.",
    type: "multi",
    options: [
      "HIPAA",
      "SOC2",
      "ISO 27001",
      "PCI DSS",
      "GDPR",
      "FedRAMP",
      "Internal policy only",
      "None yet"
    ]
  },
  {
    id: 8,
    title: "What happens if an agent makes a mistake?",
    description: "How is your current mitigation or recovery workflow handled?",
    type: "single",
    options: [
      "Human approval",
      "Nothing",
      "Rollback",
      "Manual investigation",
      "We don't know"
    ]
  },
  {
    id: 9,
    title: "How do you prove what the AI actually did?",
    description: "This naturally leads to the requirement of signed audit evidence.",
    type: "single",
    options: [
      "Logs",
      "Screenshots",
      "We trust the model",
      "Audit trail",
      "We can't prove it"
    ]
  },
  {
    id: 10,
    title: "What would stopping one incident be worth?",
    description: "Pricing feels relative when compared against the cost of an active security or execution breach.",
    type: "single",
    options: [
      "$10K",
      "$100K",
      "$500K",
      "$1M+"
    ]
  }
];

export default function AssessmentWizard() {
  // Navigation & Answers State
  const [currentStep, setCurrentStep] = useState(0); // 0 = Intro, 1..10 = Wizard steps, 11 = Report
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [sidebarAnswers, setSidebarAnswers] = useState<Record<number, "yes" | "no" | null>>({});

  // Compilation / Loading State
  const [compiling, setCompiling] = useState(false);
  const [compileIndex, setCompileStep] = useState(0);

  // Compile step strings
  const compileMessages = [
    "Analyzing system policy gaps (SEKED)...",
    "Assessing credential exposure paths...",
    "Validating compliance alignment (SOC2/HIPAA)...",
    "Mapping infrastructure access topology..."
  ];

  // Increment compile text over 4 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (compiling) {
      interval = setInterval(() => {
        setCompileStep((prev) => {
          if (prev >= compileMessages.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              setCompiling(false);
              setCurrentStep(11); // Move to report
            }, 1000);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [compiling]);

  // Set default Sidebar answers to 'unset' (null) on start
  useEffect(() => {
    const initAnswers: Record<number, "yes" | "no" | null> = {};
    SIDEBAR_QUESTIONS.forEach((q) => {
      initAnswers[q.id] = null;
    });
    setSidebarAnswers(initAnswers);
  }, []);

  // Handler for option click
  const handleOptionClick = (stepId: number, option: string, type: "single" | "multi") => {
    const current = selections[stepId] || [];
    if (type === "single") {
      setSelections({ ...selections, [stepId]: [option] });
    } else {
      if (current.includes(option)) {
        setSelections({
          ...selections,
          [stepId]: current.filter((o) => o !== option),
        });
      } else {
        setSelections({
          ...selections,
          [stepId]: [...current, option],
        });
      }
    }
  };

  // Sidebar dynamic "no" answers counter
  const gapCount = Object.values(sidebarAnswers).filter((ans) => ans === "no").length;

  // Calculate Risk Profile
  const calculateReport = () => {
    let score = 0;

    // S1 items protect
    const protect = selections[1] || [];
    // S4 items access
    const access = selections[4] || [];
    // S6 control level
    const control = (selections[6] || [])[0] || "Unknown";
    // S8 mistake
    const mistake = (selections[8] || [])[0] || "We don't know";
    // S9 prove
    const prove = (selections[9] || [])[0] || "We can't prove it";
    // S5 biggest concern
    const concern = (selections[5] || [])[0] || "Security";
    // S3 providers
    const providers = selections[3] || ["OpenAI"];

    // Compute Risk Score
    const highRiskAccess = ["Kubernetes", "AWS", "Azure", "GCP", "Databases", "Production APIs", "Customer records"];
    access.forEach((acc) => {
      if (highRiskAccess.includes(acc)) score += 2;
    });

    if (["Read & Write", "Deploy code", "Execute infrastructure", "Make purchases"].includes(control)) {
      score += control === "Read & Write" ? 2 : 4;
    }
    if (["Nothing", "We don't know"].includes(mistake)) score += 3;
    if (["We trust the model", "We can't prove it"].includes(prove)) score += 4;
    if (["Logs", "Screenshots"].includes(prove)) score += 2;

    // Determine Risk Level
    let riskLabel = "🟢 LOW";
    let riskColor = "text-green-500 border-green-500/20 bg-green-500/5";
    let riskDot = "bg-green-500";
    if (score >= 11) {
      riskLabel = "🔴 CRITICAL HIGH";
      riskColor = "text-red-500 border-red-500/20 bg-red-500/5";
      riskDot = "bg-red-500";
    } else if (score >= 5) {
      riskLabel = "🟡 MODERATE MEDIUM";
      riskColor = "text-yellow-500 border-yellow-500/20 bg-yellow-500/5";
      riskDot = "bg-yellow-500";
    }

    // Dynamic Reasons
    const reasons: string[] = [];
    if (access.some((acc) => ["AWS", "GCP", "Azure", "Kubernetes"].includes(acc))) {
      reasons.push("Autonomous agents possess active cloud infrastructure / orchestration credentials.");
    } else if (access.some((acc) => ["Databases", "Production APIs", "Customer records"].includes(acc))) {
      reasons.push("AI has direct read/write access to production storage or sensitive user records.");
    }

    if (["Deploy code", "Execute infrastructure", "Make purchases"].includes(control)) {
      reasons.push("Agents are empowered to change application code, alter networks, or authorize charges.");
    } else if (control === "Read & Write") {
      reasons.push("Write permissions are configured globally, exposing endpoints to unchecked injection payloads.");
    } else if (control === "Unknown") {
      reasons.push("Sovereign privileges are unmapped, exposing the network to shadow agent execution.");
    }

    if (["Nothing", "We don't know"].includes(mistake)) {
      reasons.push("Zero automated safety gates or approval protocols exist to trap runaway recursive processes.");
    } else if (mistake === "Manual investigation") {
      reasons.push("Failing back entirely to manual debugging post-incident increases exposure windows.");
    }

    if (["We trust the model", "We can't prove it"].includes(prove)) {
      reasons.push("No replayable audit stream is captured, leaving security and compliance teams blind.");
    } else if (["Logs", "Screenshots"].includes(prove)) {
      reasons.push("Application logs are ephemeral, unsigned, and do not constitute cryptographically sealed evidence.");
    }

    if (protect.includes("Costs") || concern === "Cost overruns") {
      reasons.push("Financial burn boundaries are unenforced, risking runaway loop invoice surges.");
    }

    if (reasons.length === 0) {
      reasons.push("Default minimal security configuration verified. Standard zero-trust monitoring recommended.");
    }

    // Dynamic Veklom Solutions
    const provisions = ["Policy enforcement", "Agent identity"];
    if (["We trust the model", "We can't prove it", "Logs", "Screenshots"].includes(prove)) {
      provisions.push("Replayable evidence");
    }
    if (protect.includes("Costs") || concern === "Cost overruns") {
      provisions.push("Cost guardrails");
    }
    if (["Read & Write", "Deploy code", "Execute infrastructure", "Make purchases"].includes(control)) {
      provisions.push("Kill switches");
    }

    return {
      riskLabel,
      riskColor,
      riskDot,
      reasons,
      provisions,
      compat: `${providers.slice(0, 3).join(" + ")}${providers.length > 3 ? " + More" : ""} and ${access.slice(0, 3).join(" + ") || "GitHub"}`
    };
  };

  const report = calculateReport();

  return (
    <div id="qualifier-section" className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-6 py-12 relative z-10 scroll-mt-24">
      
      {/* LEFT COLUMN: The Qualification Wizard */}
      <div className="lg:col-span-8 flex flex-col justify-between border border-white/10 rounded-2xl bg-[#0F0F13]/60 backdrop-blur-xl p-8 min-h-[580px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[200px] bg-[#FFB800]/5 blur-[80px] rounded-full pointer-events-none -z-10" />

        {/* Wizard Step Navigation */}
        <AnimatePresence mode="wait">
          {/* INTRO SLIDE */}
          {currentStep === 0 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 my-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-sm font-medium">
                <Shield className="w-4 h-4" />
                Veklom Agent Qualification Engine
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
                Sits between your agents <br />
                and production systems.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                Before writing another line of LLM orchestration code, verify your risk footprint. 
                Answer these 10 rapid questions to generate a personalized AI Governance Report, complete with mitigation blueprints and architecture compatibility checklists.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 bg-[#FFB800] text-black px-6 py-3.5 rounded-lg font-bold hover:bg-[#FFE6A8] active:scale-[0.98] transition-all text-base shadow-lg shadow-[#FFB800]/20"
                >
                  Start Interactive Assessment <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            </motion.div>
          )}

          {/* QUESTION SLIDES (1..10) */}
          {currentStep >= 1 && currentStep <= 10 && (
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Progress Indicators */}
                <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-3">
                  <span>SECTION {currentStep} OF 10</span>
                  <span>{Math.round((currentStep / 10) * 100)}% COMPLETE</span>
                </div>
                <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden mb-8">
                  <motion.div
                    initial={{ width: `${((currentStep - 1) / 10) * 100}%` }}
                    animate={{ width: `${(currentStep / 10) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-[#FFE6A8] to-[#FFB800] shadow-[0_0_10px_#FFB800]"
                  />
                </div>

                {/* Question Details */}
                <h3 className="text-sm font-mono tracking-wider text-[#FFB800] uppercase mb-1">
                  {WIZARD_STEPS[currentStep - 1].title}
                </h3>
                <h4 className="text-2xl font-bold text-white mb-3">
                  {WIZARD_STEPS[currentStep - 1].description}
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  {WIZARD_STEPS[currentStep - 1].type === "multi" 
                    ? "Select all options that apply in your environment." 
                    : "Select the most accurate single option."}
                </p>

                {/* Choice Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {WIZARD_STEPS[currentStep - 1].options.map((opt) => {
                    const isSelected = (selections[currentStep] || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => handleOptionClick(currentStep, opt, WIZARD_STEPS[currentStep - 1].type)}
                        className={`group text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? "bg-[#FFB800]/10 border-[#FFB800] text-white shadow-md shadow-[#FFB800]/5"
                            : "bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <span className="text-sm font-medium">{opt}</span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isSelected
                              ? "bg-[#FFB800] border-[#FFB800] text-black"
                              : "border-gray-600 group-hover:border-gray-400"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wizard Footer Navigation */}
              <div className="flex items-center justify-between pt-8 mt-8 border-t border-white/5">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                  onClick={() => {
                    if (currentStep === 10) {
                      setCompiling(true);
                    } else {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={(selections[currentStep] || []).length === 0}
                  className="flex items-center gap-2 bg-white text-black disabled:bg-white/10 disabled:text-gray-500 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg font-bold hover:bg-gray-200 active:scale-[0.98] transition-all text-sm"
                >
                  {currentStep === 10 ? "Compile Report" : "Continue"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* COMPILING ANALYTICS SCREEN */}
          {compiling && (
            <motion.div
              key="compiling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 flex-1 flex flex-col items-center justify-center text-center my-auto"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border border-[#FFB800]/20 flex items-center justify-center animate-spin">
                  <div className="w-3 h-3 rounded-full bg-[#FFB800]" />
                </div>
                <RefreshCw className="w-6 h-6 text-[#FFB800] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin duration-1000" />
              </div>
              <h3 className="text-lg font-mono text-gray-400 uppercase tracking-widest animate-pulse">
                RISK COMPILED PATH ANALYSIS
              </h3>
              <div className="h-6 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={compileIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-[#FFE6A8] font-mono text-sm"
                  >
                    {compileMessages[compileIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* COMPILED REPORT SCREEN */}
          {currentStep === 11 && !compiling && (
            <motion.div
              key="report"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 flex-1 flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Report Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-xs font-mono tracking-wider text-[#FFB800] uppercase">
                      ANALYSIS COMPLETED
                    </h3>
                    <h4 className="text-2xl font-bold">Your AI Governance Report</h4>
                  </div>
                  <button
                    onClick={() => {
                      setSelections({});
                      setCurrentStep(0);
                    }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#FFB800] font-mono transition-colors border border-white/5 hover:border-[#FFB800]/30 rounded-md px-2.5 py-1 bg-white/[0.01]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retake Quiz
                  </button>
                </div>

                <p className="text-sm text-gray-400">
                  Based on your answers, our threat-vector engine has calculated your exposure footprint. 
                  Veklom would act as an active, inline proxy gate protecting your core environment.
                </p>

                {/* Risk Level Badge */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border flex flex-col justify-center ${report.riskColor}`}>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 block">Risk Level</span>
                    <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
                      <div className={`w-2.5 h-2.5 rounded-full ${report.riskDot}`} />
                      {report.riskLabel}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col justify-center md:col-span-2">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 block">Compatible Architecture</span>
                    <div className="text-sm font-semibold truncate text-white">
                      {report.compat}
                    </div>
                  </div>
                </div>

                {/* Reasons / Threats Detected */}
                <div className="space-y-3">
                  <h5 className="text-xs font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> VULNERABILITY ANALYSIS
                  </h5>
                  <ul className="space-y-2.5 pl-1">
                    {report.reasons.map((res, i) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2.5">
                        <span className="text-red-500 text-lg leading-none select-none">•</span>
                        <span>{res}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Veklom Provisions */}
                <div className="p-5 border border-[#FFB800]/10 rounded-xl bg-[#FFB800]/[0.01] space-y-4">
                  <h5 className="text-xs font-mono text-[#FFB800] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> VEKLOM MITIGATION BLUEPRINT
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {report.provisions.map((prov) => (
                      <span
                        key={prov}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-200 flex items-center gap-1.5 font-medium"
                      >
                        <Check className="w-3.5 h-3.5 text-green-500 stroke-[3px]" /> {prov}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-500 pt-1">
                    <div>
                      DEPLOYMENT ESTIMATE: <span className="text-[#FFB800] font-bold">3 DAYS</span>
                    </div>
                    <div>
                      LICENSING: <span className="text-[#FFB800] font-bold">SOVEREIGN / BYOK</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-white/5">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-6 py-3.5 rounded-lg font-bold hover:bg-gray-200 active:scale-[0.98] transition-all text-base shadow-lg shadow-white/5"
                >
                  Initialize Free Control Plane <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto text-center border border-white/10 text-white px-6 py-3.5 rounded-lg font-bold hover:bg-white/5 transition-all text-base"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT COLUMN: The Sticky 12-Question Diagnostic Sidebar */}
      <div className="lg:col-span-4 lg:self-start lg:sticky lg:top-24 space-y-6">
        <div className="border border-white/10 rounded-2xl bg-[#0F0F13]/90 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-[#FFB800]/5 blur-[60px] rounded-full pointer-events-none -z-10" />

          {/* Sidebar Header */}
          <div className="border-b border-white/5 pb-4 mb-4">
            <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Self-Diagnostic Panel</h3>
            <h4 className="text-lg font-bold text-white mb-2">Can you answer these 12 questions?</h4>
            
            {/* Active Gap Counter */}
            <div className={`mt-2 py-1.5 px-3 rounded-lg border text-xs font-mono transition-all flex items-center justify-between ${
              gapCount > 0 
                ? "border-red-500/20 bg-red-500/5 text-red-400" 
                : "border-white/5 bg-white/[0.01] text-gray-400"
            }`}>
              <span>CRITICAL SECURITY GAPS:</span>
              <span className={`font-bold ${gapCount > 0 ? "text-red-500 animate-pulse" : ""}`}>
                {gapCount} of 12 detected
              </span>
            </div>
          </div>

          {/* Questions Container (Scrollable or condensed) */}
          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-white/10">
            {SIDEBAR_QUESTIONS.map((q) => {
              const currentAnswer = sidebarAnswers[q.id];
              return (
                <div key={q.id} className="space-y-1.5 pb-3 border-b border-white/[0.03] last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-gray-300 font-medium leading-relaxed">
                      {q.id}. {q.question}
                    </span>
                    {/* Toggle Buttons */}
                    <div className="flex rounded-md border border-white/5 overflow-hidden bg-white/[0.01] shrink-0">
                      <button
                        onClick={() => setSidebarAnswers({ ...sidebarAnswers, [q.id]: "yes" })}
                        className={`text-[10px] font-bold font-mono px-2 py-1 transition-all ${
                          currentAnswer === "yes"
                            ? "bg-green-500 text-black font-extrabold"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        YES
                      </button>
                      <button
                        onClick={() => {
                          setSidebarAnswers({ ...sidebarAnswers, [q.id]: "no" });
                          // Automatically scroll or focus the Assessment Wizard if they start checking things
                        }}
                        className={`text-[10px] font-bold font-mono px-2 py-1 transition-all border-l border-white/5 ${
                          currentAnswer === "no"
                            ? "bg-red-500 text-white font-extrabold shadow-inner"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>

                  {/* Render Contextual Hint on "NO" selection */}
                  <AnimatePresence>
                    {currentAnswer === "no" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="text-[11px] leading-relaxed text-[#FFE6A8] bg-[#FFB800]/5 border-l-2 border-[#FFB800] px-2.5 py-1.5 rounded-r">
                          {q.hint}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer CTA */}
          <div className="pt-4 border-t border-white/5 mt-4">
            <button
              onClick={() => {
                const element = document.getElementById("qualifier-section");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-[#FFB800] text-black py-2.5 rounded-lg font-bold hover:bg-[#FFE6A8] transition-colors text-xs"
            >
              Remediate Risks with Veklom <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
