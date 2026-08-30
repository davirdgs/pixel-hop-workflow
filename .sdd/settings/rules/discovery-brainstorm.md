# Interactive Discovery Brainstorm

## Conversation contract

1. Establish the developer constraints before proposing solutions: available hours, validation cash, build runway, platform capability, reusable assets, excluded domains, preferred markets/languages, and acceptable ongoing operations.
2. Ask one focused question at a time. Summarize material answers back to the user and let them correct the constraint set.
3. Explore problems and underserved jobs before naming features. When the starting point is open-ended, current online opportunity research is allowed, but label it preliminary until market validation.
4. Generate three to five meaningfully different hypotheses. Do not create superficial feature variants of one idea.
5. Stress-test every candidate against the hard constraints in `product-discovery.md` and create only a preliminary `green|yellow|red|unknown` platform triage using `store-design-readiness.md`.
6. Shortlist no more than three candidates, explain trade-offs, and ask the user to explicitly select one. The agent must not silently choose.

## Candidate scorecard

Score each surviving hypothesis from 0 to the listed maximum. Explain every score with known evidence or an explicit assumption.

| Dimension | Maximum |
| --- | ---: |
| Pain frequency and severity | 20 |
| Self-service reach and accessible distribution | 20 |
| Fit with available delivery capacity and reusable capabilities | 20 |
| Low operational, compliance, and variable-cost risk | 15 |
| Plausible self-service monetization | 15 |
| Differentiated wedge and defensibility | 10 |

The score ranks learning priorities; it is not market proof. A hard constraint failure cannot be hidden by a high total.

Keep the feasibility score separate from Store Design Readiness. For each surviving idea, record a preliminary Apple/Google triage and any hard flag without false numeric precision. Apple 4.3(b) must be assessed explicitly for Apple targets; it must be `not_applicable` and must not lower the Google triage for Android-only ideas. Market validation creates the first evidence-backed numeric score.

## Selected hypothesis contract

The selected hypothesis must state: target user, recurring job/problem, current alternative, promised outcome, narrow wedge, likely acquisition path, likely payer and pricing mechanism, riskiest assumptions, cheapest falsification test, and why this is preferable to investing the same capacity in an existing product.
