# Common SDD Workflow Contract

All SDD workflows, regardless of agent, follow this contract.

## Context loading

1. Read `.sdd/config.json` and `.sdd/settings/lifecycle.md`.
2. Read the target `spec.json` when a feature exists.
3. Load steering from `config.context.always` plus the spec's `context_profiles`.
4. Read only the relevant sections of requirements, design, research, and tasks. A full-document review is required only for generation, approval, traceability audit, or when targeted context is insufficient.
5. Inspect live code and configuration before trusting snapshots or prior conversation conclusions.
6. When a context manifest exists, load its hashes, section index, summaries, and dependencies first. Reuse unchanged hash-bound findings and read deltas plus affected sections before expanding to a full document.

For product-discovery workflows, replace the target spec with `.sdd/discoveries/<discovery>/discovery.json`, load the discovery artifacts required by the current phase, and load project steering only when an existing product or capability materially constrains the opportunity. Discovery may also run before steering exists.

For `release-*` workflows, replace the target spec with `.sdd/releases/<release>/release.json`. Load its release context, named source specs, exact candidate/build state, applicable steering profiles, current store/public/analytics/commerce/release configuration, and only the phase artifacts needed for the action. Release research, evidence, metrics, and experiments remain release-owned append-only records.

Append-only ledgers may have derived cursors, indexes, and rollups. These accelerate reads but never replace or rewrite the raw history.

## Agent-neutral capabilities

Workflows describe capabilities, not product-specific tool names:

- read/search repository files;
- edit files safely;
- execute local validation commands;
- consult current primary documentation when external behavior may have changed;
- request approval when a transition requires user authority.
- delegate bounded work to isolated subagents and independent reviewers when a workflow explicitly requires it.

Each agent maps these capabilities to its native tools.

When a workflow requires explicit model selection, inheritance is not a selection. Resolve the concrete runtime model from the persisted capability and cost policy, pass that model through the native subagent API, and preserve the assignment in the workflow-owned state.

## State and history

- Update `lifecycle` according to `lifecycle.md`.
- Keep legacy `phase`, `approvals`, and `ready_for_implementation` synchronized while schema v1 consumers remain supported.
- Never delete or rewrite historical specs to migrate metadata.
- Preserve `migration_history`; append, never replace.
- Approval hashes must match the approved artifact bytes.
- Record every manual GO/NO-GO override in append-only gate history with gate, actor, timestamp, decision, content hash when applicable, and rationale. Manual override never manufactures missing operational evidence.

## Verification and evidence

- Select a verification strategy appropriate to the task: test-first, contract test, build/lint, migration dry-run, or manual evidence.
- Record executed commands, results, environment boundaries, and manual checks in `evidence.jsonl`.
- Use `node .sdd/tools/sdd.mjs evidence <feature> <task> <agent> <kind> <status> <summary>` for task evidence when practical.
- Summarize validation in `validation.md`.
- Never claim full validation when device, credential, external console, review, or environment work remains.
- For market and business discovery, preserve consulted URLs and claim-level notes in `research-sources.jsonl`; a prose bibliography alone is not durable evidence. Every record must follow `rules/research-sources.md` and `.sdd/settings/schemas/research-source.schema.json`.
- For release marketing, store assets, platform policy, pricing, attribution, and growth work, preserve mutable claim-level research in the release's `research-sources.jsonl` using the same shared source contract. Preserve launch evidence, metric snapshots, and experiment outcomes in their release ledgers.
- Reuse research until `fresh_until` when its market, platform, topic, and scope still apply. Refresh only expired, contradicted, or scope-affected claims.

## Parallel safety

- Before implementation, claim each task with `.sdd/tools/sdd.mjs claim`.
- Respect declared dependencies and write scopes.
- Do not edit paths owned by another active claim.
- Preserve unrelated worktree changes.

## Completion

Before ending a mutating workflow, run:

```bash
node .sdd/tools/sdd.mjs lint
```

Then run the project-specific tests/builds proportional to the change.
