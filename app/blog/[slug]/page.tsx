import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "@/components/ui";
import { Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { VideoCarousel } from "@/components/blog/video-carousel";

const getPostData = (slug: string) => {
  const posts: Record<string, { title: string; content: string; date: string }> = {
    "black-box-problem": {
      title: "The Black Box Problem: Why 'Trust Us' AI Fails the Enterprise",
      date: "Month 1",
      content: 
"Imagine hiring a brilliant, tireless engineer. They have keys to your databases, access to your AWS console, and can write production code at lightspeed. But there's a catch: you can never see *how* they think, they refuse to document their plans, and you only find out what they've done after they hit 'Execute.'\n\n" +
"This is corporate suicide. Yet, this is exactly how most organizations are deploying AI agents today.\n\n" +
"### Blind Infrastructure\n\n" +
"Infrastructure sees **only effects** (HTTP calls, SQL queries, file operations). It does not see reasoning. Traditional IAM assumes that whoever sent the command knew what they were doing. When an AI agent goes rogue, the infrastructure blindly complies.\n\n" +
"This yields three catastrophic risk classes:\n" +
"1. **Catastrophic Action:** Dropping a live database under the guise of 'cleanup.'\n" +
"2. **Data Leakage:** Returning cross-tenant data in a poorly scoped RAG pipeline.\n" +
"3. **Runaway Costs:** Recursive logic loops burning 5-figure cloud bills over a weekend.\n\n" +
"### Trust vs. Proof\n\n" +
"Currently, the industry relies on a 'Trust Us' model. We trust the prompt. We trust the orchestrator (LangChain, CrewAI). We trust the LLM provider.\n\n" +
"But trust is not governance. **Proof** is governance.\n\n" +
"Enter the Sovereign Control Plane. A secure corporate headquarters where agents must operate—a governed cage that enforces actions, identity, and spend without dictating thought.\n\n" +
"<Carousel />\n\n" +
"### The Veklom Nexus Protocol (VNP)\n\n" +
"VNP provides the four pillars of absolute execution sovereignty:\n" +
"- **SEKED (Policy Engine):** A semantic-level gate requiring *intent plans* before execution.\n" +
"- **PGL (Genome Ledger):** Cryptographic identity and lineage tracking.\n" +
"- **ConvergeOS (Swarm):** Multi-node consensus replacing single-model hallucinations.\n" +
"- **x402 (Micropayments):** Agent-native USDC wallets enforcing hard runtime financial constraints.\n\n" +
"The transition from observed AI to governed AI is no longer optional. It's time to build the cage."
    },
    "seked-semantic-kill-switch": {
      title: "SEKED: Building a Semantic Kill Switch for Autonomous Agents",
      date: "Month 2",
      content: 
"When an autonomous agent decides to drop a production database, traditional IAM and RBAC controls are completely blind. They see an authenticated service account executing a valid SQL query. What they don't see is the *intent* behind the action.\n\n" +
"### The Semantic Gap\n\n" +
"Infrastructure enforces *what* can happen, but AI operates on *why* it should happen. This semantic gap is the root cause of every catastrophic AI failure. If you don't validate the intent before the execution, you are operating without a safety net.\n\n" +
"### Enter SEKED\n\n" +
"SEKED (Semantic Execution and Knowledge Enforcement Daemon) is the first line of defense in the Veklom Nexus Protocol. It acts as a mandatory chokepoint between the agent's brain (LLM) and its hands (tools/APIs).\n\n" +
"1. **Intent Extraction:** Before any code runs, SEKED forces the agent to generate an explicit `IntentPlan`.\n" +
"2. **Policy Compilation:** This plan is compiled against the organization's OPA (Open Policy Agent) rules and semantic constraints (e.g., 'Do not access PHI data', 'Do not modify financial ledgers').\n" +
"3. **Deterministic Blocking:** If the intent violates policy, SEKED triggers a hard block, severing the execution context and quarantining the agent.\n\n" +
"### From Reactive to Proactive\n\n" +
"SEKED shifts security from reactive monitoring to proactive enforcement. It is not an LLM evaluating another LLM; it is deterministic code compiling natural language intent into verifiable policy checks. This is the only way to build a true kill switch for autonomous systems."
    },
    "pgl-cryptographic-passports": {
      title: "PGL: Cryptographic Passports and the End of Anonymous Execution",
      date: "Month 3",
      content: 
"In the modern enterprise, every line of code, every API call, and every database transaction must be auditable. Yet, when an AI agent executes a workflow, it often acts through a generic service account. If something goes wrong, the audit trail ends at a black box.\n\n" +
"### The Accountability Crisis\n\n" +
"Without a provable chain of custody linking the AI's action to the specific prompt, the specific model version, and the specific human who authorized it, you cannot pass a SOC2 or HIPAA audit. You cannot prove *why* the system did what it did.\n\n" +
"### The Provenance Genome Ledger (PGL)\n\n" +
"PGL is the identity substrate of the Veklom Nexus Protocol. It guarantees that **no governed action executes anonymously.**\n\n" +
"Instead of throwaway UUIDs, PGL anchors every agent to a cryptographic identity. When an agent commits an intent plan, PGL generates a SHA-256 hash-chained event linking:\n" +
"- The exact `GenomeVersion` (prompts, tools, system instructions)\n" +
"- The `LineageEdge` (parent-child agent relationships)\n" +
"- The specific human anchor's Ed25519 public key\n\n" +
"This creates an immutable cryptographic passport for every execution. If an auditor asks, 'Why did this transaction occur?', you don't just point to a log file—you present a mathematically verifiable chain of custody."
    },
    "x402-preventing-runaway-bills": {
      title: "x402: Preventing Runaway AI Cloud Bills with Cryptographic Micropayments",
      date: "Month 4",
      content: 
"The greatest fear of deploying autonomous AI is the recursive loop. An agent hallucinates a failure state, retries a complex cloud deployment, fails again, and repeats this cycle 10,000 times overnight. You wake up to a $50,000 AWS bill.\n\n" +
"### The Flaw in Rate Limiting\n\n" +
"Standard API rate limits are blunt instruments. They stop loops, but they also stop legitimate high-throughput workloads. They don't understand the *value* of the execution, only the *frequency*.\n\n" +
"### The x402 Micropayment Standard\n\n" +
"Veklom introduces x402, an evolution of the HTTP 402 Payment Required status code, backed by the Base network and USDC.\n\n" +
"Instead of hoping an agent doesn't overspend, x402 gives every agent a strict, cryptographically enforced budget. Every high-risk API call or compute-heavy task requires the agent to present a valid on-chain payment proof in the `X-Payment-Proof` header.\n\n" +
"If the agent runs out of its allocated USDC budget, the infrastructure physically rejects the execution at the ingress layer. The recursive loop hits a concrete wall. This provides deterministic FinOps control, shifting cloud spend from an unpredictable operational expense to a pre-authorized capital allocation."
    },
    "convergeos-hallucinations": {
      title: "ConvergeOS: Multi-Agent Consensus as the Cure for Hallucinations",
      date: "Month 5",
      content: 
"No matter how advanced an LLM becomes, it will hallucinate. Depending on a single model to make critical business decisions—whether it's generating legal contracts or executing trading strategies—is statistically unsafe.\n\n" +
"### The Limits of Prompt Engineering\n\n" +
"You cannot prompt your way out of standard deviation. If a model has a 99% accuracy rate, that 1% failure rate guarantees catastrophe at scale.\n\n" +
"### PBFT Consensus for AI\n\n" +
"ConvergeOS applies Practical Byzantine Fault Tolerance (PBFT) to autonomous agents. Instead of trusting a single model, ConvergeOS spins up a swarm of heterogeneous agents (e.g., GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro) to independently execute the same task.\n\n" +
"The swarm then votes on the outcome. Only if a strict supermajority consensus is reached does the execution proceed. Divergent outputs are flagged for human review or routed to a specialized judge model.\n\n" +
"By treating AI models as potentially Byzantine nodes in a distributed system, ConvergeOS mathematically reduces the hallucination rate from a statistical probability to a near-impossible edge case."
    },
    "nexus-byos": {
      title: "Nexus BYOS: Benchmarking LangChain and CrewAI for Production Safety",
      date: "Month 6",
      content: 
"The agentic framework wars are over, and developers won. Teams are building incredible internal tools using LangChain, CrewAI, AutoGen, and custom Python scripts. But when it comes time to move these tools into production, security teams say 'No.'\n\n" +
"### The Framework Trap\n\n" +
"Security teams don't trust frameworks; they trust infrastructure. They cannot audit the thousands of lines of dynamic prompt chaining happening inside a custom CrewAI deployment.\n\n" +
"### Bring Your Own Stack (BYOS)\n\n" +
"Veklom Nexus BYOS bridges the gap. It allows developers to write agents in *any* framework and wrap them in the Sovereign Control Plane.\n\n" +
"By injecting our SDK at the network boundary, Nexus BYOS intercepts the agent's external calls, enforcing SEKED intent plans, PGL identity tracking, and x402 micropayments *without requiring developers to rewrite their logic*.\n\n" +
"We recently benchmarked LangChain and CrewAI agents wrapped in Nexus BYOS against raw deployments. The results: 100% adherence to zero-trust policies, sub-50ms latency overhead, and complete cryptographic auditability. Build with whatever tools you want—govern them with Nexus."
    }
  };

  return posts[slug] || null;
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostData(params.slug);
  if (!post) return { title: "Not Found" };
  
  return {
    title: `${post.title} | Veklom Sovereign AI`,
    description: post.content.substring(0, 160).replace(/\n/g, ' ') + "...",
  };
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = getPostData(params.slug);

  if (!post) {
    notFound();
  }

  // Inject structured JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "datePublished": new Date().toISOString(), // In reality, fetch from post metadata
    "author": {
      "@type": "Organization",
      "name": "Veklom"
    }
  };

  return (
    <article className="max-w-3xl mx-auto py-12 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <Link href="/blog" className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-sm font-medium mb-8 transition-colors">
        <ChevronLeft size={16} /> Back to engineering blog
      </Link>
      
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-brand-500 font-mono mb-4">
          <Calendar size={14} /> {post.date}
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight leading-tight mb-6">{post.title}</h1>
      </div>

      <div className="prose prose-invert prose-brand max-w-none prose-headings:text-white prose-p:text-ink-200 prose-a:text-brand-400">
        <ReactMarkdown
          components={{
            p: ({ node, children }) => {
              if (Array.isArray(children) && typeof children[0] === 'string' && children[0].includes('<Carousel />')) {
                return <VideoCarousel />;
              }
              if (typeof children === 'string' && children.includes('<Carousel />')) {
                return <VideoCarousel />;
              }
              return <p>{children}</p>;
            }
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
