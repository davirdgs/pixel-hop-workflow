# Workflow: spec-requirements

1. Follow `_common.md`; load the requirements template and EARS rule.
2. Generate WHAT-focused, testable behavior in the spec language.
3. Use explicit numeric acceptance-criterion IDs derived as `N.M`.
4. Include functional behavior, privacy/security, observability, accessibility/localization, failure behavior, and measurable non-functional constraints when relevant.
5. Do not encode classes, file paths, frameworks, or implementation choices unless they are genuine product constraints.
6. Set requirements to `review_required`; invalidate downstream artifacts when approved requirements changed materially.
   Use `sdd.mjs revise <feature> requirements <actor> --reason <reason>` before changing approved bytes so revision, downstream supersession, and gate revocation are atomic.
7. Stop before design and request review/approval. When invoked by `auto-sdd`, return control to its canonical validation/correction loop instead; delegated approval is allowed only after that loop returns GO.
