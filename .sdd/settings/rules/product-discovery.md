# Product Discovery Principles

## Default operating profile

Optimize for constrained mobile delivery capacity: limited cash, time, distribution leverage, and operational headroom. Treat values in `constraints.md` and optional `.sdd/config.json` discovery settings as authoritative; never invent missing budgets or runway.

Prefer opportunities with:

- a narrow user and painful recurring job;
- self-service acquisition, onboarding, purchase, and support;
- value delivered primarily by the app, without bespoke services;
- a useful single-platform MVP and a small core loop;
- low fixed cost and bounded variable cost per active or paying user;
- monetization that can be tested before a broad feature build;
- accessible channels reachable without a dedicated marketing team;
- limited moderation, compliance, content-production, and uptime burden.

Record the intended launch platforms before scoring an idea. Apply `store-design-readiness.md` throughout discovery so originality, minimum functionality, mobile quality, honest presentation, and platform-specific store risk shape the product rather than becoming a release-only check.

Flag as a hard constraint failure unless a concrete low-cost mitigation exists:

- direct or consultative enterprise sales as the primary channel;
- two-sided marketplace liquidity;
- regulated, safety-critical, or high-liability advice;
- human-in-the-loop delivery for every transaction;
- heavy user-generated-content moderation;
- proprietary data that is unavailable or expensive;
- unbounded AI, media, support, or third-party API cost;
- network effects or scale that must exist before the first user receives value.

## Evidence discipline

- Separate facts, user-provided assumptions, estimates, and agent inference.
- Search current sources whenever market availability, pricing, platform policy, fees, competitors, or demand evidence may have changed.
- Prefer first-party product pages, store listings, pricing pages, platform policies, public filings, and official statistics. Use reviews, communities, and secondary research to discover pain or corroborate, and label their limitations.
- Record `captured_at`, URL, title, source type, direction, claim, and limitations note in `research-sources.jsonl` according to `research-sources.md`. Use `captured_at`, not `accessed_at`.
- Do not fabricate TAM, revenue, downloads, conversion, retention, willingness to pay, or competitor performance.
- Treat keyword volume, waitlists, anecdotes, and competitor presence as signals, not proof. Triangulate materially important claims.
- Actively seek disconfirming evidence and define what would falsify the hypothesis.

## Decision discipline

- Optimize for expected learning per unit of cash and developer time, not idea novelty.
- Compare against the realistic alternative of investing in an existing product.
- Prefer a cheap validation experiment over a confident forecast.
- Make uncertainty visible. A conditional GO must list the condition, owner, test, budget, and deadline.
- A GO requires a current store-design score for every target platform and no unresolved hard-stop flag.
- Stopping a weak idea is a valid outcome.
