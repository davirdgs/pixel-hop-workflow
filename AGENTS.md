# Pixel Hop Workflow — Codex Guide

This repository is the canonical source for Pixel Hop's reusable SDD and AI-agent workflow. It is not a product repository.

## Source hierarchy

1. `.sdd/settings/lifecycle.md` defines lifecycle semantics.
2. `.sdd/settings/workflows/` defines tool-independent workflows.
3. `.sdd/settings/rules/` and templates define quality and artifact contracts.
4. `.sdd/tools/` enforces machine-checkable invariants.
5. `.claude/` and `.codex/` are thin adapters and must not redefine the core.

## Change discipline

- Keep the core free of project names, bundle IDs, simulator names, credentials, deployment identities, and operational status.
- Put reusable iOS, Android, backend, Firebase, analytics, attribution, and funnel guidance in the framework.
- Put product-specific decisions in consuming-project steering/configuration.
- Preserve backward compatibility when practical. Lifecycle/schema breaking changes require a major version.
- Update `VERSION`, `package.json`, README, schemas/templates, tests, and installer behavior together when applicable.
- Do not add example specs from real products; use synthetic fixtures.
- Keep Claude and Codex adapters behaviorally equivalent.

## Required validation

Run the full validation suite when files changed by the current task affect framework behavior, distribution, adapters, schemas/templates, tooling, the installer, version metadata, or tests:

```bash
npm test
npm run verify
node scripts/install.mjs /private/tmp/pixel-hop-workflow-smoke --dry-run
```

For documentation-only changes made exclusively under `docs/` that do not alter executable or distributed behavior, review the Markdown structure, links, and Mermaid syntax as applicable, then run only `git diff --check`. The full validation suite is not required. Unrelated pre-existing worktree changes do not widen the validation scope of a documentation-only task.

Run `git diff --check` before finishing every change. Lead reviews with concrete compatibility, lifecycle, migration, or adapter-parity defects.
