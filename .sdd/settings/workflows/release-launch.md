# Workflow: release-launch

1. Follow `_common.md`, `release-principles.md`, and `release-launch.md`; load every release artifact, current candidate build, evidence, active blockers, store/backend/configuration state, and latest official policy requirements.
2. Create or refresh `launch-plan.md`. Planning may proceed before readiness, but publication approval requires readiness, go-to-market, assets, and measurement all `ready`, no unresolved blocker, a verified immutable candidate, and explicit rollback/stop ownership.
3. Present a concise GO/HOLD review with the exact candidate, rollout, external actions, paid-media actions, blockers/boundaries, and hashes of `pre-release-checklist.md`, `marketing-plan.md`, `store-assets.md`, `measurement-plan.md`, and `launch-plan.md`.
4. Keep `launch_gate.status=pending` until the user explicitly approves this named release plan. Approval records human identity/time, current artifact hashes, `candidate_digest`, and `scope_digest`. Any material change to a bound artifact, candidate, or scope revokes the gate.
5. After approval, execute only the explicitly authorized publication actions. Credentials, production mutations, price changes, public communications, and campaign spend outside that authorization require their own approval. Paid media always requires a separate channel/currency/hard-cap/date approval.
6. Use staged rollout where supported. Record submission, review, availability by storefront/version, production smoke tests, campaign activation, pauses, rollback, and environment boundaries in `evidence.jsonl`.
7. Mark `launched` only after real availability and critical production smoke checks. Advance to observation, update history, and run SDD lint. A submitted or approved build that is not available remains `in_progress`.
