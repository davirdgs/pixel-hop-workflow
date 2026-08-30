# Workflow: discovery-validate

1. Follow `_common.md`, `product-discovery.md`, `discovery-market-validation.md`, `research-sources.md`, and `store-design-readiness.md`.
2. Require `lifecycle.brainstorm=selected`; otherwise return to the unresolved brainstorm question.
3. Restate the selected hypothesis and falsification criteria before research. Set market validation to `in_progress`.
4. Search the current web using multiple queries for demand, competitors, substitutes, pricing, complaints, distribution, and disconfirming evidence. Open and inspect the material sources.
5. Review current official policies for every target store. For Apple targets assess Guidelines 4.1, 4.2, and 4.3; diagnose 4.3(a) provenance/duplication separately from 4.3(b) market substitutability. Build the closest-comparator matrix, classify differences, test first-value visibility, record proof level, and write the adversarial rejection case. For Google targets assess repetitive content, functionality/content/user experience, metadata, impersonation, and deceptive behavior as applicable. Keep platform conclusions separate.
6. Append claim-level source records with `sdd.mjs source discovery` using the exact shared source contract; never delete earlier records. If manual append is unavoidable, copy the shared template and run SDD lint after the first record before continuing. Write the analysis to `market-validation.md` with citations near claims.
7. Recalculate the platform scores from evidence, create `store-design-score.json`, complete `apple_spam_assessment` for Apple targets (or `null` otherwise), and verify weighted totals, verdicts, applicability, risk-based score caps, and hard flags.
8. Compare alternatives consistently, distinguish evidence from inference, and list unknowns plus the cheapest tests that would resolve them.
9. Record `evidence_mode=desk_only|primary|mixed`. Desk-only evidence cannot be presented as direct validation of user desire; identify the cheapest primary test for every critical desirability assumption.
10. Maintain stable assumption IDs in `assumptions.jsonl`, including category, impact, uncertainty, evidence references, decision threshold, state, and expiry.
11. Set the verdict to `supports`, `mixed`, or `contradicts`, advance phase to `business_case`, update metadata, and run SDD lint.
12. A contradictory verdict is not silently overridden. Recommend `/sdd:discovery-decide <discovery>` to stop or pivot. The user may explicitly pass the gate with `sdd.mjs override discovery <name> market_validation go <actor> --reason <reason>`; preserve the contrary evidence and override history.
