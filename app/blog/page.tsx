import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Sovereign AI Blog | Veklom",
  description: "Enterprise insights on Agentic Governance, SEKED Policy Engines, PGL Identity, and AI Micropayments.",
};

const blogs = [
  { slug: "black-box-problem", title: "The Black Box Problem: Why 'Trust Us' AI Fails the Enterprise", date: "Month 1", excerpt: "Omniscient, tireless engineers with a blank check. Why traditional infra is blind to agent reasoning, and how to fix it." },
  { slug: "seked-semantic-kill-switch", title: "SEKED: Building a Semantic Kill Switch for Autonomous Agents", date: "Month 2", excerpt: "Moving from observed AI to governed AI. How the semantic gateway blocks unauthorized actions before the sandbox." },
  { slug: "pgl-cryptographic-passports", title: "PGL: Cryptographic Passports and the End of Anonymous Execution", date: "Month 3", excerpt: "You cannot govern what you cannot identify. Bringing SOC2 and HIPAA auditability to agentic workflows." },
  { slug: "x402-preventing-runaway-bills", title: "x402: Preventing Runaway AI Cloud Bills with Cryptographic Micropayments", date: "Month 4", excerpt: "Turning cost governance from a monthly spreadsheet into a hard runtime constraint." },
  { slug: "convergeos-hallucinations", title: "ConvergeOS: Multi-Agent Consensus as the Cure for Hallucinations", date: "Month 5", excerpt: "Why 'the model said so' isn't enough, and how PBFT-style swarm consensus ensures processing integrity." },
  { slug: "nexus-byos", title: "Nexus BYOS: Benchmarking LangChain and CrewAI for Production Safety", date: "Month 6", excerpt: "Answering the ultimate enterprise question: 'Is this custom AI stack actually safe to use?'" },
];

export default function BlogIndex() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gradient mb-4">Sovereign AI Engineering</h1>
        <p className="text-lg text-ink-300">Technical essays, governance guides, and architectural blueprints for deploying safe, auditable, and financially constrained autonomous agents.</p>
      </div>
      
      <div className="space-y-6">
        {blogs.map(blog => (
          <Link key={blog.slug} href={`/blog/${blog.slug}`} className="block group">
            <Card className="border-border hover:border-brand-500/50 transition-colors p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-brand-400 font-mono mb-1">
                <Calendar size={14} /> {blog.date}
              </div>
              <h2 className="text-2xl font-semibold text-white group-hover:text-brand-300 transition-colors">{blog.title}</h2>
              <p className="text-ink-300 leading-relaxed">{blog.excerpt}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-brand-500">
                Read Article <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
