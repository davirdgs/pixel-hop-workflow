# Store Design Readiness

Use current official store policies as product-design constraints during discovery. This score is a planning heuristic, not a guarantee of review approval. Store policies change, and reviewers retain discretion.

## Platform applicability

- Apply Apple App Review Guidelines only when iOS, iPadOS, or another Apple App Store platform is targeted.
- Apple Guideline 4.3(b) is an Apple-specific rejection risk: an app that is indistinguishable from widely available apps, especially in an established category, needs a meaningfully different or improved experience. Do not penalize an Android-only idea merely because its category is saturated under Apple's examples.
- For Google Play, assess the current policies on repetitive content, limited functionality/content, broken functionality, spam, impersonation, deceptive behavior, and store metadata. Google requires distinct user value and a stable, engaging mobile experience, but category saturation alone is not an independently stated rejection rule.
- When both platforms are targeted, score each independently. The cross-platform score is the lower targeted-platform score so that a platform-specific risk is not hidden by an average.

## Apple spam diagnostic: separate 4.3(a) from 4.3(b)

Do not use a single subjective "spam/not spam" judgment. Assess two independent tracks:

| Track | Question | Observable signals |
| --- | --- | --- |
| Apple 4.3(a): submission duplication | Could the binary, assets, metadata, template provenance, account portfolio, or multiple Bundle IDs make this look like a repackaged or repeated submission? | Shared or purchased template; substantially identical code/assets; white-label variants; one app per location/client; similar apps across the same or related accounts; uncertain provenance. |
| Apple 4.3(b): market substitutability | Could a reviewer reasonably describe the product as indistinguishable from apps already widely available, especially in an established category? | Same user promise, core loop, primary inputs/outputs, first-value path, and reason to return as close competitors; differentiation limited to theme, UI polish, language, content volume, demographic niche, or peripheral features. |

A clean 4.3(a) assessment does not lower 4.3(b) risk. Original code and a custom UI can still produce a highly substitutable product. Conversely, category saturation alone is not evidence of shared code or duplicate submissions.

## Evidence-based 4.3(b) assessment

Reduce reviewer subjectivity by completing these checks for every Apple-targeted idea:

1. **Category framing** — write the category a reviewer is most likely to infer from the app name, subtitle, first screenshots, onboarding promise, and dominant functionality. Do not use the category the team wishes Apple would infer.
2. **Closest-comparator matrix** — compare at least three current App Store alternatives when they exist. Compare target job, promise, core loop, input, output, first-value path, reason to return, monetization, and store presentation. Search explicitly for a comparator that disproves the claimed uniqueness.
3. **Difference classification** — classify each difference as:
   - `strong`: different core mechanic, materially different user outcome, exclusive/proprietary data, unique integration, or a recurring workflow competitors do not provide;
   - `supporting`: business model, trust model, accessibility, privacy, or operational design that materially changes the experience but is not sufficient alone;
   - `weak`: audience niche alone, cosmetic UI, branding, language, more content, generic AI, or a peripheral feature attached to the same core loop.
4. **Reviewer-visible test** — state whether the strongest difference is visible `immediately`, `before_first_value`, `after_first_value`, `buried`, or `absent`. Assume the reviewer may stop after onboarding if access, metadata, or the first path does not expose it.
5. **Proof level** — mark the differentiator as `concept_only`, `prototype`, `implemented`, or `implemented_and_user_validated`. A prose claim does not prove a different experience.
6. **Adversarial rejection case** — write the strongest honest one-sentence case Apple could use to call the app substitutable, then answer it with product evidence rather than adjectives.
7. **Reviewer dossier** — prepare a one-sentence differentiation claim, the closest-comparator table, the exact demo path, credentials/demo mode, screenshots that lead with the distinction, and any pilot evidence. This is a product requirement because a difference the reviewer cannot reach or understand may not affect review.

### Risk decision table

| Risk | Observable decision rule |
| --- | --- |
| `high` | The inferred category is one Apple explicitly calls established/low-value and the core difference is absent, weak, or buried; or close competitors share the same core loop and only weak differences are evidenced; or 4.3(a) provenance/duplicate-submission signals remain unresolved. |
| `medium` | A strong difference is plausible but still concept-only, is visible only after first value, lacks a credible comparator search, or metadata/onboarding still frames the app as a generic category variant. |
| `low` | Current comparator evidence supports at least one strong core difference, it is visible by first value, it is demonstrable in a prototype or stronger artifact, and the reviewer dossier can make the case without relying on unsupported claims. |
| `unknown` | The likely category, close competitors, core loop, visibility, or proof level has not been researched. Unknown is uncertainty, not safety. |

For the Apple `platform_policy_fit` criterion, use the worse of the 4.3(a) and 4.3(b) risks and cap the 0–5 score at 5 for low risk, 3 for medium, 2 for unknown, and 1 for high. A high risk on either track is a hard flag. At market validation, `concept_only` cannot produce low 4.3(b) risk.

## What developer experience adds — and does not prove

Developer reports are anecdotal and cannot predict a reviewer decision, but recurring patterns are useful discovery heuristics:

- custom UI, original content, a demographic niche, or substantial development effort did not consistently overcome a substitutable core experience;
- successful reports emphasized a structural core difference, user/pilot evidence, store positioning, and a path that let reviewers actually reach the differentiator;
- metadata and onboarding sometimes caused reviewers to classify an app into a saturated category before reaching later functionality;
- prior approval did not reliably protect later updates from a 4.3 finding;
- rejection explanations and appeal outcomes varied, so the workflow must expose residual uncertainty and budget for redesign, appeal delay, or platform sequencing.

