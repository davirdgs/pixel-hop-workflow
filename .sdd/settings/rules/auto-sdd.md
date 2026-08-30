# Auto-SDD Orchestration Rule

## Scope and authority

`auto-sdd` converts a concrete user input into a new specification and drives it to the implementation boundary. The initial invocation authorizes automatic approval of requirements, design, and tasks only. It never authorizes implementation.

Use the canonical child workflows and rules; do not recreate their behavior in an adapter. Preserve every lifecycle transition, approval hash, legacy compatibility mirror, correction, and validation result.

If the user's intent is to stop work permanently because an existing spec is obsolete, superseded, duplicated, cancelled, or no longer needed, exit this orchestration path and run `spec-close`. Do not validate, modernize, or complete the old spec first, and do not spawn any subagent for closure.

## Pre-implementation pipeline

1. Run `spec-init` for a new unique feature. If the feature already exists, stop unless the user explicitly requests resumption of that exact auto-SDD run.
2. Run `spec-requirements`, then `validate-requirements`.
3. On NO-GO, correct `requirements.md`, invalidate stale downstream state, and rerun validation. Repeat until GO or a genuine user decision is required.
4. Approve the final requirements bytes with approval mode `delegated-auto-sdd`, agent identity, timestamp, and SHA-256 hash; synchronize legacy approval metadata. Use the canonical approval helper when available.
5. For brownfield work, run `validate-gap` before design. For greenfield work, record why gap analysis is not applicable.
6. Run `spec-design` with the required minimal/light/full discovery, then `validate-design`.
7. Correct every blocking design finding and rerun design validation against the corrected bytes until GO. Auto-approve only that final design hash.
8. Run `spec-tasks`, then `validate-tasks`. Correct coverage, dependencies, write scopes, verification, or parallel markers and rerun until GO. Auto-approve only the final task hash.
9. Derive dependency-ordered implementation waves from the live task DAG. A wave may contain concurrent `(P)` tasks only when claims and write scopes can coexist. Classify and persist executor and validator model requirements for every wave, snapshot the configured models currently available to the runtime, select the adaptive validation profile below, and bind both the plan and validation-policy hashes before requesting implementation approval.
10. Run SDD lint, set `auto-sdd.json.stage=awaiting_implementation_approval` and its gate to `pending`, then stop with one explicit question. Do not begin implementation in the same turn.

Validation must follow the last correction. A GO or lint result that predates an artifact edit is stale and cannot authorize approval.

Apply `max_pre_implementation_correction_attempts_per_artifact`. When the limit is reached, the same blocking finding repeats, or the correction requires a product decision, stop and ask the user. A human may manually override a NO-GO only outside delegated auto-approval, using the exact artifact hash and a durable rationale; auto-SDD must not silently convert that override into delegated approval.

For each pre-implementation validation, persist the artifact name, GO/NO-GO verdict, reviewer, attempt, timestamp, and SHA-256 content hash in `auto-sdd.json.reviews`. Delegated approval requires the latest review to be `passed` and its hash to match the artifact bytes exactly.

## Adaptive validation profiles

Select the cheapest profile that safely covers the persisted risks. The profile is part of the manual gate and any change revokes that gate.

- `lean`: localized, reversible, known-pattern work that fits exactly one wave and has no critical risk. Requirements, design, and tasks reviews may be produced by one bounded review operation, but each artifact still needs its own lifecycle-ordered, hash-bound verdict. The independent wave validator may also satisfy final validation when its durable report explicitly covers the complete feature.
- `standard`: multi-file, cross-component, cross-platform, ambiguous, or multi-wave work without a critical risk. Reuse current hash-bound artifact findings, batch only mutually independent waves, and make final validation incremental: consume prior wave evidence and focus on integration seams, uncovered requirements, and feature-level regressions.
- `critical`: security, privacy, authentication/authorization, migration, destructive behavior, commerce/entitlements, or production mutation. Keep sequential artifact review, independent validation for every wave, and a fresh full final validation.

Artifact review reuse is valid only when the artifact SHA-256 and all relevant review context are unchanged. A batched validator invocation must return and persist a separate verdict and evidence event for every exact wave; waves with direct dependencies cannot share a batch. A dependent wave still waits for its dependency's passed verdict.

Run the declared targeted checks during implementation waves. Unless a critical boundary or a failure requires earlier expansion, run the broad regression suite once in final validation rather than repeating it for every wave. Never skip schema/lint checks, required-task coverage, independent post-code review, critical-risk validation, or honest `partial` boundaries.

