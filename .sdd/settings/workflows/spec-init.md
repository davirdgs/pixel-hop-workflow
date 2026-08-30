# Workflow: spec-init

1. Follow `_common.md` startup rules and load the spec initialization templates.
2. Derive a unique kebab-case feature name from the request.
3. Create only `spec.json` and `requirements.md`; do not generate requirements, design, or tasks.
4. Set schema v2 lifecycle to requirements/draft and declare relevant `context_profiles` from `.sdd/config.json`.
5. Preserve strict phase separation and report `/sdd:spec-requirements <feature>` as the next action.
6. When invoked with `--from-discovery <discovery>`, require a completed GO with `promotion=eligible`, add `source_discovery` metadata to the new spec, then set the discovery promotion to `created` and `promoted_spec` to the feature name. Discovery artifacts remain unapproved context; do not copy them into generated requirements.
