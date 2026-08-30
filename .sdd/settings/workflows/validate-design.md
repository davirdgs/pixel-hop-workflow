# Workflow: validate-design

1. Follow `_common.md`; freshly read requirements, design, research conclusions, and relevant live integration points.
2. Review traceability, architecture alignment, contracts, privacy/security, data ownership, rollout, observability, verification, and cross-platform boundaries.
3. Lead with at most three blocking issues for the GO/NO-GO decision; list additional non-blocking observations separately when useful.
4. Cite requirement IDs and exact design sections for every blocking issue.
5. Standalone validation does not approve automatically. On explicit user approval, store approver, timestamp, and content hash. The only exception is a user-initiated `auto-sdd` run, whose canonical rule delegates pre-implementation approval after GO against the final bytes.
6. In `auto-sdd`, the coordinator persists verdict, reviewer, attempt, timestamp, and design hash in `auto-sdd.json.reviews.design`; any later design edit makes that verdict stale.
7. Outside delegated auto-SDD, record an explicit human decision with `sdd.mjs override spec <feature> design <go|no-go> <actor> --reason <reason>`. A GO override accepts documented design risk but does not waive implementation or validation evidence.