## Manual implementation gate

Accept implementation authority only from a new explicit `/sdd:auto-sdd --implement <feature>` request or equivalent instruction. Record the human approver and timestamp bound to the current requirements, design, tasks, wave-plan hashes and spec revision. Revoke the gate whenever any bound value changes. Recheck lifecycle state, live code, worktree state, and active claims before editing.

If the runtime cannot create subagents, stop as blocked; do not silently fall back to a single-agent implementation because independent execution and validation are part of this mode's contract.

## Capability- and cost-aware model selection

Every executor, fixer, wave validator, and final validator must receive a concrete model through the runtime's native spawn parameter. Omitting that parameter or relying on the coordinator's inherited model is invalid, even when inheritance would happen to select the same model.

Record available input, cached-input, and output tokens plus estimated cost for each assignment. Enforce configured soft/hard budgets: warn at the soft threshold and block for an explicit user decision at the hard threshold. Budget exhaustion never converts failed or partial validation into passed.

The model used to invoke `auto-sdd` is the coordinator model and does not propagate capability to subagents or change their persisted assignments. Prefer an `advanced` coordinator for normal runs because it must classify risk, split work, and reconcile evidence. Use a `frontier` coordinator only when the specification itself has exceptional ambiguity, cross-system architecture, or critical-risk planning; doing so does not justify stronger executor or validator models. The runtime selects the coordinator before the workflow starts, so the workflow can recommend but cannot replace its own active model.

Use `auto_sdd.model_selection` as the project policy, select the current runtime's entry from `provider_catalogs`, and persist that effective provider/catalog snapshot in `auto-sdd.json.model_policy`. Catalog entries declare a concrete model, a capability (`routine < advanced < frontier`), and a positive `cost_rank` where lower is cheaper. Reconcile the configured provider catalog with models actually available in the current runtime; unavailable entries are not candidates. A provider adapter may construct an equivalent catalog from native model metadata when no project catalog exists, but it must persist the capability/cost ranking before planning and must block if it cannot rank the choices honestly.

Classify the work before spawning:

- `routine`: localized, well-specified, reversible work with narrow verification and no sensitive boundary;
- `advanced`: cross-file or cross-component integration, meaningful ambiguity, architecture interaction, concurrency, or broad regression reasoning;
- `frontier`: security, privacy, authentication/authorization, destructive operations, data migrations, commerce/entitlements, production mutation, or unusually consequential architectural/debugging work.

The wave validator must meet or exceed the highest executor capability required by that wave. Use `frontier` for any validator reviewing a frontier risk. Final validation requires `advanced` for `lean` and `standard`, and `frontier` for `critical`; individual risk classification may always raise the requirement.

For each spawn:

1. Filter the available catalog to models whose capability meets the persisted requirement.
2. Select the candidate with the lowest `cost_rank`; configuration order breaks ties.
3. Before spawning, append a model assignment containing agent identity, role, concrete model, capability, cost rank, and a concise rationale.
4. Pass that exact model explicitly to the native subagent API.

Do not choose a stronger or more expensive model merely because it matches the coordinator. Check provider-level environment overrides, organization policies, allowlists, and fallback behavior before spawn; the effective model must equal the persisted assignment. If no available model meets the requirement, the runtime cannot explicitly select a model, or a higher-precedence setting would silently replace it, set the automation to `blocked` and report the missing capability or conflicting control. Never silently downgrade. A temporary exception may change the catalog only when it still selects the lowest adequate available model and the persisted snapshot/rationale are updated before spawn.

## Wave execution contract

For every relevant wave:

