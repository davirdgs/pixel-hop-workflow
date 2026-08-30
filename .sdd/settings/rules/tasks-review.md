# Tasks Review

Review generated tasks before approval.

## Blocking checks

- Every numeric acceptance criterion is mapped exactly once or intentionally across tasks, or has a valid `coverage.json` disposition and rationale.
- Tasks follow the approved design contracts and do not introduce requirements or architecture that were never approved.
- Dependencies form an executable acyclic order; integration work is not scheduled before its prerequisites.
- Every actionable task has requirements, dependencies, bounded write scope, verification strategy, and expected evidence.
- `(P)` tasks have truly non-overlapping write scopes and no hidden data, contract, environment, or review dependency.
- Task groups are small enough for isolated execution and independent verification, while avoiding artificial fragmentation.
- Required integration, regression, migration, rollback, device, console, and external-boundary checks are represented.

Return GO only when coverage, ordering, execution safety, and verification are complete. Cite task and requirement IDs for every finding. Validation does not approve the artifact.
