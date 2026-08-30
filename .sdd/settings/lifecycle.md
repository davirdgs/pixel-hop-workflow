# SDD Lifecycle v2

This file defines the canonical, tool-independent state model. Agent adapters must execute the workflows under `.sdd/settings/workflows/`; they must not redefine transitions.

## Product discovery lifecycle

Product discovery is an optional, pre-SDD lifecycle stored under `.sdd/discoveries/<discovery>/`. It tests whether a product hypothesis deserves specification and implementation; it does not weaken or replace the SDD artifact approvals below.

The canonical discovery profile remains `single-mobile-indie`. Validation depth is proportional to uncertainty and risk inside that profile; it does not create alternate discovery profiles.

The discovery phases are:

`brainstorm -> market_validation -> business_case -> product_outline -> decision -> complete`

- Brainstorming ends only when the user explicitly selects one hypothesis that fits the recorded constraints.
- The market-validation result is `supports`, `mixed`, or `contradicts`. It must use current, cited evidence and may not turn absence of evidence into proof of demand.
- Completed market validation requires `store-design-score.json` with separate applicability and scores for every target store. Apple-only rules such as Guideline 4.3(b) must not be applied to Android targets.
- The business case may be `viable`, `conditional`, or `unviable`; all calculations must expose their assumptions and downside/base/upside scenarios.
- The product outline becomes `ready` only when the narrow MVP, core flows, monetization boundary, validation signals, explicit exclusions, and refreshed store-design score are coherent for the declared delivery capacity and no store hard-stop flag remains.
- The final decision is explicitly `go`, `pivot`, or `stop`. Agents recommend; users decide.
- Every agent-produced GO/NO-GO recommendation is advisory. A user may explicitly override it with `go` or `no-go` when the override records actor, timestamp, affected gate, decision, and a non-empty rationale in append-only gate history. An override accepts the recorded risk; it does not fabricate research, test, implementation, launch-availability, or metric evidence and never authorizes a later external action.
- `pivot` increments the discovery iteration, preserves the previous decision record, and returns to brainstorm or market validation at the earliest invalidated phase.
- `go` requires a current target-platform store-design score without hard-stop flags and makes the discovery eligible for promotion. Creating an SDD spec still requires explicit user approval and starts at `spec-init`; discovery findings are context, not approved requirements.
- `stop` is a successful discovery outcome when evidence says the idea should not consume implementation budget.

Discovery artifacts use their own schema and states. They must never be written into `spec.json` lifecycle fields or treated as implementation evidence.

## Artifact states

Requirements, design, and tasks use:

`missing -> draft -> review_required -> approved -> superseded`

- A generated artifact enters `review_required`.
- Approval records `approved_by`, `approved_at`, and `content_hash`.
- Editing approved content invalidates the hash and returns the artifact to `review_required`.
- Downstream approvals become `superseded` when an upstream approved artifact changes materially.
- A human may approve an artifact after an automated NO-GO only through an explicit manual override whose actor, timestamp, artifact hash, and rationale are appended to `gate_history`. Hard execution invariants, implementation evidence, and later gates remain in force.

## Execution states

Implementation uses:

`not_started -> in_progress -> blocked | implemented -> validated`

Validation uses:

`not_started -> in_progress -> passed | failed | partial`

`partial` is required when device, credential, environment, external review, or manual validation remains.

## Canonical phases

The top-level phase is derived from artifact and execution states:

1. `requirements`
2. `design`
3. `tasks`
4. `implementation`
5. `validation`
6. `complete`

Legacy phase fields may remain during migration, but workflows must update the v2 `lifecycle` object first. A compatibility mirror may then update `phase`, `approvals`, and `ready_for_implementation`.

## Administrative closure

`closed` is a separate terminal phase for a spec that will not be implemented or continued. It is not equivalent to `complete`, `validated`, `cancelled` coverage, or an archived directory.

- Closure requires an explicit human instruction and records `reason`, `closed_by`, `closed_at`, `prior_phase`, and a concise note; `superseded_by` is recorded when applicable.
- Valid reasons are `obsolete`, `superseded`, `cancelled`, `duplicate`, and `no-longer-needed`.
- Closure preserves requirements, design, tasks, approvals, hashes, implementation state, validation state, evidence, and history exactly as historical records. Stale or incomplete artifacts are not repaired merely to close the spec.
- A pre-v2 spec may receive a deterministic minimal v2 lifecycle envelope solely to record closure. This metadata upgrade is logged and must not modify historical artifact bytes.
- Closure is forbidden while active implementation claims exist.
- Closing an auto-SDD spec revokes its implementation gate and sets the automation stage to `closed`.
- `spec-close` is metadata-only: it must not use subagents, regenerate artifacts, run implementation validation, or claim that unimplemented work passed.

## Transition invariants

