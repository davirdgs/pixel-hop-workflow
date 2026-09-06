# Pixel Hop Workflow

[![Validate SDD framework distribution](https://github.com/davirdgs/pixel-hop-workflow/actions/workflows/validate.yml/badge.svg)](https://github.com/davirdgs/pixel-hop-workflow/actions/workflows/validate.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

**A spec-driven workflow for building software with AI agents — where the written spec is the source of truth, and humans keep the decisions that matter.**

AI agents can write a lot of code very quickly. The hard part is no longer typing it: it is
deciding *what* to build, describing it precisely enough for an agent to get it right, and
proving afterwards that the result actually does what was asked.

Pixel Hop Workflow is a set of workflows, rules, and small tools that give agents a process to
follow. It works with [Claude Code](https://claude.com/claude-code) and Codex, and it is built so
that both read the same rules instead of each inventing its own version of the process.

---

## What it does

The framework covers three connected stages of product work:

```
   DISCOVER               BUILD                    RELEASE
   should we build it?    build it correctly       ship it and learn
   ─────────────────      ──────────────────       ──────────────────
   explore ideas          write requirements       readiness check
   check the market       design it                store assets
   run the numbers        break into tasks         measurement
   define the MVP         implement + validate     staged launch
   decide GO/PIVOT/STOP   done                     growth experiments

        └── an idea only moves forward when a human says so ──┘
```

Each stage is optional and separate. You can adopt only the build stage, or start earlier at
discovery, or continue into release.

## Why it exists

Three ideas shape everything in this repository:

**The spec is the contract.** Agents plan and implement from a written, versioned specification —
not from a chat history. If the spec changes, approvals that depended on it stop being valid.

**Humans approve; agents recommend.** Agents produce GO/NO-GO opinions, and you can overrule them.
But an override is recorded with who decided and why, and it can never invent a passing test, a
finished launch, or evidence that does not exist. You can accept risk; you cannot fake facts.

**Claims carry their sources.** Market and business research is appended to a validated log where
each entry records the source, the date, the claim, and whether that source *supports*,
*contradicts*, *constrains*, or merely *contextualizes* the idea. Contrary evidence is recorded
with the same care as favourable evidence, and missing evidence is never treated as proof of demand.

## Getting started

You need Node.js 22 or newer. Install the framework into your project:

```bash
node scripts/install.mjs /absolute/path/to/your/project
```

Then, from inside your project, start by giving the agents context about your codebase:

```
/sdd:steering
```

And build your first feature:

```
/sdd:auto-sdd "add offline caching to the recipe list"
```

The agent will write requirements, design, and a task plan — then stop and wait for you. Nothing is
implemented until you explicitly approve:

```
/sdd:auto-sdd --implement <feature>
```

To update an existing installation later, run the installer with `--update`. It only touches the
framework's own files and never overwrites your specs, steering, or configuration.

## Main commands

| Command | What it does |
| --- | --- |
| `/sdd:steering` | Teaches the agents about your project: architecture, conventions, product direction. |
| `/sdd:auto-sdd "<request>"` | Takes a request through requirements, design, and tasks — then stops for your approval. |
| `/sdd:auto-sdd --implement <feature>` | Runs the approved implementation in dependency-ordered waves, with independent review. |
| `/sdd:auto-sdd --resume <feature>` | Safely picks up an interrupted run, after auditing what really happened. |
| `/sdd:spec-status <feature>` | Read-only: current phase, approvals, blockers, and the next valid step. |
| `/sdd:spec-close <feature> <reason>` | Closes work that will not continue, without pretending it was finished. |
| `/sdd:discovery-*` | The pre-build stage — see the table below. |
| `/sdd:release-*` | The post-build stage: readiness, assets, marketing, measurement, launch, growth. |

Every command is also available to Codex through the equivalent skill.

### Discovery commands

Run these in order when you want to test an idea before committing to build it. Each one produces
an artifact under `.sdd/discoveries/<name>/`, and only the last one can clear the idea for
development.

| Command | What it does | You end up with |
| --- | --- | --- |
| `/sdd:discovery-brainstorm <problem space>` | Asks about your constraints — hours per week, budget, deadline — then explores problems and lays 3–5 ideas side by side, each with a first read on feasibility and app store risk. **You pick which one goes forward.** | A shortlist and your chosen hypothesis, with the reason for the choice. |
| `/sdd:discovery-validate <name>` | Searches for current evidence: real demand, who else is doing it, substitutes, pricing, how you would reach people, and what could block you. Evidence *against* the idea is recorded with the same weight as evidence for it. | A cited research log, plus the strongest case against your idea. |
| `/sdd:discovery-business <name>` | Works out the money: costs, contribution, break-even, cash needed, payback, and return — in a pessimistic, a base, and an optimistic scenario. Guesses stay labelled as guesses. | A business case where facts and estimates are clearly separated. |
| `/sdd:discovery-product <name>` | Defines the smallest version worth shipping: the core loop, the essential flows, how it makes money, what you will measure — and what you are explicitly *not* building. | A product outline where every decision points back to evidence. |
| `/sdd:discovery-decide <name>` | Checks the previous artifacts for contradictions, gives you a recommendation, and asks for your call: **GO**, **PIVOT**, or **STOP**. Your decision is recorded even when it disagrees with the recommendation. | A decision on record. Only an explicit GO makes the idea eligible for development. |
| `/sdd:discovery-status <name>` | Read-only: where the idea stands, what is missing, and the next valid step. Changes nothing. | A status report. |

A GO does not start development on its own. Promoting an idea into a spec is a separate, deliberate
step:

```
/sdd:spec-init --from-discovery <name> "<feature description>"
```

Both sides record where the work came from, so you can always trace a feature back to the evidence
that justified it.

## How the repository is organised

```
.sdd/settings/     the framework itself — workflows, rules, templates, schemas
.sdd/tools/        small Node scripts: linting, status, evidence, overrides
.claude/  .codex/  thin adapters, so both agents follow the same rules
scripts/           installer and distribution checks
docs/              reference material and the project's history
```

The adapters translate command syntax for each agent, but they never redefine how the process
works. That lives in `.sdd/settings/`.

## Documentation

- **[Reference](docs/reference.md)** — the complete behavioural contract: every workflow, rule,
  gate, and lifecycle, in detail.
- **[HISTORICO.md](HISTORICO.md)** — why the framework looks the way it does: the problem behind
  each version and where to verify it in the code.
- **[CHANGELOG.md](CHANGELOG.md)** — what changed in each release.
- **[docs/desenvolvimento-pixel-hop-framework.md](docs/desenvolvimento-pixel-hop-framework.md)** —
  a technical account of how the framework evolved (in Portuguese).

## Contributing

Reusable behaviour belongs in this repository. Anything specific to one product — its architecture,
commands, deployment identities, or current status — belongs in that project's own steering and
configuration.

Before opening a pull request:

```bash
npm test        # framework and installer tests
npm run verify  # distribution completeness
```

Versions follow semantic versioning: a patch clarifies or fixes, a minor adds compatible
capability, and a major changes the lifecycle, a schema, or existing behaviour. Existing specs are
migrated additively — their history is never rewritten just to adopt a newer version.

## Authorship and license

Copyright 2026 Davi Rodrigues. Original work, authored and maintained by Davi Rodrigues.

Licensed under the Apache License, Version 2.0. See [`LICENSE`](LICENSE) for the full terms and
[`NOTICE`](NOTICE) for attribution requirements.
