# Workflow: validate-requirements

1. Follow `_common.md`; freshly read the user input or recorded scope, steering, and complete `requirements.md`.
2. Apply `ears-format.md` and `requirements-review.md`.
3. Report GO/NO-GO with blocking findings first. Cite exact requirement IDs and sections; do not silently edit during the review pass.
4. Run SDD lint to detect duplicate/invalid identifiers and lifecycle drift.
5. This workflow does not approve requirements. In `auto-sdd`, the coordinator persists verdict, reviewer, attempt, timestamp, and requirements hash in `auto-sdd.json.reviews.requirements`, then returns findings to the correction loop and validates again after edits.
6. Outside delegated auto-SDD, record an explicit human decision with `sdd.mjs override spec <feature> requirements <go|no-go> <actor> --reason <reason>`. Preserve findings and the exact hash in `gate_history`.
