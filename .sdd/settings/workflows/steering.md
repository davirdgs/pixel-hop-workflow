# Workflow: steering

1. Load `.sdd/config.json`, steering principles, all existing steering files, and live code/configuration relevant to detected drift.
2. Preserve durable product, architecture, security, testing, deployment, and cross-repo patterns.
3. Move volatile counts, temporary parity status, rollout progress, and spec execution state out of steering.
4. Update additively where possible, but remove demonstrably stale contradictions and broken links.
5. Finish with link checks, contradiction searches, and `sdd lint`.