1. The coordinator assigns bounded task groups to fresh executor subagents, providing only mapped requirements, design contracts, task metadata, steering, and write scope needed for that group. It selects, persists, and explicitly passes the lowest-cost model that meets the wave's executor capability.
2. The coordinator acquires claims for the assigned executor identities before edits. Concurrent executors must have non-overlapping active claims.
3. Executors edit only claimed product/test paths, run declared targeted verification, and return a structured report of changed paths, commands, artifacts, deviations, and unresolved boundaries. They must not edit shared SDD ledgers (`spec.json`, `tasks.md`, `auto-sdd.json`, `evidence.jsonl`, `validation.md`) or validate their own wave.
4. The coordinator is the sole writer of shared SDD state. It serially records executor reports and evidence before any task checkbox, lifecycle, wave status, or claim release is changed. Validator evidence uses `kind=review`, `role=validator`, the exact wave ID, and a passed decision before a wave can be validated.
5. After all executors in the wave finish, assign a read-only validator agent that implemented none of the wave's tasks and receives durable artifact/diff references rather than executor chat conclusions. It must be fresh for a critical wave; under a persisted standard batch it may validate multiple mutually independent waves in one invocation. Select and explicitly pass the lowest-cost model that meets the highest persisted validator capability in its scope. The validator reviews the live diff, requirement coverage, design alignment, task evidence, integrations, and relevant regression commands.
6. Route every blocking finding to the responsible executor or a fresh fixer. Record every code-changing fixer in the wave's `executor_agents` set and give it its own explicit lowest-adequate model assignment. After corrections, rerun targeted checks and independent validation. Prefer a fresh validator for re-validation when capacity permits; the validator must always remain independent of every agent that changed the wave.
7. Mark the wave validated and release claims only after durable passed executor and independent-validator evidence exists. Do not start dependent waves before this point.
8. Preserve an honest `partial` boundary for unavailable devices, credentials, consoles, or external review. A partial wave may unblock only work that does not depend on the unverified behavior; final completion remains blocked until canonical validation passes.

Agents must not share broad prior task-group context by default. Use fresh agents for independent groups/waves so conclusions from one slice do not leak into another.

If a correction changes approved requirements, design, tasks, or wave composition materially, invalidate downstream approvals, revoke the implementation gate, rebuild the plan, and return to the manual gate. Do not continue under stale authority.

## Interrupted-run recovery

`/sdd:auto-sdd --resume <feature>` resumes only a run whose implementation gate was already approved and remains bound to the live artifact, plan, validation-policy, and revision hashes. It does not authorize a pending gate. Before spawning or editing, inspect native subagent/task liveness, the preserved worktree diff, active claims, task checkboxes, attempt-scoped evidence, and current lifecycle state.

Classify the target:

- `continue`: the exact executor or validator is still live and reattachable. Preserve its claim, assignment, and attempt. Run `node .sdd/tools/sdd.mjs resume <feature> <actor> --mode continue --reason "<reason>" [--wave wave-N]`, then reattach rather than spawning duplicate work.
- `recover`: the prior session or agent is no longer live, or the wave is `failed`/`partial`. Run the helper with `--mode recover`. It abandons only claims belonging to the selected target, preserves all worktree changes, increments the attempt exactly once, clears stale wave validators, and records structured recovery provenance. Assign a new explicit lowest-adequate executor/fixer, reacquire claims, audit the existing diff, and complete or correct it.
- `replan`: any gate-bound artifact bytes, spec revision, wave plan, or validation policy changed. Do not use old implementation authority. Invalidate downstream state through the canonical artifact workflow, rebuild the plan, and return to the manual gate.

If multiple interrupted waves exist, require an explicit `--wave wave-N` target. If native liveness cannot distinguish a live external owner from an orphaned claim, stop for confirmation instead of creating overlapping ownership. Never reset, discard, or overwrite the preserved diff merely to resume.

A recovered attempt invalidates prior attempt-scoped completion evidence for authorization purposes. Already coherent code and completed tasks may be retained, but the coordinator must rerun targeted verification for every task in the recovered wave and append current-attempt executor evidence before independent validation. Every agent that changed retained code remains in `executor_agents`, including agents from earlier attempts. Dependent waves remain blocked until the recovered wave is validated.

Final-validation recovery follows the same distinction. A lost final validator increments `final_validation.attempt`, clears its agent and assignment, and requires a new explicit assignment. A `lean` recovery may still use `reuse-single-wave` only if the eventual final reviewer is recorded as an independent wave validator and produces a new complete-feature report plus distinct final evidence.

## Final validation

After all waves, execute the selected final-validation mode. `lean` may reuse its single independent wave validator and durable complete-feature report; record a distinct `final-validation` evidence event. `standard` uses a fresh independent agent with an explicitly selected advanced-or-higher model for incremental integration and regression review. `critical` uses a fresh independent agent with an explicitly selected frontier model for full `validate-impl`. Persist the assignment before spawn. Correct findings and rerun independent validation until `passed` or a genuine external boundary yields `partial`. Only `passed` may set implementation to `validated`, automation to `complete`, and the spec lifecycle to `complete`.
