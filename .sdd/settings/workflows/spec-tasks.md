# Workflow: spec-tasks

1. Follow `_common.md`; require approved requirements and design unless the user explicitly authorizes approval.
2. Load task generation, parallel analysis, and task template rules.
3. Generate outcome-focused tasks with at most two hierarchy levels. For task contract v3, write canonical plan/state to `tasks.json` and render the equivalent human view in `tasks.md`; existing v2 Markdown-only specs remain compatible.
4. For each actionable task declare requirements, dependencies, affected areas/write scope, verification strategy, and completion evidence.
5. Map every acceptance criterion to a task or to an explicit disposition in `coverage.json`.
6. Mark `(P)` only when dependencies and write scopes prove safe concurrency.
7. Merge existing tasks by stable task ID; never overwrite completion state or evidence silently.
8. Set tasks to `review_required` and stop for approval. When invoked by `auto-sdd`, return control to its canonical validate-tasks/correction loop instead.
   Use `sdd.mjs revise <feature> tasks <actor> --reason <reason>` before changing approved bytes.
