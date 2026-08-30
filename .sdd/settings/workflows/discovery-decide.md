# Workflow: discovery-decide

1. Follow `_common.md`, `product-discovery.md`, and `store-design-readiness.md`. Read every existing discovery artifact, `store-design-score.json`, and relevant source record.
2. This workflow may be invoked early to stop or pivot after decisive contrary evidence. A `go` requires completed market validation and business case plus a ready product outline.
3. Audit internal consistency across the artifacts that exist: selected user/problem, market evidence, business assumptions, MVP scope, costs, thresholds, platform-specific store scores, and developer constraints must refer to the same hypothesis.
4. Present a concise evidence-backed recommendation: `go`, `pivot`, or `stop`. Show decisive evidence, Apple/Google/cross-platform scores, hard flags, unresolved uncertainty, budget/time exposure, and the cheapest next learning step.
5. Ask the user for the decision. The agent does not approve its own recommendation.
6. Append the dated decision and rationale to `decision.md`.
7. Recommend NO-GO while `overall.hard_stop=true`, a target platform lacks a current score, critical assumptions remain unsupported, or the concept has unresolved severe usability failures. The user may explicitly override with `sdd.mjs override discovery <name> decision go <actor> --reason <reason>`; record the accepted risks and keep missing evidence visible. Otherwise set decision to `go` and phase to `complete`. Promotion remains `eligible` until the user explicitly asks to create an SDD spec.
8. On `pivot`, set decision to `pivot`, increment `iteration`, preserve prior artifacts/decision history, reset only invalidated downstream states, and return to the earliest affected phase.
9. On `stop`, set decision to `stop` and phase to `complete`; retain the evidence to prevent repeated investment in the same disproven assumptions.
10. Update metadata and run SDD lint.
11. On promotion, create `promotion-brief.md` mapping outcomes, flows, assumptions, evidence IDs, thresholds, non-goals, and open decisions to requirement candidates. It is context, never approved requirements.
