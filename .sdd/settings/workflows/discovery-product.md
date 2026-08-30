# Workflow: discovery-product

1. Follow `_common.md`, `product-discovery.md`, `discovery-product-outline.md`, and `store-design-readiness.md`.
2. Require completed market validation and business case. Carry their constraints and conditions forward; do not redesign around unsupported assumptions.
3. Create `product-outline.md` with the primary job, value proposition, core loop, high-level flows, release slices, non-goals, operating obligations, trust boundaries, measurements, kill thresholds, and cost/effort hotspots.
4. Keep the MVP feasible for the recorded delivery capacity. Prefer one platform and a manual-free core unless evidence in the discovery justifies more.
5. Validate the riskiest problem, concept, or usability assumption proportionally inside the `single-mobile-indie` profile. Record participants/cohort anonymously, method, task success or comprehension, severe failures, limitations, and resulting changes. When primary evidence is unavailable, retain `desk_only` and make the unresolved assumption explicit.
6. Recalculate `store-design-score.json` against the defined product flows and scope. For Apple targets, refresh the detailed spam assessment: the strongest difference must be located in the actual core/first-value flow, its proof level must be honest, and the reviewer dossier must identify an exact accessible demo path. Mark the outline `ready` only when all required sections are concrete, every target platform is scored, the policy assessment is current, and no hard constraint or Store Design Readiness hard flag is unresolved; otherwise mark `rework_required` and keep phase at `product_outline`.
7. When ready, advance phase to `decision`, update metadata, run SDD lint, and report `/sdd:discovery-decide <discovery>`.
8. A user may pass a `rework_required` gate manually with `sdd.mjs override discovery <name> product_outline go <actor> --reason <reason>`. Record the unresolved usability and store risks; do not convert them into evidence.
