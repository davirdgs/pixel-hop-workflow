---
name: sdd
description: Execute this repository's canonical SDD and product-discovery workflows for mobile, iOS, Android, backend, Firebase, analytics, attribution, and cross-platform product work.
---

# Repository SDD Adapter for Codex

This is a thin adapter. The canonical source is `.sdd/`.

1. Read `.sdd/config.json`.
2. Read `.sdd/settings/workflows/_common.md` completely.
3. Read the matching file under `.sdd/settings/workflows/` completely.
4. Load only the steering profiles and spec sections required by those files.
5. Follow `.sdd/settings/lifecycle.md` for state transitions.
6. Use `node .sdd/tools/sdd.mjs lint` before completing mutating workflows.
7. Claim parallel implementation tasks before editing and release them only after evidence is recorded.

For `discovery-*` workflows, use `.sdd/discoveries/<discovery>/discovery.json` instead of a spec, follow the pre-SDD lifecycle in `lifecycle.md`, and use current internet research where the workflow requires market, competitor, pricing, policy, or cost evidence. Record every source with `node .sdd/tools/sdd.mjs source discovery <discovery> ...` so the shared evidence contract is validated before append. The product-discovery profile is `single-mobile-indie`; vary evidence depth proportionally inside that profile rather than inventing other profiles.

GO/NO-GO reviews are recommendations. When the user explicitly overrides one, use the canonical `approve --override-reason` or `override` helper so gate, actor, timestamp, decision, reason, and current hash when applicable are durable. An override accepts risk but never creates missing implementation, launch, metric, privacy, credential, or external evidence.

For `release-*` workflows, use `.sdd/releases/<release>/release.json`, follow the separate post-SDD lifecycle, and ground work in the validated source specs plus the live candidate, store, public/legal, analytics, commerce, support, and release configuration. Use current research for mutable store, channel, advertising, attribution, asset, policy, and benchmark facts. Planning never authorizes publication, production mutation, public communication, pricing changes, or spend; obey the hash-bound publication gate and the separate explicit paid-media budget gate.

For `auto-sdd`, read the canonical workflow and rule completely. The initial request delegates requirements/design/tasks approval but never implementation. Stop at the persisted manual gate. Before that gate, persist the adaptive `lean|standard|critical` validation policy and its hash; derive final-validator capability from that profile instead of defaulting to frontier. After explicit `--implement`, use executor subagents for safe task groups and independent validator subagents according to that policy; the coordinator alone updates shared SDD ledgers. Resolve the lowest-cost configured Codex model that meets each persisted capability, record the concrete assignment and token/cost usage before spawning, and always pass the native `model` override; never omit it and rely on task inheritance. Condense only hash-identical reviews, batch only independent waves, allow single-wave final reuse only for `lean`, and keep fresh frontier full validation for `critical`. Respect correction and token budgets; block for a user decision rather than weakening validation.

The Codex model that invokes the skill is only the coordinator and cannot be changed by the running workflow. Recommend an advanced coordinator for normal runs and frontier only for exceptional ambiguity, architecture, or critical-risk planning; never let that choice alter the persisted lowest-adequate subagent assignments.

For `/sdd:auto-sdd --resume <feature>`, inspect live Codex subagent state before mutation and use the canonical `sdd.mjs resume` helper. Choose `continue` only when the exact agent is still live and reattachable. Choose `recover` for a lost session: preserve its diff, increment the attempt, replace only orphaned target claims, explicitly assign a new lowest-adequate model, and reverify the full target. Stale gate-bound hashes require replanning and renewed manual approval.

For `spec-close`, load only spec/auto-SDD metadata and active claims, use the deterministic `sdd.mjs close` helper, and never spawn subagents, repair stale artifacts, regenerate coverage, or run implementation validation. A request to close an obsolete auto-SDD spec routes here instead of resuming orchestration.

Do not import workflow behavior from `.claude/commands/sdd/`; those files are Claude adapters to the same canonical source.
