# Pixel Hop Workflow — Claude Guide

This repository is the canonical source for Pixel Hop's reusable SDD and AI-agent workflow. It contains framework behavior, not product steering or feature specs.

## Canonical layers

- Lifecycle: `.sdd/settings/lifecycle.md`
- Workflows: `.sdd/settings/workflows/`
- Rules/templates/schemas: `.sdd/settings/`
- Enforcement: `.sdd/tools/`
- Claude/Codex integration: thin adapters only

Never implement new workflow semantics only inside `.claude/commands/sdd/`. Change the canonical `.sdd/` workflow first, then keep adapters as references to it.

## Portability rules

- Do not add real project names, paths, bundle IDs, credentials, environment identities, or current rollout status.
- Reusable guidance may assume native iOS, native Android, backend services, Firebase, analytics, attribution, and sales funnels.
- Project-specific decisions belong in the consuming project's `.sdd/config.json` and steering.
- Preserve historical specs during migrations; enrich metadata instead of rewriting artifacts.
- Treat lifecycle/schema incompatibility as a major-version change.

## Required validation

Run `npm test`, `npm run verify`, an installer smoke test, and `git diff --check` when files changed by the current task affect framework behavior, distribution, adapters, schemas/templates, tooling, the installer, version metadata, or tests.

For documentation-only changes made exclusively under `docs/` that do not alter executable or distributed behavior, review the Markdown structure, links, and Mermaid syntax as applicable, then run only `git diff --check`. Unrelated pre-existing worktree changes do not widen the validation scope of a documentation-only task.

Run `git diff --check` before finishing every change.
