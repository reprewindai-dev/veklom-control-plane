---
name: api-contract-trace
description: Verify frontend route usage against Veklom live API contracts and proof-state claims.
---

# API Contract Trace

Use this skill when adding or changing API calls, route labels, status summaries, evidence displays, or proof-state logic.

## Trace Rules

- Treat backend routes as the source of truth.
- Keep `lib/api.ts` same-origin fallback intact unless a deployment decision explicitly changes it.
- Do not infer proof from route existence. Proof requires successful data, a count, a hash, a ledger entry, a verification result, or a meaningful backend status.
- If a route is wired but unavailable or returns an error, the UI must say `Needs proof` or equivalent honest language.
- Keep route names visible in advanced/evidence contexts for operator auditability.
- Do not rename core product objects casually: use `Connected Source`, `Repo Risk Gate`, `Asset Wrapper`, `Marketplace Asset`, `Workspace Install`, `Deployment`, `Terminal Runtime`, and `Evidence Ledger`.

## Output

List each changed route, expected data shape if known, current proof signal, and any overclaim risk.
