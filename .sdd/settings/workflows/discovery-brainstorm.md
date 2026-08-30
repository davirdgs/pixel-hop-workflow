# Workflow: discovery-brainstorm

1. Follow `_common.md`, `product-discovery.md`, `discovery-brainstorm.md`, `research-sources.md`, and `store-design-readiness.md`.
2. Accept an optional problem space. Derive a unique kebab-case discovery name, but do not create artifacts until enough constraint context exists to avoid a misleading shell.
3. Run the brainstorm interactively, one focused question at a time. Inspect existing product steering or reusable capabilities only when supplied or relevant.
4. Create `.sdd/discoveries/<discovery>/` from the discovery templates once the constraints are confirmed.
5. Record problem framing before solution ranking: observed behavior/journey, job/outcome, frequency/severity, workaround, and switching forces. Then record candidates, hard constraints, feasibility, unresolved assumptions, and only a `green|yellow|red|unknown` preliminary Store Design Readiness triage in `brainstorm.md`; do not create a detailed numeric score before evidence and target platforms are defined. For Apple targets, keep 4.3(a) provenance/duplication separate from 4.3(b) market substitutability. Record the confirmed operating envelope and target platforms in `constraints.md`.
6. When preliminary web research is used, append sources with `sdd.mjs source discovery` using the shared source contract and mark those findings as preliminary in `note`.
7. Ask the user to select one hypothesis explicitly. On selection, set `lifecycle.brainstorm` to `selected`, phase to `market_validation`, and update timestamps. Without selection, leave it `in_progress` and report the next question.
8. Run SDD lint and report `/sdd:discovery-validate <discovery>` as the next phase after selection.
