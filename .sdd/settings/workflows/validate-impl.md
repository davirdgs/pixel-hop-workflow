# Workflow: validate-impl

1. Follow `_common.md`; use explicit feature/task arguments or persisted lifecycle state. Never infer the target from conversation history.
2. Validate task completion, requirement coverage/dispositions, design alignment, declared evidence, targeted tests, and relevant regression suites.
3. Verify integrations across iOS, Android, backend, Firebase, analytics, attribution, and environment boundaries when they are in scope.
4. Write or update `validation.md` and append machine-readable evidence to `evidence.jsonl`.
5. Decide `passed`, `failed`, or `partial`; explain every unverified boundary.
6. Set implementation to `validated` only on `passed`. Set phase to `complete` only when all required tasks and coverage dispositions are closed.
7. In auto-SDD wave mode (`--wave <id>`), validate only that persisted wave and return a read-only structured report to the coordinator. Do not advance global implementation/validation lifecycle while later waves remain. The coordinator records wave evidence/status after confirming the validator did not implement or fix that wave.
