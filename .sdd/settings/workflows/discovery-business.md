# Workflow: discovery-business

1. Follow `_common.md`, `product-discovery.md`, `discovery-business-case.md`, and `research-sources.md`.
2. Require completed market validation. If it contradicts the hypothesis, require the user to acknowledge the evidence and record why business modeling is still useful.
3. Ask only for material missing inputs that cannot be researched or represented as a range. Never invent the developer's budget, desired return, available time, conversion, churn, or acquisition cost.
4. Research current mutable store fees, program eligibility, taxes/policy boundaries, and third-party prices that materially affect the model. Append sources with `sdd.mjs source discovery` using the shared source contract.
5. Write `business-case.md`: business model, payer/value/paywall, cost ledger, editable assumptions, downside/base/upside calculations, break-even sensitivity, validation experiments, and opportunity-cost comparison with existing products.
6. Set the verdict to `viable`, `conditional`, or `unviable`, advance phase to `product_outline`, update metadata, and run SDD lint.
7. For `conditional`, persist every viability threshold and its cheapest test. For `unviable`, recommend pivot/stop rather than hiding the result with an upside scenario.
8. The user may explicitly override the GO/NO-GO recommendation with `sdd.mjs override discovery <name> business_case <go|no-go> <actor> --reason <reason>`. Preserve the model and its adverse evidence unchanged.
