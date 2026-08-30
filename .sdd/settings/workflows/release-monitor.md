# Workflow: release-monitor

1. Follow `_common.md`, `release-principles.md`, and `release-measurement-growth.md`; require a launched release and load its measurement/launch plans plus current store, campaign, product, backend/commerce, crash/performance, support, cost, and finance data.
2. Append a schema-valid timestamped record to `metrics-snapshots.jsonl` for each declared observation window. Bind it to release and candidate digest; preserve snapshot ID, source/time-zone/latency, counts and denominators, cohorts/dimensions, spend/revenue/refund/cost, reliability/support guardrails, missing data, uncertainty, and baseline ID.
3. Reconcile expected differences between sources and investigate broken/duplicated/delayed events before interpreting movement. Compare against a valid pre-release or organic baseline; never blend cohorts that materially differ.
4. Evaluate predeclared stop/rollback/expansion thresholds. Escalate operational, privacy/security, purchase/entitlement, data-loss, or budget guardrails immediately and execute only already-authorized reversible actions.
5. Set observation to `stable`, `alert`, or `insufficient_data`, with evidence and the next decision time. When operational windows are healthy and enough downstream data exists, advance to growth. Run SDD lint.
6. This workflow is a snapshot, not an unattended monitor. Use the environment's recurring monitoring mechanism when continuous waiting was explicitly requested.
7. Maintain a derived cursor/rollup for status and monitoring reads. Never rewrite the append-only snapshots.
