# Workflow: validate-tasks

1. Follow `_common.md`; freshly read approved requirements/design, `tasks.md`, `coverage.json`, and the relevant boundary map.
2. Apply `tasks-generation.md`, `tasks-parallel-analysis.md`, and `tasks-review.md`.
3. Audit numeric requirement coverage, dispositions, dependency order, write-scope overlap, `(P)` safety, verification strategies, evidence expectations, integration work, and external boundaries.
4. Report GO/NO-GO with blocking findings first and cite exact task/requirement IDs.
5. Run SDD lint. This workflow does not approve tasks. In `auto-sdd`, the coordinator persists verdict, reviewer, attempt, timestamp, and tasks hash in `auto-sdd.json.reviews.tasks`, then returns findings to the correction loop and validates again after edits.
6. Outside delegated auto-SDD, record an explicit human decision with `sdd.mjs override spec <feature> tasks <go|no-go> <actor> --reason <reason>`. Claims still require existing tasks, exact write scopes, and passed completion evidence.
