# Release Measurement and Growth

## Funnel and source contracts

Define the project-specific funnel from acquisition opportunity through listing conversion, first open, consent/onboarding, activation, core value, retention, monetization, renewal/refund/churn, and contribution. Include reliability, latency, support, privacy, and variable-cost guardrails.

For every metric specify formula, event/source, deduplication, cohort/segment, attribution and conversion window, time zone, reporting latency, baseline, target, guardrail, kill threshold, and decision owner. Validate critical events end-to-end in debug and production-like paths before launch; verify consent behavior and prevent personal/sensitive data in event properties.

Store/ad/product/backend/finance counts will differ. Document expected reasons and a reconciliation cadence. Never merge iOS and Android, paid and organic, new and returning users, locales, versions, or acquisition cohorts when the aggregate can hide a materially different result.

## Observation

Use predeclared windows: immediate operational safety, first-day activation, first-week quality/retention, and longer monetization/renewal windows appropriate to the product. Compare with a valid baseline and expose counts plus uncertainty. A launch is `stable` only when operational guardrails are healthy and enough data exists for the declared decision; otherwise use `alert` or `insufficient_data`.

## Experiments

Prioritize the measured bottleneck. Each experiment has one primary hypothesis, immutable audience/variant, primary metric, guardrails, sample/run plan, budget/capacity cost, and scale/iterate/stop rule. Preserve every result as `win`, `loss`, `inconclusive`, or `invalid`. Avoid simultaneous changes that make learning uninterpretable, and use holdouts or geographic/time baselines when platform constraints prevent ideal randomization.

Scaling requires downstream cohort quality, contribution/payback, reliability/privacy health, capacity, saturation/creative-fatigue monitoring, and an incrementality argument. Pause when data is invalid, the product is harmed, support load is unsafe, or budget/runway limits are reached.
