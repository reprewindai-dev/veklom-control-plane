"use client";

import { CheckCircle2, Shield, Activity, Lock, Database } from "lucide-react";

export default function WhitepaperContent() {
  return (
    <div className="max-w-4xl py-12 px-6 lg:px-12">
      <div className="mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3EE7A2]/10 border border-[#3EE7A2]/20 text-[#3EE7A2] text-xs font-mono font-bold uppercase tracking-widest mb-6">
          <Shield className="w-4 h-4" />
          Veklom Developer Platform
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
          Sovereign AI Accountability
        </h1>
        <p className="text-xl text-[#A1A1A6] leading-relaxed">
          A Governance Framework for the Veklom Infrastructure.
        </p>
      </div>

      {/* Chapter 1 */}
      <section id="strategic-imperative" className="mb-20 scroll-mt-24">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#242424] pb-4">
          1. The Strategic Imperative: "Trust Us" to "Show Us" AI
        </h2>
        <div className="prose prose-invert max-w-none text-[#A1A1A6]">
          <p className="text-lg leading-relaxed mb-6">
            The transition from experimental AI implementations to governed production environments marks a critical shift in enterprise technology. In the initial wave of AI adoption, organizations relied on "trust-based" models, where the internal logic of an agent was largely opaque.
          </p>
          <div className="bg-[#111] border border-[#3EE7A2]/30 p-6 rounded-xl my-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-24 h-24 text-[#3EE7A2]" />
            </div>
            <h4 className="text-[#3EE7A2] font-semibold mb-2 flex items-center gap-2 relative z-10">
              <Lock className="w-5 h-5" />
              Core Value Proposition
            </h4>
            <p className="text-white text-lg relative z-10">
              Sovereignty is the ability to maintain absolute control and oversight over AI execution; Veklom turns that from a policy aspiration into a technical property of the stack.
            </p>
          </div>
          <h3 className="text-xl font-bold text-white mt-10 mb-4">Systemic Vulnerabilities in Ungoverned AI</h3>
          <div className="grid gap-4 my-6">
            {[
              { title: "Absence of Audit Trails", desc: "No replayable record of the decision-making process. The 'why' remains unknown, creating an unrecoverable gap in forensics." },
              { title: "Unconstrained Access", desc: "Agents inherit broad sweeping permissions with no dedicated policy layer to enforce conditions, leading to unauthorized exfiltration." },
              { title: "Runaway Costs", desc: "Without spend controls at the execution layer, a single agent loop can burn thousands in API calls." }
            ].map((v, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-lg border border-[#242424] bg-[#0A0A0A]">
                <div className="mt-1 w-6 h-6 rounded-full bg-[#FF5C6C]/10 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#FF5C6C]" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">{v.title}</h4>
                  <p className="text-sm">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter 2 */}
      <section id="pgl-identity" className="mb-20 scroll-mt-24">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#242424] pb-4">
          2. PGL: Establishing Immutable Agent Identity
        </h2>
        <div className="prose prose-invert max-w-none text-[#A1A1A6]">
          <p className="mb-6">
            In any governance framework, identity is the cornerstone of accountability. Treating an AI agent as a transient or ephemeral process leads to a lack of responsibility.
          </p>
          <div className="p-4 bg-white/[0.02] border border-white/10 rounded-lg text-white font-mono text-sm my-6 border-l-4 border-l-[#37C9EC]">
            You cannot govern what you cannot identify; PGL turns agents from ephemeral processes into governed identities with accountable histories.
          </div>
          
          <h3 className="text-xl font-bold text-white mt-10 mb-6">Comparative Accountability Model</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[#333] text-white">
                  <th className="p-4 font-semibold">Feature</th>
                  <th className="p-4 font-semibold text-[#FF5C6C]">Standard Agent Access</th>
                  <th className="p-4 font-semibold text-[#3EE7A2]">PGL-Governed Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {[
                  ["Identification", "Anonymous or ephemeral process", "Attributed, certified identity"],
                  ["Visibility", "Unmonitored tool calls", "Lineage-tracked execution"],
                  ["Forensics", "Impossible to reconstruct", "Comprehensive 'Who did what' records"],
                  ["Persistence", "Reset after every session", "Stable across workspaces & dev/stage/prod"],
                  ["Compliance", "Non-compliant", "Designed to support SOC2, HIPAA, ISO27001"]
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono text-white/70">{row[0]}</td>
                    <td className="p-4 text-white/50">{row[1]}</td>
                    <td className="p-4 text-white/90 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#3EE7A2]" /> {row[2]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Chapter 3 */}
      <section id="seked-policy" className="mb-20 scroll-mt-24">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#242424] pb-4">
          3. SEKED: The Policy Authority
        </h2>
        <div className="prose prose-invert max-w-none text-[#A1A1A6]">
          <p className="mb-6">
            Autonomous systems require a "Rule of Law" decoupled from the applications themselves. Veklom’s SEKED engine moves policy authority to the execution layer.
          </p>
          <div className="p-5 bg-gradient-to-r from-[#111] to-transparent border border-white/10 rounded-lg my-6">
            <strong className="text-white block mb-2">The SEKED Gatekeeper:</strong>
            SEKED is to agents what an API gateway + WAF + OPA are to microservices: a mandatory chokepoint where policy is enforced and measured, not just described.
          </div>
          <h3 className="text-xl font-bold text-white mt-10 mb-4">The Governed Logic Flow</h3>
          <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-6 font-mono text-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-[#FFB800] via-[#3EE7A2] to-[#37C9EC]" />
            <ol className="space-y-4 list-decimal list-inside text-white/80">
              <li><strong className="text-[#FFB800]">Plan Generation:</strong> Agent formulates structured intent.</li>
              <li><strong className="text-[#3EE7A2]">SEKED Validation:</strong> Plan submitted for decision measurement.</li>
              <li><strong className="text-[#3EE7A2]">Policy Enforcement:</strong> Scanned against constraints (PHI/PII/Environment).</li>
              <li><strong className="text-[#37C9EC]">Final Resolution:</strong> Proceed to sandbox, or engage Kill Switch.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Chapters 4, 5, 6, 7 */}
      <section id="replayable-evidence" className="mb-20 scroll-mt-24">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#242424] pb-4">
          4. Replayable Evidence
        </h2>
        <div className="prose prose-invert max-w-none text-[#A1A1A6]">
          <p>
            Veklom turns every significant agent action into a signed, hashed, immutable packet that can be replayed and presented as audit evidence; it’s designed for "Show us" audits.
          </p>
          <ul className="mt-4 space-y-2">
            <li><strong>Sha256-Hashed (Integrity):</strong> Detecting tampering.</li>
            <li><strong>Immutable (Append-Only):</strong> Permanent history.</li>
            <li><strong>Signed (Attribution):</strong> Cryptographic proof of PGL identity.</li>
          </ul>
        </div>
      </section>

      <section id="operational-economic" className="mb-20 scroll-mt-24">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#242424] pb-4">
          5. ConvergeOS & x402
        </h2>
        <div className="prose prose-invert max-w-none text-[#A1A1A6]">
          <h3 className="text-xl font-bold text-white mt-6 mb-2">ConvergeOS (Operational Guardrails)</h3>
          <p>Rejects or quarantines malformed outputs before they hit production by enforcing Schema and Quality convergence.</p>
          
          <h3 className="text-xl font-bold text-white mt-8 mb-2">x402 (Economic Guardrails)</h3>
          <p>x402 turns cost governance into a runtime constraint. Agents pay for execution routes using USDC on Base. Runaway spend is eliminated by atomic micropayments.</p>
        </div>
      </section>

      <section id="nexus-protocol" className="mb-20 scroll-mt-24">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#242424] pb-4">
          6. The Veklom Nexus Protocol
        </h2>
        <div className="prose prose-invert max-w-none text-[#A1A1A6]">
          <p>Nexus is how Veklom determines whether a given model, stack, or agent framework is production-worthy under governance.</p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 border border-[#242424] rounded-lg bg-[#111]">
              <Activity className="w-5 h-5 text-[#37C9EC] mb-2" />
              <div className="text-white font-bold text-sm">Policy Adherence</div>
            </div>
            <div className="p-4 border border-[#242424] rounded-lg bg-[#111]">
              <Database className="w-5 h-5 text-[#37C9EC] mb-2" />
              <div className="text-white font-bold text-sm">Evidence Integrity</div>
            </div>
          </div>
        </div>
      </section>

      <section id="sovereign-ai" className="mb-32 scroll-mt-24">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#242424] pb-4">
          7. Sovereign AI Blueprint
        </h2>
        <div className="prose prose-invert max-w-none text-[#A1A1A6]">
          <p>
            Veklom doesn’t compete with agent frameworks; it governs them. LangChain, CrewAI, and homegrown orchestrators become "BYOS" systems plugged into the Veklom governance fabric.
          </p>
          <p className="mt-4 font-semibold text-white">
            That is exactly what Sovereign AI means in practice: ownership and control over AI execution, not just over data or infrastructure.
          </p>
        </div>
      </section>
    </div>
  );
}
