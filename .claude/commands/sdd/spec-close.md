---
description: Close an obsolete or cancelled spec without implementation validation
allowed-tools: Bash, Read, Glob, Grep
argument-hint: <feature> <obsolete|superseded|cancelled|duplicate|no-longer-needed> [note]
---

Read and execute `.sdd/settings/workflows/_common.md`, then `.sdd/settings/workflows/spec-close.md`. This is a deterministic metadata-only transition: do not spawn subagents or repair historical artifacts. `.sdd/` is canonical; this file is only a Claude adapter. Arguments: `$ARGUMENTS`.
