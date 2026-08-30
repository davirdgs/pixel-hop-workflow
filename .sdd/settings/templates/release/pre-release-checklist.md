# Pre-release Checklist

Status legend: `BLOCKER`, `REQUIRED`, `FOLLOW-UP`, `NOT-APPLICABLE`. Every unchecked item has an owner, due date, evidence path, and rationale.

## Scope and quality

- [ ] [BLOCKER] Release scope is bound to validated specs, commit/build, supported OS/devices, countries, and locales.
- [ ] [BLOCKER] Required automated suites and production-like smoke tests pass; external/device boundaries are explicit.
- [ ] [REQUIRED] Accessibility, localization, performance, offline/error, upgrade/migration, and destructive-flow checks are complete where applicable.

## Production and operations

- [ ] [BLOCKER] Production identities, signing, secrets, APIs, backend, migrations, flags, quotas, and environment separation are verified.
- [ ] [BLOCKER] Crash/performance monitoring, alert ownership, dashboards, support intake, incident response, rollback/kill switch, and backup/restore are ready.
- [ ] [REQUIRED] Staged rollout, capacity/cost guardrails, dependency health, and third-party failure behavior are documented.

## Store, policy, trust, and commerce

- [ ] [BLOCKER] Store agreements, account roles, banking/tax status, age/content declarations, privacy disclosures, data safety/nutrition labels, permissions, export/compliance, and review credentials are current.
- [ ] [BLOCKER] Terms, privacy, support, marketing URLs, deletion path, consent, tracking disclosure, and public product claims agree with the shipped behavior.
- [ ] [BLOCKER] Products/prices, trials/offers, purchase, restore, entitlement, receipt/server verification, refund/support, and sandbox-to-production boundaries are verified where applicable.

## Listing and launch

- [ ] [BLOCKER] Localized metadata, screenshots/previews, icon/feature art, release notes, category/tags/keywords, reviewer notes, and demo access are validated against current store rules.
- [ ] [BLOCKER] Measurement plan is live and validated end-to-end before acquisition spend.
- [ ] [REQUIRED] Launch calendar, communications, landing/deep links, campaign attribution, monitoring windows, stop conditions, and approval owners are ready.

## Decision

- Remaining blockers: [List]
- Accepted follow-ups and owner/date: [List]
- Readiness verdict: [READY / BLOCKED]
- Evidence summary: [Commands, consoles, devices, URLs, and boundaries]
