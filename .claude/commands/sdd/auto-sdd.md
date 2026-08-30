---
description: Generate, validate, auto-approve, and optionally implement a complete SDD spec
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Task, Agent
argument-hint: <user-input> | --implement <feature> | --resume <feature> | --status <feature>
---

Read and execute `.sdd/settings/workflows/_common.md`, then `.sdd/settings/workflows/auto-sdd.md` and its canonical rule. `.sdd/` is canonical; this file is only a Claude adapter. Arguments: `$ARGUMENTS`.

For auto-SDD subagents, resolve the `claude` entry in `auto_sdd.model_selection.provider_catalogs`, persist the exact assignment, and pass its full model ID through the Agent/Task tool's per-invocation `model` parameter. Never omit `model`, use `inherit`, or rely only on subagent frontmatter. Before execution, check `CLAUDE_CODE_SUBAGENT_MODEL` and the effective Claude Code model allowlist: if either would override, exclude, or silently replace the selected model, block unless the effective model is exactly the persisted lowest-adequate assignment.

Apply the canonical adaptive validation profile before spawning: condense hash-identical reviews, batch only independent waves, and reuse a complete single-wave validator only when the persisted `lean` contract allows it. Keep `critical` validation fully independent and use the profile's required final capability; do not hard-code Sonnet/Opus or a universal frontier final pass.

Treat the command's active Claude model only as the coordinator model. It does not replace or influence the explicit per-subagent selection; recommend an advanced coordinator by default and frontier only for exceptional planning risk.

For `--resume`, inspect Task/Agent liveness before mutating state. Use the canonical `sdd.mjs resume` helper with `continue` only when the exact Claude subagent is still live and reattachable; use `recover` for a lost session, preserve its diff, and select a new explicit model. Never abandon a claim that may still belong to a live external process.
