---
name: ship-spine-review
description: Review Veklom UI changes against the governed asset spine and proof-first operator flow.
---

# Ship Spine Review

Use this skill when editing or reviewing `/ship`, navigation, marketplace, deployments, runtime, audit, or related control-plane surfaces.

## Review Rules

- The canonical spine is `Connected Source -> Repo Risk Gate -> Asset Wrapper -> Marketplace Asset -> Workspace Install -> Deployment -> Terminal Runtime -> Evidence Ledger`.
- The user should not have to leave the current operating surface to understand object identity, current status, recent events, or evidence.
- Every stage needs one primary action. Secondary links are allowed only when they support inspection or deeper control.
- Raw JSON belongs in advanced/detail areas, never as the primary UI.
- Status language must be honest: `Verified`, `Needs proof`, `Present`, `Not started`, `Manual step`, or `Simulated` only when true.
- Do not add first-level navigation unless it materially supports the operator journey.
- Keep the page premium and restrained: fewer badges, clear hierarchy, color reserved for status/risk/action.

## Output

Report blocking issues first, then recommended fixes. Include file paths and line references when possible.
