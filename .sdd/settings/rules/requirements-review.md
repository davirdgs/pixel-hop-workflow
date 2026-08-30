# Requirements Review

Review generated requirements before approval.

## Blocking checks

- Every acceptance criterion has a unique stable numeric `N.M` ID and valid localized EARS semantics.
- Behavior describes WHAT is required without accidental implementation choices.
- User journeys include success, empty, loading, failure, retry, cancellation, offline, and permission behavior where relevant.
- Privacy, security, accessibility, localization, observability, data lifecycle, and measurable non-functional constraints are covered when material.
- Terms are internally consistent with steering and the user input; assumptions and out-of-scope behavior are explicit.
- Each criterion is independently testable and avoids vague adjectives or unverifiable promises.

Return GO only when no blocking ambiguity, contradiction, missing critical path, or untestable criterion remains. Cite exact requirement IDs for every finding. Validation does not approve the artifact.
