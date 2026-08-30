# Workflow: spec-impl

1. Follow `_common.md`; require approved tasks and select explicit task IDs. Running all pending tasks is allowed only when the user asks for it. If `auto-sdd.json` exists, also require its current implementation gate to be approved and bound to the current spec revision, design hash, tasks hash, and plan hash; otherwise stop and route to `/sdd:auto-sdd --implement <feature>`.
2. Claim each task before editing, recording owner, base commit, and write scope.
3. Load only mapped requirements, relevant design contracts, task details, and declared steering profiles.
4. Execute the declared verification strategy:
   - test-first for executable behavior;
   - contract tests for API/event boundaries;
   - build/lint for configuration;
   - migration dry-run for data/infra changes;
   - manual evidence only when automation is not feasible.
5. Implement, refactor, run targeted validation, then relevant regression suites.
6. Append evidence before marking a task complete. For task contract v3, update `tasks.json` first and render the matching checkbox in `tasks.md`; do not let the two views diverge. Do not mark container tasks complete until all required children are complete.
7. Update implementation state and release the claim as complete only after current `passed` evidence. Failed, partial, or unavailable verification must remain blocked or be released explicitly with `--abandon`; it cannot appear completed. Preserve partial/external validation boundaries.
8. In auto-SDD executor mode, steps 6–7 are coordinator-only: the executor returns a structured report and must not append evidence, check tasks, update lifecycle/wave state, or release claims. The coordinator serializes those changes after independent wave validation.
