# Workflow: spec-design

1. Follow `_common.md`; require approved requirements unless the user explicitly authorizes approval.
2. Keep the product-discovery profile `single-mobile-indie`. Separately classify **technical discovery depth** as minimal, light, or full using risk, novelty, external dependencies, security/privacy, and cross-platform impact; this is not a second product-discovery profile.
3. When `gap-analysis.md` exists, load it, record its SHA-256/baseline in `research.md`, and map reusable capabilities, gaps, and constraints into the design. Treat it as stale when the inspected code baseline materially changes.
4. Consult current primary sources for external APIs, Firebase behavior, mobile platform rules, privacy/analytics behavior, or version-sensitive dependencies.
5. Update `research.md` with sources, findings, alternatives, decisions, risks, unresolved questions, and the consumed gap-analysis hash when applicable.
6. Generate `design.md` as a self-contained implementation contract with boundaries, flows, interfaces, data, migration, verification, observability, and requirement traceability. Include only risk-applicable modules; use concise `not_applicable` rationale instead of ceremonial sections.
7. Keep examples aligned with the project stack without making framework rules language-specific.
8. Set design to `review_required`, invalidate downstream tasks if an approved design changed materially, and stop for review. When invoked by `auto-sdd`, return control to its canonical validate-design/correction loop instead.
   Use `sdd.mjs revise <feature> design <actor> --reason <reason>` before changing approved bytes.
