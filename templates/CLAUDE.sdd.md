## Canonical SDD workflow

- `.sdd/settings/workflows/` is the canonical SDD source; `.claude/commands/sdd/` contains thin adapters only.
- Start by reading `.sdd/config.json`, `.sdd/settings/workflows/_common.md`, and the matching workflow.
- Load context from `config.context.always` plus the target spec's `context_profiles`.
- Do not define a lifecycle or approval interpretation different from other agents.
- Run `node .sdd/tools/sdd.mjs lint` before completing mutating SDD workflows.
- Claim parallel tasks and write scopes before editing. `(P)` is eligibility, not ownership.
- Append durable evidence before marking work complete or releasing a claim.
- Product discovery lives under `.sdd/discoveries/`; use current cited research for its market and business phases and require an explicit user decision before SDD promotion.
- Keep product discovery on the `single-mobile-indie` profile; vary validation depth proportionally without inventing additional profiles.
- GO/NO-GO reviews are advisory. Record any explicit human override with the canonical helper, actor, timestamp, rationale, and current hash where applicable; overrides never fabricate execution or external evidence.
- Post-SDD release and growth work lives under `.sdd/releases/`; keep planning project-grounded and obey separate explicit publication and paid-media gates.
- In `auto-sdd`, stop before implementation until the explicit hash-bound plan/model/validation-policy gate is approved; then use Task/Agent subagents with separate executor/validator roles, adaptive `lean|standard|critical` validation, token budgets, and explicit persisted lowest-adequate models while the coordinator alone writes SDD ledgers.
- For `--resume`, reattach only a provably live Task/Agent in the same attempt; recover a lost session through the canonical helper, preserve its diff, increment the attempt, and reverify before independent validation.
- For Claude subagents, select from `auto_sdd.model_selection.provider_catalogs.claude` and pass the full model ID with the per-invocation `model` parameter. Never use `inherit` or omit the model. Block if `CLAUDE_CODE_SUBAGENT_MODEL` or an effective model allowlist would replace the persisted assignment.
- Route requests to close obsolete, cancelled, superseded, duplicate, or no-longer-needed specs to `spec-close`. It is metadata-only and must not spawn subagents, repair historical artifacts, or run implementation validation.
