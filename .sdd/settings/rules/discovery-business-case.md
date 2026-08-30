# Mobile Business Case

## Model design

Prefer self-service B2C or prosumer models: freemium subscription, paid app, consumable or durable in-app purchase, or a simple ad-supported model only when realistic volume and privacy trade-offs are acknowledged. B2B is acceptable only when acquisition, onboarding, purchase, and support do not depend on repeated direct sales.

Describe the payer, value metric, free boundary, paywall moment, price hypothesis, billing channel, retention driver, refund/support burden, and why recurring payment is or is not justified.

## Cost model

Show currency, tax treatment, time horizon, and source date. Include:

- one-time build, design, content, legal, localization, and launch cash;
- developer opportunity cost separately from cash outlay;
- store/program fees and payment commissions;
- recurring fixed tools, hosting, monitoring, support, and marketing;
- per-user or per-action costs for AI, APIs, storage, media, messaging, and support;
- contingency for unknowns and the cash runway required before learning is possible.

Mutable fees and third-party prices require current sources. Do not assume a small-business store rate applies without stating eligibility as an assumption.

## Scenario model

Calculate downside, base, and upside with editable assumptions. At minimum show:

- reachable users, activation, free-to-paid conversion, monthly price, net revenue per payer;
- monthly churn or retained payers, variable cost per active/paying user, and fixed monthly cost;
- contribution margin, monthly operating result, break-even paying users, payback period, and 12-month cash need/return.

Use formulas, not unexplained totals:

- `net revenue per payer = gross price - store/payment fees - taxes/refunds`
- `contribution per payer = net revenue per payer - variable cost per payer`
- `break-even payers = monthly fixed cost / contribution per payer`
- `operating result = payers × contribution per payer - monthly fixed cost`
- `ROI = (cumulative operating cash generated - initial cash investment) / initial cash investment`

If acquisition cost, churn, conversion, or volume is unknown, present the break-even threshold and a validation experiment instead of a false point estimate.

## Verdicts

- `viable`: downside is survivable and base assumptions can support the required return.
- `conditional`: viability depends on named thresholds that can be tested cheaply.
- `unviable`: required scale, cash, time, sales effort, or operating burden violates constraints.
