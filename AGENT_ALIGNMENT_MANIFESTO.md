# 🚨 VEKLOM AGENT ALIGNMENT MANIFESTO 🚨

> **CRITICAL INSTRUCTION FOR ALL AI AGENTS:**  
> Read this document in its entirety before taking ANY actions, modifying ANY files, or attempting to deploy ANY services. This is the **immutable source of truth** for the Veklom architecture.

---

## 1. The Canonical Source of Truth (Repositories)

Historically, this project suffered from extreme repository fragmentation (e.g., `veklom-byos-backend-old`, `-2`, etc.). **Those have been permanently deleted.** If you find any duplicate repositories, you are looking at stale data.

The ONLY valid repositories for this project are:
1. **Veklom Backend:** `C:\Users\antho\.windsurf\veklom-byos-backend`
   *This is the core FastAPI engine, MCP interface, and hosts the Next.js control plane via static mounts.*
2. **Cappo Backend:** `C:\Users\antho\.windsurf\cappo-backend`
   *This is the zero-trust governance authority (MCPAPI v2).*
3. **Veklom Control Plane:** `C:\Users\antho\.windsurf\veklom-control-plane`
   *This is the Next.js frontend code. It gets built and copied into the backend to be served.*

**RULE 1:** NEVER create duplicate repositories, `-old` copies, or backup folders. If you need to revert code, use Git.

---

## 2. Infrastructure & Deployment Architecture

### Server Environment
- **Provider:** Hetzner
- **Primary Server IP:** `5.78.135.11`
- **Orchestration:** Coolify

### Cloudflare Proxy Rules
Cloudflare sits in front of the infrastructure as a **DNS and SSL proxy ONLY**. 
- **RULE 2:** We do NOT use Cloudflare Pages. We do NOT use Cloudflare Workers. 
- All traffic routes directly through Cloudflare to the Hetzner Server via Coolify.
- SSL termination happens at Cloudflare (Full Mode) and Coolify handles internal routing.

### Coolify Services
The entire suite runs on Hetzner Server 1 (`5.78.135.11`) via Coolify:
1. **`veklom-byos-backend`** (Live on Port `8088`)
   - Domains: `veklom.com`, `api.veklom.com`
   - **Important:** The frontend IS the backend here. The Next.js control plane is pre-built and served directly by FastAPI. Do not attempt to spin up a separate frontend server on Coolify.
2. **`cappo-backend`** (Live on Port `8000`)
   - Domain: `cappo.veklom.com`
   - This database (`cappodb`) is completely isolated from the main Veklom backend database.

---

## 3. Authentication & Access Keys

To prevent credential leakage in this document, all SSH keys, API tokens, and Coolify access keys are stored in the local environment variables.

- **For Coolify/Hetzner Access:** Read the `.env` variables or reference `coolify_deployment_reference.md` located in the artifacts directory.
- **For Database Access:** Use the `DATABASE_URL` found in the root `.env` files of each respective repository.

---

## 4. Agent Operating Protocol

When the user asks you to implement a feature, fix a bug, or check a deployment:
1. **Verify Context:** Confirm you are in the correct canonical repository (`veklom-byos-backend`, `cappo-backend`, or `veklom-control-plane`).
2. **Check Cloudflare:** Remember that Cloudflare is a dumb proxy. If a UI update isn't showing, it is either a caching issue or the Coolify deployment failed. It is *not* a Cloudflare Pages issue.
3. **Frontend Edits:** If editing the `veklom-control-plane` UI, remember that the build artifact (`out/`) must be moved to `veklom-byos-backend/frontend/sovereign-control-node/` for FastAPI to actually serve it to the public internet.

**END OF MANIFESTO**
