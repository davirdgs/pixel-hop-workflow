# Release Measurement Plan

## Decisions and metric tree

| Decision | Metric and exact definition | Source of truth | Dimensions/cohort | Window/latency | Baseline/target/guardrail/kill threshold | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| [Decision] | [Formula] | [Store/product/backend/finance] | [Platform/channel/locale/version] | [Window] | [Values] | [Owner] |

Cover acquisition opportunity/impression -> listing visit -> install/acquisition -> first open -> consent/onboarding -> activation -> core value -> retention -> paywall/trial -> purchase/renewal/refund/churn, plus crash-free use, latency, support burden, variable cost, and privacy guardrails.

When applicable, also cover:

- referral: eligible -> invite/share -> accepted -> activated -> retained/revenue, including abuse and incremental quality;
- reactivation: eligible dormant cohort -> consented message -> return -> core value, including opt-out, complaints, and incremental lift.

## Event and attribution contract

| Event/conversion | Trigger and required properties | Deduplication/source | Consent/privacy behavior | Platform mapping | Validation evidence |
| --- | --- | --- | --- | --- | --- |
| [Event] | [Contract] | [Owner] | [Behavior] | [Store/ad/product] | [Debug/live proof] |

- Attribution model/windows, deep-link/UTM/campaign taxonomy, organic/direct handling, SKAdNetwork or privacy-sandbox constraints, and cross-platform identity limits: [Explicit]
- Reconciliation cadence across store, ad network, product analytics, subscription/backend, refunds, and finance: [Plan]
- Data-quality alerts for missing, duplicated, delayed, impossible, or consent-violating events: [Plan]

## Monitoring cadence

- Launch room/first hours: [Operational metrics and owner]
- Daily first week, weekly first month, monthly/cohort review: [Decision cadence]
- Dashboard/export locations and access: [Paths, no credentials]
- Small-sample policy: report counts and uncertainty; use `insufficient_data` instead of forced conclusions.
- Baseline ID, comparability, seasonality, candidate/version, channel mix, and concurrent-change limits: [Explicit]
