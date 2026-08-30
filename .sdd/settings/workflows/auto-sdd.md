# Workflow: auto-sdd

1. Follow `_common.md` and `auto-sdd.md` completely.
2. Invocation forms:
   - `/sdd:auto-sdd <user-input>` starts a new spec and runs the pre-implementation pipeline.
   - `/sdd:auto-sdd --implement <feature>` is the canonical command form that approves the persisted implementation gate and resumes execution; an equally explicit user instruction naming the feature is acceptable under `lifecycle.md`.
   - `/sdd:auto-sdd --resume <feature>` audits and resumes an already approved run interrupted during a wave or final validation. It never grants the original implementation approval.
   - `/sdd:auto-sdd --status <feature>` is read-only and reports automation stage, gate, waves, evidence, blockers, and next action.
   - A request to close, cancel, supersede, or abandon an existing spec without implementation must route immediately to `spec-close`; it must not resume the auto-SDD pipeline. `/sdd:auto-sdd --close <feature> ...` is accepted only as a routing alias for that metadata-only workflow.
3. On start, create `auto-sdd.json` from its template beside `spec.json`, including initiator, timestamps, current stage, correction counters, hashes, token budget/usage, the model policy, and a pending implementation gate. Final-validator capability remains `pending` until the adaptive profile is selected. Do not overload `ready_for_implementation`, which remains the legacy mirror of task approval.
4. Execute the canonical child workflows in the order defined by the rule. Apply corrections between validation passes and automatically approve only final validated artifact hashes.
5. Before the manual gate, persist dependency-ordered waves, their executor/validator capability requirements, the available model-catalog snapshot, the adaptive `lean|standard|critical` validation policy, and both hashes in `auto-sdd.json`; run lint, persist `awaiting_implementation_approval`, and stop.
6. On `--implement`, require a fresh explicit user instruction, record the gate approval, refresh the available model catalog, and execute waves using executor and independent validator subagents. Select and pass a concrete model for every spawn using the canonical lowest-adequate rule; inherited or omitted models are invalid. Do not degrade to one agent.
7. The coordinator alone appends role- and wave-aware evidence and updates shared SDD artifacts as each wave advances. Executor and validator subagents return structured reports but never mutate SDD ledgers.
8. Execute the persisted final-validation mode: reuse the complete single-wave validator for `lean`, use a fresh advanced-or-higher incremental validator for `standard`, or a fresh frontier full validator for `critical`; correct and rerun until passed or genuinely partial.
9. On `--resume`, inspect native agent liveness, the live diff, current hashes, claims, evidence, and attempts before mutation. Invoke `sdd.mjs resume` with `--mode continue` only for a reattachable live agent; otherwise use `--mode recover`, preserve the worktree, increment the attempt, replace orphaned claims, and reverify the complete target before independent validation.
