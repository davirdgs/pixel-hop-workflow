# Market Validation

## Hypothesis and falsification criteria

[Restate the exact selected hypothesis and what evidence would invalidate it.]

## Search strategy

[Queries, markets, dates, stores/sites, and evidence limits.]

Record each source with `sdd.mjs source discovery` using `.sdd/settings/schemas/research-source.schema.json`; the canonical example is `.sdd/settings/templates/shared/research-source.json`. The required timestamp field is `captured_at`, not `accessed_at`.

## Demand evidence

| Signal | Supports / contradicts | Strength | Finding and citation | Limitation |
| --- | --- | --- | --- | --- |
| [Signal] | [Direction] | [Strong/Medium/Weak] | [Finding](https://example.com) | [Limit] |

## Competitive landscape

| Alternative | Type | Target and positioning | Price/model | Strength | Repeated complaint or gap | Implication |
| --- | --- | --- | --- | --- | --- | --- |
| [Alternative] | [Direct/indirect/substitute/do nothing] | [Position] | [Current price] | [Strength] | [Gap] | [Meaning] |

## Distribution and willingness-to-pay signals

[Reachable channels, search/community/store evidence, payer behavior, and uncertainty.]

## Constraints and disconfirming evidence

[Platform, policy, data, compliance, cost, incumbent, or behavior evidence against the hypothesis.]

## Store design and policy review

| Platform | Applicable official rules | Finding | Idea score / 100 | Verdict | Hard flag and mitigation |
| --- | --- | --- | ---: | --- | --- |
| Apple | [4.1, 4.2, 4.3 or current equivalents] | [Include 4.3(b) category/differentiation evidence] | [0 or N/A] | [strong/conditional/high_risk/stop/N/A] | [Flag, owner, condition] |
| Google Play | [Spam/repetitive content, functionality/UX, metadata or current equivalents] | [Do not import Apple-only saturation logic] | [0 or N/A] | [strong/conditional/high_risk/stop/N/A] | [Flag, owner, condition] |

The detailed calculation is stored in `store-design-score.json`; policy sources and access dates are stored in `research-sources.jsonl`.

### Apple spam diagnostic

| Track | Risk | Observable evidence | Contrary evidence | Mitigation |
| --- | --- | --- | --- | --- |
| 4.3(a) submission duplication | [low/medium/high/unknown/N/A] | [Code/assets/template/Bundle IDs/portfolio provenance] | [Signals that could look repackaged] | [Action] |
| 4.3(b) market substitutability | [low/medium/high/unknown/N/A] | [Category, closest competitors, core-loop difference] | [Strongest overlap/rejection case] | [Action] |

### Apple closest-comparator matrix

| Alternative | Same promise/job? | Same core loop? | Same input/output? | Same first-value path? | Strong difference | Weak-only difference | Implication |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [App] | [yes/partial/no] | [yes/partial/no] | [yes/partial/no] | [yes/partial/no] | [Mechanic/outcome/data/integration/workflow or none] | [Audience/UI/language/content/AI/peripheral or none] | [Risk] |

- Likely category inferred by a reviewer: [Category and why]
- Explicitly established Apple category: [yes/no + current policy evidence]
- Differentiator visibility: [immediately/before first value/after first value/buried/absent]
- Proof level: [concept/prototype/implemented/implemented and user-validated]
- Adversarial rejection case: [Strongest honest one-sentence case]
- Reviewer case and exact demo path: [One-sentence distinction, credentials/mode, taps, screenshots, pilot evidence]
- Residual subjectivity: [What a reasonable reviewer could still interpret differently]

## Unknowns and cheap experiments

| Unknown | Decision threshold | Experiment | Cash/time cap |
| --- | --- | --- | --- |
| [Unknown] | [Threshold] | [Test] | [Cap] |

## Verdict

- Result: [supports / mixed / contradicts]
- Evidence mode: [desk_only / primary / mixed]
- Confidence: [high / medium / low]
- Decisive evidence: [Summary]
- Required pivot or next test: [Action]
