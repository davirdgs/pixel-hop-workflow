# Market Validation Research

## Research questions

- Does the target problem occur often enough and hurt enough to motivate action?
- Who experiences it, who pays, and what do they do today?
- Which direct, indirect, substitute, manual, and “do nothing” competitors exist?
- What do competitor positioning, pricing, reviews, complaints, and release activity reveal?
- Can the segment be reached through self-service channels at plausible acquisition cost, without a dedicated marketing team?
- Which policy, data, platform, privacy, compliance, or technical constraints could invalidate the product?
- For each target store, is the idea sufficiently distinct, useful, mobile-appropriate, stable, and honestly presentable under current official policies?
- For Apple targets, does competitor/category evidence create a Guideline 4.3(b) risk, and what meaningfully different or improved experience answers it?
- For Apple targets, are there separate 4.3(a) code/asset/template/portfolio signals, and can provenance be documented?
- Would the app's actual name, screenshots, onboarding, and first-value path expose the claimed difference to a time-limited reviewer, or frame it as a generic category variant?
- For Google targets, does the idea risk repetitive content, limited functionality/content, broken functionality, spam, impersonation, or misleading metadata? Do not treat category saturation alone as an Android rejection criterion.
- What evidence contradicts the hypothesis, and what remains unknown?

## Minimum evidence

- Search the current web; do not complete this phase from model memory alone.
- Inspect at least three relevant alternatives when they exist, including substitutes rather than only direct app competitors.
- For Apple targets, build a closest-comparator matrix around the core loop rather than relying on a feature-count list. Include at least one adversarial search intended to find an app that already provides the claimed difference.
- Include at least one demand-side signal and one disconfirming search.
- Verify mutable prices, fees, platform rules, and product availability from current primary sources.
- Read the current official Apple and/or Google policy pages applicable to the recorded target platforms. Record access dates and do not reuse another platform's conclusion as evidence.
- Record each material source using the exact `research-sources.md` contract and cite it near the supported claim in `market-validation.md`.
- Recalculate the idea using `store-design-readiness.md` and persist `store-design-score.json`. Explain every criterion with evidence or an explicit remaining assumption.
- Complete the optional-compatible `apple_spam_assessment` block for new Apple-targeted discoveries. Existing scorecards without the block remain readable, but a newly generated assessment must pass its observable risk, proof, visibility, score-cap, and hard-flag checks.

Do not impose an arbitrary source count when a niche has fewer observable alternatives. Document the search strategy and the evidence gap instead.

## Verdicts

- `supports`: evidence makes continued investment reasonable, while uncertainties remain explicit.
- `mixed`: meaningful positive and negative signals require a bounded experiment or pivot condition.
- `contradicts`: a hard constraint or central demand/monetization assumption lacks support or has credible contrary evidence.

The verdict evaluates the hypothesis, not whether a market category exists.

A high Store Design Readiness score is not market proof or a guarantee of review approval. An unresolved hard flag can make the market verdict `contradicts` or require a bounded pivot even when demand evidence is positive.
