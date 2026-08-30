# Release and Growth Principles

## Scope and truth

- Release management is a separate post-SDD lifecycle under `.sdd/releases/<release>/`; it never changes approved spec history.
- Ground every plan in live repository/configuration, validated specs, the exact candidate build, store-console state, public/legal surfaces, product economics, target markets, developer capacity, and confirmed budget.
- Keep framework guidance generic. Product names, bundle/package IDs, accounts, credentials, deployment identities, operational status, dates, and chosen channels belong in the consuming project.
- Do not infer production readiness from green unit tests or from a previously shipped version. Record device, credential, console, review, legal, banking/tax, and rollout boundaries explicitly.

## Research and claims

- Consult current official platform/store/ad-network documentation for mutable formats, policies, fees, eligibility, measurement, privacy, and submission behavior.
- For channel economics and market practice, combine primary platform facts with current independent benchmarks where useful. Record every source using the exact `research-sources.md` contract, including `captured_at`, title, direction, claim, market/sample limits, and project relevance.
- Benchmarks are priors, not forecasts. Never name a universal “best ROI” channel; rank reachable project-specific tests using audience intent, creative fit, conversion quality, contribution/LTV range, budget, learning threshold, attribution limits, capacity, and downside.
- Public copy and creative must be traceable to shipped behavior and evidence. Do not invent results, endorsements, scarcity, UI, integrations, or functionality.

## Budget and external-action safety

- Never invent budget, runway, target CAC/ROAS, desired return, launch date, countries, or support capacity. Ask only when a missing value changes the decision; otherwise use clearly labeled ranges.
- Planning does not authorize submission, production mutation, public communication, price change, credential use, or ad spend.
- Publication requires the hash-bound `launch_gate` plus fresh readiness checks. Paid media requires separate explicit approval naming channel, currency, hard cap, dates, and stop rules even when the publication gate is approved.
- Prefer reversible staged rollout, capped experiments, feature flags, and owned/organic validation before scaling irreversible or high-cost actions.

## Measurement and growth

- Define metrics as decision contracts with numerator, denominator, source, cohort, dimensions, window, latency, baseline, target, guardrail, and owner.
- Reconcile store, campaign, product, subscription/backend, refund, cost, and finance sources without pretending their attribution models or time zones are identical.
- Optimize for downstream value and contribution, not vanity metrics. CPI, CTR, installs, or aggregate revenue alone cannot justify scaling.
- Preserve append-only metric snapshots, experiment results, source research, evidence, and history. Mark small or broken samples `insufficient_data` or `invalid`; do not manufacture significance.
- Fix product value, retention, reliability, privacy, or monetization bottlenecks before buying more traffic into them.