- Design requires approved requirements.
- Tasks require approved requirements and design.
- Implementation requires approved tasks.
- A task becomes complete only after its declared verification strategy succeeds or its evidence records an explicit external boundary.
- Validation never infers its target from chat history; it uses explicit arguments or persisted spec/task state.
- Completion requires all requirements to be mapped to tasks or recorded in `coverage.json` with a non-planned disposition and rationale.
- Every validation run appends durable evidence to `evidence.jsonl` and updates `validation.md`.
- Administrative closure bypasses completion and coverage requirements because it explicitly records that work will not proceed; it never changes incomplete work into completed work.

## Release and growth lifecycle

Release management is an optional post-SDD lifecycle stored under `.sdd/releases/<release>/`. It consumes validated specs and a live immutable candidate; it does not add release/marketing state to `spec.json` or change approved SDD history.

The release phases are:

`readiness -> go_to_market -> assets -> measurement -> launch -> observation -> growth -> complete`

- `release-init` records the scope, source specs, candidate identity, platforms/markets/locales, owner capacity, budget constraints, and a project-specific checklist. It may start planning while an external item is open, but readiness remains `blocked` until every launch blocker has passed evidence.
- Go-to-market is `ready` only when positioning, organic/paid channel selection, project economics, budget/capacity, research provenance, and scale/stop rules are coherent. A zero-paid-budget plan is valid.
- Assets are `ready` only when required localized metadata and real-product screenshot/creative outputs are generated and validated against current platform rules. Console-only completion remains an explicit boundary.
- Measurement is `ready` only when decision metrics, funnel/event contracts, attribution/privacy limits, baselines, guardrails, ownership, and critical end-to-end evidence exist.
- Launch planning never authorizes submission, production changes, public communication, price changes, or spend. Publication requires an explicit human `launch_gate` bound to current planning artifact hashes. Any material bound change revokes that approval. Paid media requires separate approval naming channel, currency, hard cap, dates, and stop rules.
- A human may override a planning GO/NO-GO for readiness, go-to-market, assets, or measurement with durable rationale. The override changes the planning state only: it cannot substitute for an immutable candidate, launch evidence, consent/privacy behavior, credentials, storefront availability, or the publication and paid-media gates.
- `launched` means the version is actually available in the declared storefront/track and critical production smoke checks passed; upload, review submission, or approval alone is insufficient.
- Observation is `stable`, `alert`, or `insufficient_data`. It uses append-only metric snapshots and declared cohort windows; operational safety and downstream business learning are not conflated.
- Growth is an iterative `learning`, `scaling`, `paused`, or `complete` state. Product changes return to SDD, and external experiments/spend remain explicitly gated.
- Growth is complete only when no experiment or spend authorization remains active, results and budget are reconciled, alerts have dispositions, and each follow-up has an owner plus a destination in release, SDD, discovery, or the derived learning index.

Release history, research sources, evidence, metric snapshots, and experiment results are append-only. A release can be rolled back or paused without erasing what shipped or what was learned.

## Auto-SDD authorization

`auto-sdd` is an opt-in orchestration mode over this lifecycle, not a separate lifecycle. Its initial invocation authorizes the agent to generate, validate, correct, hash, and approve requirements, design, and tasks on the user's behalf. Automatic approval is valid only after the applicable validation has passed against the final artifact bytes.

The implementation boundary remains manual:

- After tasks are validated and approved, `auto-sdd` selects an adaptive validation profile, binds its hash together with the artifact and wave-plan hashes, sets its implementation gate to `pending`, and stops.
- The initial invocation, prior chat context, `-y`, or pre-SDD discovery approval never satisfies this gate.
- Only a new explicit `/sdd:auto-sdd --implement <feature>` request (or equally explicit user instruction naming the feature and authorizing implementation) changes the gate to `approved`.
- No implementation claim, code/configuration edit, migration, deployment, or external mutation may begin while the gate is pending.
- Once approved, implementation follows dependency-ordered waves. Each relevant wave is executed by subagents and reviewed by at least one agent that did not implement that wave. The persisted `lean`, `standard`, or `critical` profile may reuse a complete single-wave review or batch mutually independent reviews, but never removes independent post-code validation. Every subagent receives an explicit persisted model selected as the lowest-cost available model meeting the required capability; model inheritance is not valid selection.
- A wave advances only after findings are corrected and independent validation passes, or after an explicit external boundary is durably recorded as partial. Full completion still requires profile-appropriate passed final validation and a distinct durable final evidence event.
- Resuming an approved interrupted run preserves its gate only while every bound hash remains current. A reattachable live agent continues the same attempt; a lost session increments the target attempt, records abandoned claims, preserves the diff, and requires current-attempt verification plus independent validation. Stale bound state returns to planning and manual approval.

## Parallel execution

- `(P)` means a task is structurally parallelizable; it is not a lock.
- Before editing, an agent claims the task with an owner, base commit, and write scope.
- Overlapping active write scopes are rejected.
- Prefer separate branches/worktrees. Claims coordinate a shared working tree but do not replace Git isolation.
- Claims are released only after evidence is recorded or the task is explicitly abandoned.
