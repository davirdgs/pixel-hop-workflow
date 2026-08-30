# Release Readiness Review

Build the checklist from the actual project rather than copying a universal list. At minimum inspect:

- scope, validated requirements, excluded/deferred behavior, exact build/commit, supported platforms/versions/devices, localization, accessibility, migration/upgrade, destructive flows, offline/error behavior, and regression evidence;
- production/stage identity separation, signing, secrets, APIs, database migrations, backward compatibility, feature flags, kill switches, quotas, variable cost, backups, rollback, and dependency failure modes;
- crash/performance/analytics readiness, alert ownership, dashboards, support intake, incident response, status/communications, review-response path, and developer availability across the launch window;
- store account roles/agreements, tax/banking, product/pricing configuration, subscriptions/IAP, purchase/restore/entitlement/refund behavior, review credentials/notes, export/content/age declarations, privacy/data-safety disclosures, permissions, tracking consent, account/data deletion, and public legal/support/marketing URLs;
- localized listing copy/assets, current platform specifications, landing/deep links, campaign attribution, ASO/search discoverability, rollout sequencing, store-review lead time, and monitoring/stop criteria.

Each item is `BLOCKER`, `REQUIRED`, `FOLLOW-UP`, or `NOT-APPLICABLE`, with owner, due date, evidence, and rationale. A readiness verdict is `READY` only when no blocker remains. External work may remain only if it is intentionally scheduled before launch and the release stays blocked until evidence exists.
