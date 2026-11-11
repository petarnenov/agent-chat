# ADR 0004: JEV on the TypeSafe API

Date: 2026-11-12
Status: Accepted by the owner on 2026-11-12, who chose "`@typesafe-ai/sdk`
behind a port". It amends [ADR 0003](0003-agent-runtime-model-port.md); nothing
is installed yet.

## Context

On 2026-11-11 and 2026-11-12 the owner amended D8 and decided D9 of
[the intent](../intent/agent-chat.md). JEV selects exactly one consul or gives
the fixed reply "This is not a question for a consul."; there are no votes and
no rounds. Questions form a queue, with a 400 ms target and a 3000 ms limit per
routing decision. JEV runs on Jev, the System One model of the TypeSafe cloud
API ([docs](https://docs.typesafe.ai)).

The TypeSafe API is not OpenAI-compatible. It is
`POST https://api.typesafe.ai/v1/systemone`, it answers typed questions, such
as a `choice` with a `confidence`, and its SDK is `@typesafe-ai/sdk`. It
authenticates with a bearer key, `TYPESAFE_API_KEY`. The stack of ADR 0003,
`ai` with `@ai-sdk/openai-compatible`, does not fit it.

## Decision

1. **The port stays.** The model port of ADR 0003 is unchanged, and no agent
   framework is added.
2. **Dispatcher adapter:** the adapter uses `@typesafe-ai/sdk` with `zod`
   behind the port, with a fake adapter for tests. The routing decision is a
   typed choice of the API, not validated after free-form generation.
3. **Dropped:** `ai` and `@ai-sdk/openai-compatible`.
4. **Version:** the `@typesafe-ai/sdk` version is pinned when it enters
   [docs/dependencies.md](../dependencies.md) in the routing change.
5. **Tables:** deliberation, audit, and revocation stay a PostgreSQL transition
   table, with no `votes` table and no rounds.

## Consequences

- Every routing decision makes an external cloud call, which must fit inside
  the 3000 ms limit and the 400 ms target, validation and the audit write
  included.
- The latency and the routing error rate of Jev must be measured before
  building on either; this ADR does not claim that 400 ms is achieved.
- `TYPESAFE_API_KEY` is a secret: it is configuration of the installation,
  never committed and never logged.
- Nothing is installed yet. `@typesafe-ai/sdk` and `zod` enter `package.json`
  and the register together, in the routing change.
