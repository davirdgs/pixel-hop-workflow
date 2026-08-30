# Pixel Hop Workflow

[![Validate SDD framework distribution](https://github.com/davirdgs/pixel-hop-workflow/actions/workflows/validate.yml/badge.svg)](https://github.com/davirdgs/pixel-hop-workflow/actions/workflows/validate.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

Canonical, agent-neutral Spec-Driven Development framework for Pixel Hop projects.

It also includes a pre-SDD product-discovery workflow for mobile products built under constrained delivery capacity. Discovery tests opportunity, market evidence, business viability, and a narrow product outline before implementation capacity is committed.

The reference profile targets products with:

- native iOS and Android clients;
- a shared backend;
- Firebase Authentication, Analytics, Crashlytics, and Messaging;
- product analytics, attribution, and sales-funnel measurement;
- Claude and Codex used independently or in parallel.

## Source of truth

The framework source lives in this repository:

- `.sdd/settings/workflows/` — canonical workflows;
- `.sdd/settings/lifecycle.md` — lifecycle and transition invariants;
- `.sdd/settings/rules/` — quality and generation rules;
- `.sdd/settings/templates/` — spec and steering templates;
- `.sdd/settings/schemas/` — machine-readable schemas;
- `.sdd/tools/` — lint, status, evidence, validated research-source append, and parallel-task claims;
- `.sdd/releases/` — project-owned post-SDD release, launch, measurement, and growth artifacts after installation;
- `.claude/commands/sdd/` — thin Claude adapters;
- `.codex/skills/sdd/` — thin Codex adapter.

Tool adapters may translate argument syntax and native capabilities, but they must not redefine lifecycle or workflow behavior.

## Auditable manual gates

Agent GO/NO-GO verdicts are recommendations. A user can explicitly override discovery and release-planning gates with:

```bash
node .sdd/tools/sdd.mjs override discovery <name> <gate> <go|no-go> <actor> --reason "<reason>"
node .sdd/tools/sdd.mjs override release <name> <gate> <go|no-go> <actor> --reason "<reason>"
node .sdd/tools/sdd.mjs override spec <name> <requirements|design|tasks> <go|no-go> <actor> --reason "<reason>"
```

Artifact-review decisions use the same `override spec` path; its GO form delegates to the hash-bound approval helper. Every override records actor, timestamp, decision, gate, rationale, and artifact hash when applicable. Overrides accept documented risk but never fabricate implementation tests, launch availability, data quality, or external authorization.

The product-discovery profile remains `single-mobile-indie`. Evidence depth varies proportionally inside that profile; technical discovery during design is a separate depth classification, not another product-discovery profile.

New task-contract v3 specs keep canonical task state in `tasks.json` and render `tasks.md` for humans; existing Markdown-only v2 specs remain supported. Context manifests, ledger cursors, research freshness, correction limits, and token budgets reduce repeated context without removing hash-bound or independent validation.

## Auto-SDD orchestration

`auto-sdd` turns a concrete user request into a new spec and drives every pre-implementation phase without repeated approval prompts:

```text
user input
   ↓
spec-init → requirements → validate/correct → delegated approval
   ↓
gap analysis when brownfield
   ↓
design → validate/correct → delegated approval
   ↓
tasks → validate/correct → delegated approval → wave plan
   ↓ select hash-bound lean / standard / critical validation profile
   ↓
STOP: explicit implementation approval required
   ↓ /sdd:auto-sdd --implement <feature>
executor subagents → adaptive independent validation → corrections
   ↓ repeat per dependency wave
profile-appropriate final validation
```

Start with `/sdd:auto-sdd <user-input>`. The initial request authorizes only requirements, design, and tasks approval after their final hash-bound validation passes. It never authorizes code edits. The workflow persists `auto-sdd.json`, binds the manual gate to the current spec revision plus requirements, design, tasks, and wave-plan hashes, and revokes stale authority after any material upstream change.

Implementation resumes only with `/sdd:auto-sdd --implement <feature>`. Safe task groups run in dependency-ordered waves using isolated executor subagents. Validation is risk-adaptive: `lean` can reuse one complete single-wave independent review, `standard` can batch independent waves and uses an incremental integration final, and `critical` retains per-wave plus fresh full final validation. Hash-bound artifact findings are reused only while content and context remain unchanged; targeted checks run in waves and the broad regression normally runs once at the end. Executors never update shared SDD ledgers; the coordinator serializes task state, evidence, wave state, and claim release.

Resume an interrupted approved run with `/sdd:auto-sdd --resume <feature>`. The coordinator first audits hashes, native agent liveness, diff, claims, and attempt-scoped evidence. A provably live agent continues the same attempt; a lost session preserves the diff, abandons only its orphaned target claims, increments the attempt, assigns a new explicit lowest-adequate model, and reverifies the entire target. Stale gate-bound state returns to planning and manual approval instead of continuing under obsolete authority.

Every subagent receives an explicit model; inheritance from the coordinator is forbidden. Before the gate, each wave is classified as `routine`, `advanced`, or `frontier`. At execution time, the workflow filters the current provider's configured models to those meeting that capability and selects the lowest `cost_rank`, persisting the model and rationale before spawn. The default catalogs route Codex routine/advanced work to `gpt-5.6-terra` and frontier work to `gpt-5.6-sol`; Claude routes routine work to `claude-haiku-4-5-20251001`, advanced work to `claude-sonnet-5`, and frontier work to `claude-opus-4-8`. Final validation is advanced for `lean`/`standard` and frontier for `critical`. Security, privacy, auth, migrations, destructive operations, commerce, and production changes force the critical profile and frontier capability. If no adequate model can be selected explicitly—or a provider override/allowlist would silently replace it—the run blocks rather than inheriting or silently downgrading.

The model that starts `/sdd:auto-sdd` is only the coordinator. It affects risk classification and orchestration quality, but does not affect the explicit executor/validator selections. An advanced coordinator is the cost-effective default; reserve a frontier coordinator for exceptionally ambiguous, architectural, or critical-risk specifications.

Closing an old spec is deliberately outside this pipeline. `/sdd:spec-close <feature> <reason>` records a terminal `closed` disposition for obsolete, superseded, cancelled, duplicate, or no-longer-needed work. It preserves the historical artifacts and execution state, revokes any auto-SDD gate, and performs no subagent delegation, artifact refresh, coverage repair, build, or implementation validation. A close request sent through `auto-sdd` routes immediately to this workflow instead of resuming the spec.

## Product discovery before SDD

Product discovery is optional and deliberately separate from feature specifications. Its artifacts live under `.sdd/discoveries/<discovery>/`; a GO makes an idea eligible for `spec-init`, but does not approve requirements or implementation. Explicit promotion uses `/sdd:spec-init --from-discovery <discovery> <feature-description>` and records provenance in both lifecycles.

```text
discovery-brainstorm ── explicit hypothesis selection
          ↓
discovery-validate ─── current market, competitor, and contrary evidence
          ↓
discovery-business ─── model, costs, scenarios, break-even, ROI
          ↓
 discovery-product ─── core loop, flows, MVP, non-goals, measurements
          ↓
 discovery-decide ──── explicit GO / PIVOT / STOP
          ↓ GO + explicit promotion request
       spec-init
```

| Workflow | Purpose and exit condition |
| --- | --- |
| `discovery-brainstorm` | Interactively confirms the operating envelope, explores problems, compares 3–5 hypotheses, and adds preliminary feasibility plus Apple/Google Store Design Readiness scores before the user selects one. |
| `discovery-validate` | Searches current online evidence for demand, competitors, substitutes, pricing, distribution, constraints, contrary evidence, and current target-store policy risk. |
| `discovery-business` | Designs a self-service model and calculates transparent downside/base/upside costs, contribution, break-even, cash need, payback, and ROI. |
| `discovery-product` | Defines the smallest useful mobile MVP, core flows, monetization, retention, trust boundaries, measurements, and explicit non-goals. |
| `discovery-decide` | Audits consistency and asks the user for GO, PIVOT, or STOP. Only an explicit GO can become eligible for SDD promotion. |
| `discovery-status` | Reports current state, constraints, conditions, and next valid action without changing artifacts. |

The default profile rejects ideas that primarily depend on consultative enterprise sales, marketplace liquidity, per-transaction human delivery, heavy moderation, inaccessible proprietary data, high liability, or unbounded variable cost unless a concrete low-cost mitigation exists. Project-specific values such as weekly hours, budget, runway, currency, and desired return belong in `.sdd/config.json` or the discovery's `constraints.md`; the framework does not invent them.

Market and business phases preserve claim-level online research in append-only `research-sources.jsonl`. Every line uses the shared `research-source.schema.json` contract: `captured_at`, `url`, `title`, `source_type`, `direction`, `claim`, and `note`; valid directions are `supports`, `contradicts`, `constrains`, and `context`. Prefer `node .sdd/tools/sdd.mjs source discovery <name> ...` (or `source release <name> ...`) so records are validated before append. Mutable competitor pricing, store fees, platform rules, and service costs must be refreshed from current sources. Estimates remain labeled, and a lack of evidence is never presented as proof of demand.

Discovery treats store policy as an early design constraint. Apple and Google receive independent 0–100 scores across distinct value, functional depth, original identity, mobile quality, honest presentation, sustainable operation, and platform-policy fit. Apple Guideline 4.3(b) is assessed only for Apple targets; Google Play uses its own repetitive-content, minimum-functionality, quality, identity, and metadata rules. The lower targeted-platform score becomes the cross-platform score, while any unresolved hard flag blocks a GO regardless of the average. The evidence-backed calculation lives in `store-design-score.json` and is refreshed after the MVP flows are defined.

For Apple, the score does not collapse “spam” into one opinion. New assessments separate 4.3(a) submission provenance/duplication from 4.3(b) market substitutability, compare the closest apps by core loop, classify strong versus weak differences, record when the distinction becomes reviewer-visible, require a demonstrable proof level, and preserve the strongest contrary case. The detailed block is additive and optional for older scorecards; newly generated Apple discoveries complete it, while Android-only discoveries store it as `null`.

## Release and growth after SDD

Validated product work can enter a separate release lifecycle under `.sdd/releases/<release>/`. It keeps operational, store, marketing, measurement, and growth state out of approved feature specs while retaining traceability to the exact specs and candidate build.

```text
validated SDD specs + live candidate
              ↓
release-init → context-grounded readiness checklist
              ↓
release-marketing ─ organic/paid research, economics, bounded tests
release-assets ──── localized metadata, real-app screenshots, creatives
release-measurement ─ funnel, analytics, attribution, guardrails
              ↓
release-launch ───── hash-bound human publication gate
              ↓           separate explicit paid-media gate
actual availability → observation snapshots → growth experiments
                                             ↓ product change
                                             new SDD spec
```

| Workflow | Purpose and exit condition |
| --- | --- |
| `release-init` | Binds a named release to validated specs, candidate identity, platforms/markets/locales, capacity/budget, live configuration, and a customized checklist. |
| `release-readiness` | Audits product quality, production operations, store/policy/legal/commerce, support, rollout, and evidence; `READY` requires zero blockers. |
| `release-marketing` | Researches reachable organic and paid channels for the confirmed budget and economics, then defines a measurable portfolio with scale/iterate/stop rules. |
| `release-assets` | Produces localized store metadata, a real-product screenshot narrative, reproducible marketing compositions, creative variants, and upload validation. |
| `release-measurement` | Defines and validates the acquisition-to-value/retention/revenue funnel, attribution, privacy, reconciliation, dashboards, alerts, and decision thresholds. |
| `release-launch` | Plans staged submission/rollout, obtains a hash-bound human gate, records actual availability, and handles pause/rollback boundaries. Planning alone never authorizes external actions. |
| `release-monitor` | Appends a cohort-aware metric/guardrail snapshot and reports `stable`, `alert`, or `insufficient_data`. |
| `release-growth` | Diagnoses the constrained funnel stage and maintains a durable experiment/learning loop. Product changes return to SDD; spend and production experiments remain explicit. |
| `release-status` | Reports planning completeness, gate/hash validity, rollout, observation, budget/data quality, experiments, blockers, and next legal action without mutation. |

Channel benchmarks are treated as dated priors, never as a promise that one network has universally better ROI. The workflow ranks project-specific tests by audience intent, creative fit, downstream cohort value, contribution/payback, measurement limits, minimum learning volume, developer capacity, and downside. Small budgets are concentrated into experiments that can answer a decision rather than fragmented across channels.

Store screenshots follow a reproducible truth-preserving pipeline: deterministic privacy-safe app state, raw release-candidate capture, programmatic brand composition, localized variants, and dimension/crop/readability/claim validation. Generated art may be decorative where policy permits, but it cannot invent UI, results, endorsements, or unavailable behavior.

## Execution order

Every workflow starts by applying `.sdd/settings/workflows/_common.md`. It loads the project context, validates the lifecycle state, preserves history, and defines the evidence and parallel-execution rules shared by Claude and Codex.

```text
steering / steering-custom
          ↓
       spec-init
          ↓
  spec-requirements ── explicit approval
          ↓
   [validate-gap]
          ↓
     spec-design ───── minimal, light, or full discovery
          ↓
   validate-design ─── GO + explicit approval
          ↓
      spec-tasks ───── explicit approval
          ↓
       spec-impl
          ↓
     validate-impl ─── passed, failed, or partial
          ↓
       complete
```

`spec-status` is read-only and may be run at any point to report the current phase, approvals, progress, blockers, and next valid transition.

`spec-close` is the metadata-only terminal path when a spec will not be implemented. `closed` is distinct from `complete`: it records why work stopped without pretending that pending tasks were implemented or validated.

`discovery-status` provides the equivalent read-only view for pre-SDD product discovery.

| Order | Workflow | Purpose and exit condition |
| --- | --- | --- |
| 0 | `steering` | Bootstrap or synchronize durable project context from the live codebase. Run once during adoption and again when architecture or product direction changes materially. |
| 0a | `steering-custom` | Add a specialized steering document and register when agents must load it. |
| 1 | `spec-init` | Create the spec directory, `spec.json`, and a requirements stub. It does not generate design or tasks. |
| 2 | `spec-requirements` | Describe WHAT the product must do using stable numeric IDs and EARS acceptance criteria. Design remains blocked until explicit approval. |
| 3 | `validate-gap` | Optional, but recommended for brownfield work. Compare requirements with the current implementation and record reuse options, gaps, and risks without advancing the lifecycle. |
| 4 | `spec-design` | Translate approved requirements into architecture, contracts, boundaries, traceability, risks, and verification strategy. Select minimal, light, or full discovery based on uncertainty. |
| 5 | `validate-design` | Produce a concise GO/NO-GO review. A GO does not approve the design automatically; explicit approval is still required. |
| 6 | `spec-tasks` | Generate the executable task ledger with requirement coverage, dependencies, write scopes, verification commands, and evidence expectations. Implementation waits for explicit approval. |
| 7 | `spec-impl` | Claim approved tasks, implement them with verification-first development, append evidence, and only then mark them complete. |
| 8 | `validate-impl` | Validate requirements, design alignment, tests, regressions, and evidence. Mark the spec complete only when validation passes and no required work remains. |
| Any | `spec-status` | Derive status and the next valid action without changing files or lifecycle state. |
| Any active phase | `spec-close` | Close work that will not continue, preserving historical artifacts and avoiding implementation validation or subagents. |

## Available rules

Rules are quality policies consumed by the workflows. They are not independent lifecycle commands.

| Rule | Used during | Brief description |
| --- | --- | --- |
| `steering-principles.md` | Steering | Keeps steering durable and decision-oriented, avoiding volatile inventories and duplicated implementation detail. |
| `ears-format.md` | Requirements | Defines localized EARS acceptance criteria and stable numeric requirement IDs such as `2.1`. |
| `gap-analysis.md` | Gap validation | Structures the comparison between approved requirements and existing code, including options, risks, and a preferred direction. |
| `design-discovery-light.md` | Design | Guides focused investigation when extending known patterns or using familiar dependencies. |
| `design-discovery-full.md` | Design | Requires comprehensive research for new architecture, security-sensitive work, or uncertain external integrations. |
| `design-principles.md` | Design | Defines contracts, boundaries, type safety, traceability, data flow, error handling, risks, and testing expectations. |
| `design-review.md` | Design validation | Limits the review to evidence-backed critical issues and a clear GO/NO-GO decision. |
| `tasks-generation.md` | Task generation | Produces outcome-focused tasks with requirement mappings, dependencies, bounded write scopes, and verifiable evidence. |
| `tasks-parallel-analysis.md` | Task generation and implementation | Allows `(P)` only for genuinely independent tasks and requires task claims to prevent concurrent write conflicts. |
| `requirements-review.md` | Requirements validation | Checks EARS IDs, completeness, testability, cross-cutting behavior, and steering consistency before approval. |
| `tasks-review.md` | Task validation | Checks coverage, DAG order, write scopes, `(P)` safety, verification, evidence, and integration work. |
| `auto-sdd.md` | Automated SDD orchestration | Defines delegated pre-implementation approval, the manual gate, execution waves, interrupted-run recovery, and independent validation. |
| `product-discovery.md` | All discovery phases | Applies the constrained-capacity operating profile, evidence discipline, hard constraints, and GO/PIVOT/STOP rules. |
| `discovery-brainstorm.md` | Opportunity brainstorm | Defines the interactive one-question-at-a-time conversation and feasibility scorecard. |
| `discovery-market-validation.md` | Market validation | Requires current cited competitor, demand, distribution, constraint, and disconfirming evidence. |
| `discovery-business-case.md` | Business viability | Defines self-service model, costs, scenario formulas, break-even, ROI, and conditional viability thresholds. |
| `discovery-product-outline.md` | High-level product design | Defines core loop, flows, MVP slices, operating obligations, measurements, and non-goals. |
| `store-design-readiness.md` | Discovery design policy | Derives cross-store design principles, preserves Apple/Google applicability, defines the weighted score, and makes severe policy risks hard flags. |
| `release-principles.md` | All release phases | Keeps release work project-grounded, researched, evidence-backed, append-only, and safely gated. |
| `release-readiness.md` | Readiness | Defines context-sensitive technical, operational, store, policy, legal, commerce, support, and rollout checks. |
| `release-marketing.md` | Go-to-market and growth | Defines budget-aware organic/paid research, economics, channel tests, and scale/stop decisions. |
| `release-assets.md` | Store and marketing assets | Requires real product captures, reproducible composition, localization, metadata completeness, and current policy validation. |
| `release-measurement-growth.md` | Measurement, observation, growth | Defines funnel/source contracts, cohort snapshots, data quality, experimentation, and downstream scaling evidence. |
| `release-launch.md` | Launch | Defines immutable candidates, staged rollout, incident thresholds, and external-action gates. |

The design workflow selects `design-discovery-light.md` or `design-discovery-full.md` when discovery is needed. Minimal discovery is appropriate only when the design follows verified local patterns and introduces no meaningful dependency, platform, security, or integration uncertainty.

## Validate this repository

```bash
npm test
npm run verify
```

## Install in a project

```bash
node scripts/install.mjs /absolute/path/to/project
```

For a project that already has the framework installed:

```bash
node scripts/install.mjs /absolute/path/to/project --update
```

The installer owns and synchronizes only:

- `.sdd/settings/`;
- `.sdd/tools/`;
- `.claude/commands/sdd/`;
- `.codex/skills/sdd/`;
- `.sdd/adapters/`;
- the content between `<!-- pixel-hop-sdd:start -->` and `<!-- pixel-hop-sdd:end -->` in project `AGENTS.md` and `CLAUDE.md`.

It creates or updates the delimited SDD blocks in project `AGENTS.md` and `CLAUDE.md` while preserving all content outside those blocks. On the first automated update, an existing `## Canonical SDD workflow` section is migrated into a managed block. Invalid or ambiguous markers stop the installation before any target files change.

It never overwrites `.sdd/config.json`, `.sdd/steering/`, `.sdd/specs/`, `.sdd/status/`, or project-owned guidance outside the managed blocks.

It also creates but never overwrites project-owned `.sdd/discoveries/` and `.sdd/releases/` artifacts.

After installation, customize `.sdd/config.json`. The synchronized source snippets remain available under `.sdd/adapters/`.

## Versioning

Framework changes follow semantic versioning:

- patch: clarification or compatible validator fix;
- minor: compatible rule, workflow, template, or tool capability;
- major: lifecycle, schema, or behavioral incompatibility.

Projects should record the installed version in `.sdd/config.json` and update deliberately. Historical specs are migrated additively; their requirements, designs, research, task ledgers, and archives must not be rewritten merely to adopt a new framework version.

## Contribution rule

Reusable behavior belongs here. Project-specific product, architecture, commands, simulator names, deployment identities, and operational status belong in the consuming project's steering and configuration.

## Authorship and license

Copyright 2026 Davi Rodrigues. Original work, authored and maintained by Davi Rodrigues.

Licensed under the Apache License, Version 2.0. See [`LICENSE`](LICENSE) for the full terms and [`NOTICE`](NOTICE) for attribution requirements.

The design decisions behind each version — the problem each mechanism responds to, and where it can be verified in this repository — are recorded in [`HISTORICO.md`](HISTORICO.md); [`CHANGELOG.md`](CHANGELOG.md) records what changed in each release.
