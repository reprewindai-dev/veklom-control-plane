---
name: production-control-plane-change
description: Apply Veklom production standards for secure, monetizable, governed control-plane changes.
---

# Production Control Plane Change

Use this skill before implementing or reviewing any meaningful Veklom control-plane change.

## Required Checks

- Revenue path: preserve billing, subscriptions, marketplace install, vendor payout, or upgrade behavior when touched.
- Access control: confirm tier gates, auth redirects, superuser behavior, and locked module behavior still work.
- Security: no secret exposure, no unsafe token logging, no untrusted HTML injection, no weakened API auth handling.
- Evidence: actions that affect source, review, package, install, deploy, runtime, or compliance must surface audit/proof state.
- Live API: do not introduce mocked or fake endpoints into production code.
- Failure states: show degraded or missing proof honestly instead of hiding backend failures.
- Maintainability: keep changes modular, typed, and aligned with existing components.

## Required Commands

```bash
npm run typecheck
npm run lint
npm run build
```

## Output

State whether the change is production-ready. If not, list blockers in priority order.