These are hypotheses derived from reports, not Apple policy. Use them to demand better evidence, never to claim approval probability. For a high-risk, high-cost iOS idea, prefer a cheap prototype, pilot evidence, and an App Review appointment before committing the full build. Android-first or web-first sequencing may be evaluated as a business option, but must not be presented as evidence that Apple will approve a later iOS app.

## General design principles

The shared product-design principles below are framework inferences from the overlapping store rules. They are not a claim that Apple and Google use identical language or enforcement:

1. Deliver a distinct outcome or experience rather than a clone, reskin, or opportunistic category variant.
2. Provide meaningful, lasting mobile utility or entertainment beyond static content, a thin WebView, links, ads, or a repackaged website.
3. Give the product an original identity, content model, and interaction design; avoid confusing similarity, impersonation, and template-farm behavior.
4. Make the core experience stable, responsive, accessible, understandable, and viable to maintain with the recorded team capacity.
5. Keep the store promise, screenshots, metadata, pricing, advertising, and actual functionality consistent and honest.
6. Design a sustainable content and maintenance loop so quality does not depend on unbounded manual work or immediately degrade after launch.
7. Resolve platform-specific policy risks explicitly instead of treating cross-platform similarity as compliance evidence.

## Scoring rubric

Score every criterion from 0 to 5 for each targeted platform and multiply it by its weight. The final platform score is `round(sum(weight * criterion_score / 5))`.

| Criterion | Weight | A score of 5 means |
| --- | ---: | --- |
| Distinct user value | 25 | Evidence supports a meaningfully different or improved outcome for a clear user/job. |
| Functional depth and lasting utility | 20 | The smallest release delivers recurring mobile value beyond static, promotional, or wrapper functionality. |
| Original product identity | 15 | Positioning, content, UI, and brand are not a clone, impersonation, reskin, or repetitive template. |
| Mobile experience quality | 15 | The scoped experience can be stable, responsive, intuitive, accessible, and complete on the target platform. |
| Honest presentation and monetization | 10 | Store claims, screenshots, metadata, ads, pricing, and functionality can remain accurate and non-deceptive. |
| Sustainable experience | 10 | Content, support, moderation, and maintenance remain credible for the recorded capacity and budget. |
| Platform-policy fit | 5 | Current official platform-specific design and spam rules have evidence-backed mitigations and no unresolved severe risk. |

Verdicts:

- `strong` — 80–100;
- `conditional` — 65–79;
- `high_risk` — 50–64;
- `stop` — 0–49.

The preliminary brainstorm uses only `green|yellow|red|unknown` triage with explicit assumptions. Market validation produces the first numeric score from current official policy sources, competitor/category evidence, and a completed `store-design-score.json`. Product outline recalculates that canonical score after defining the actual MVP and flows.

## Hard flags

A hard flag overrides the numeric score until resolved or the affected platform is removed from scope. Include at least:

- Apple 4.3(a) provenance or near-duplicate submission risk that the developer cannot document and resolve;
- Apple 4.3(b) high risk under the observable decision table above;
- clone, impersonation, confusing identity, or unlicensed third-party identity/content;
- thin wrapper, static/limited content, no meaningful mobile function, or ad-first product;
- repetitive app/template strategy or multiple near-duplicate store listings;
- deceptive purpose, metadata, screenshots, pricing, or unavailable promised functionality;
- an experience expected to be broken, unstable, non-responsive, or unmaintainable at launch.

Record each hard flag with evidence, affected platform, mitigation, owner, and validation condition. A discovery cannot become `go` or a product outline `ready` while `overall.hard_stop=true`.

## Evidence contract

- Record policy URLs, `captured_at` timestamps, titles, direction, claims, and limitations using the exact `research-sources.md` contract.
- Prefer official Apple and Google policy pages for policy claims. Competitor listings and product pages may support category and differentiation findings.
- Record the target platforms before scoring. Use `not_applicable`, not an invented score, for a non-target platform.
- Explain which product evidence justifies each 0–5 score. Do not infer store approval from competitor presence or from another platform's acceptance.

Start each review from the current official policy families, then follow any replacement or linked policy pages: Apple App Review Guidelines (`https://developer.apple.com/app-store/review/guidelines/`), Google Play Spam (`https://support.google.com/googleplay/android-developer/answer/9899034`), Functionality, Content, and User Experience (`https://support.google.com/googleplay/android-developer/answer/9898783`), Metadata (`https://support.google.com/googleplay/android-developer/answer/9898842`), and Misrepresentation (`https://support.google.com/googleplay/android-developer/answer/9888689`). These URLs are starting points, not frozen policy text.

For experiential calibration, consult current developer reports from multiple projects and record them as anecdotal sources with their limitations. Useful starting examples include Apple's staff-authored App Review tips (`https://developer.apple.com/forums/thread/810791`), an unresolved 4.3(b) appeal despite custom content and interaction (`https://developer.apple.com/forums/thread/812849`), a reported approval after reframing and documenting a structural difference (`https://www.reddit.com/r/appledevelopers/comments/1s0nc0k/`), and a reported dating-app approval after explaining the concept (`https://www.reddit.com/r/iOSProgramming/comments/1haw411/`). Refresh these examples rather than treating them as permanent precedent.
