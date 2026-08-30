# Workflow: release-readiness

1. Follow `_common.md`, `release-principles.md`, and `release-readiness.md`; load the target `release.json`, release context, source specs, steering, and live code/configuration.
2. Reconcile the checklist with the exact candidate build/commit and current console/public state. Run safe automated checks and inspect integrations across every target platform, backend, Firebase/analytics/attribution, commerce, legal/privacy, support, and rollout boundary that applies.
3. For each item record classification, owner, due date, evidence, and rationale. Append executed commands/manual checks to `evidence.jsonl`; record external work as a boundary, never as passed evidence.
4. Set readiness to `READY` only when all blockers have passed evidence. Otherwise set `blocked`, list the blocker and next owner/action, and do not approve launch.
5. Once ready, advance the phase to the earliest incomplete planning area (`go_to_market`, `assets`, or `measurement`), update metadata/history, and run SDD lint.
6. A user may explicitly override a readiness NO-GO with `sdd.mjs override release <name> readiness go <actor> --reason <reason>`. Preserve blockers and boundaries; the override does not create launch evidence or authorize publication.
