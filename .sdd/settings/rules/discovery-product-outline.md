# High-Level Product Outline

Design only enough product to validate and deliver the proposed value. Do not turn discovery into detailed technical design.

The outline must define:

- one primary persona and job, with secondary users deferred unless essential;
- the core loop from acquisition or trigger through first value, repeat value, and payment;
- high-level flows for onboarding, primary task, monetization, retention/re-engagement, account/data control, and important failure/empty/offline states;
- a feature inventory split into validation prototype, MVP, later, and explicit non-goals;
- the smallest useful single-platform release and any backend/admin/content obligations;
- trust, privacy, accessibility, safety, platform-policy, and support boundaries;
- analytics events and success/kill thresholds for acquisition, activation, value delivery, retention, conversion, and cost;
- the largest effort and cost hotspots, with cheaper alternatives;
- open product questions that SDD requirements must resolve after promotion.

Recalculate `store-design-score.json` against the actual MVP, flows, positioning, monetization, content, and maintenance obligations. Carry every platform-specific mitigation into the relevant flow or release slice. An outline is not `ready` while the score is stale, a target platform lacks a score, or `overall.hard_stop=true`.

Prefer text, a compact table, and Mermaid only when branching or state makes prose ambiguous. Avoid pixel-level UI, implementation architecture, and a backlog of speculative features.
