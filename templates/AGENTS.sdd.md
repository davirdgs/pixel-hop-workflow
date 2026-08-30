## Canonical SDD workflow

- `.sdd/settings/workflows/` is the canonical, tool-independent SDD source.
- Start by reading `.sdd/config.json`, `.sdd/settings/workflows/_common.md`, and the matching workflow.
- Load context from `config.context.always` plus the target spec's `context_profiles`.
- Follow `.sdd/settings/lifecycle.md`; update canonical lifecycle state before compatibility mirrors.
- Run `node .sdd/tools/sdd.mjs lint` before completing mutating SDD workflows.
- Claim parallel tasks and write scopes before editing. `(P)` is eligibility, not ownership.
- Append evidence before marking tasks complete or releasing their claims.
- Preserve unrelated worktree changes and historical spec artifacts.
- Product discovery lives under `.sdd/discoveries/`, uses the `discovery-*` workflows, and may promote findings to `spec-init` only after an explicit user GO.
- Keep product discovery on the `single-mobile-indie` profile; vary validation depth proportionally without inventing additional profiles.
- GO/NO-GO reviews are advisory. Record any explicit human override with the canonical helper, actor, timestamp, rationale, and current hash where applicable; overrides never fabricate execution or external evidence.
- Post-SDD release and growth work lives under `.sdd/releases/`, uses the `release-*` workflows, and requires current project/store/channel evidence plus explicit publication and paid-media gates.
- `auto-sdd` may auto-approve validated pre-implementation artifacts, but must stop at its hash-bound implementation gate; approved execution uses adaptive `lean|standard|critical` independent validation, token budgets, and explicit persisted lowest-adequate subagent models rather than inherited defaults.
- Resume an interrupted approved auto-SDD run with `--resume`: reattach a provably live agent in the same attempt, or recover a lost session with a new attempt while preserving and auditing its diff.
- Close obsolete, cancelled, superseded, duplicate, or no-longer-needed specs with `spec-close`. This is a metadata-only terminal transition: do not spawn subagents, repair old artifacts, or run implementation validation.
