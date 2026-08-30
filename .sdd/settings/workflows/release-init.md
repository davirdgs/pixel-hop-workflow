# Workflow: release-init

1. Follow `_common.md`, `release-principles.md`, and `release-readiness.md`.
2. Require a kebab-case release name. Read `.sdd/config.json`, live steering/code/release automation, target store/platform configuration, and the validated source specs named by the user. Do not assume the last spec or chat context is the release scope.
3. If named source specs are not complete with passed validation, record the exact boundary and keep readiness blocked. A brownfield product without framework specs may proceed only with an explicit immutable build/commit baseline and equivalent validation evidence.
4. Create `.sdd/releases/<release>/` from `templates/release/`, including `release.json`, `release-context.md`, and `pre-release-checklist.md`. Persist the immutable candidate (`commit`, version, build, artifact digest, environment, verified time), structured scope (platforms, storefronts, markets, locales), owner capacity, budget constraints, context profiles, and source-spec provenance in `release.json`.
5. Inspect the live project to customize the checklist categories, owners/evidence paths, and `NOT-APPLICABLE` rationale. Do not mark console/device/legal/credential work complete by inspection alone.
6. Leave the launch gate pending, set readiness to `in_progress` or `blocked`, append history, and run SDD lint. Report the smallest next valid workflow.
