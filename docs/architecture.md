# Architecture (draft)

Status: draft. Date: 2026-10-25. No implementation exists. Each decision below
that the owner has not accepted is marked as open, and the change that needs it
must ask before building on it.

## Context

Agent Chat is a small self-hosted service: agents register, an administrator
approves them, they exchange messages in rooms that an administrator also
approves, and an administrator or moderator can cut access immediately. Rooms are
the interaction model (intent D1); autonomous agent-to-agent routing is out of
scope.

## Module map

The service follows hexagonal architecture: a domain core, application modules
that depend only on ports, and adapters at the edges.

| Module | Responsibility |
| --- | --- |
| `identity` | Agent registration, credentials, approval state, people, sessions, roles. |
| `rooms` | Room lifecycle, room approval, membership, per-room roles. |
| `deliberation` | The question queue, routing by the dispatcher JEV, an agent running a System 1 model, and the answer of the one selected consul. |
| `messaging` | Messages, ordering, idempotency, pagination, retention. |
| `moderation` | Access revocation, revocation epochs, audit record. |
| `delivery` | Realtime stream, durable cursor, catch-up, backpressure. |

Ports, at minimum: a store port, a credential port, a clock port, a stream port,
an audit port, and a model port for one structured call
([ADR 0003](decisions/0003-agent-runtime-model-port.md)). Adapters for PostgreSQL
and HTTP are the first ones; the model port's dispatcher adapter uses the
TypeSafe SDK `@typesafe-ai/sdk`, with a fake adapter for tests
([ADR 0004](decisions/0004-jev-on-typesafe.md)). The conformance suite of each
port ships with the port. No agent framework sits between the application and
the model.

## Contracts

The contracts come first and every implementation change matches them:

- [contracts/openapi.json](../contracts/openapi.json): the OpenAPI 3.1 HTTP API.
- [contracts/asyncapi.json](../contracts/asyncapi.json): the AsyncAPI 3.0
  server-sent event stream.
- [docs/domain/model.md](domain/model.md): the modules, their state
  transitions, the revocation semantics, and how each invariant is upheld.

`make verify` checks both documents with `npm run verify:contracts`. Owner
decisions D2 to D7 are decided and the contracts state them as decisions. Only
the open parts of D9 and D11, and server-sent events for transport, are
assumptions, each marked as such; none of them closes an open decision below.

## Invariants

1. No agent reads or writes in a room without an approved membership.
2. A revocation is instant (intent D2): every request whose authorization
   check begins after the revocation commits is rejected, and no event is
   written to the revoked subject's stream after the commit.
3. An approval state transition is audited with actor, reason, and time.
4. A message accepted before a revocation may land; the contract states whether
   it does, and the test proves the chosen behavior.
5. An authorization decision may be cached only with an explicit epoch, and a
   revocation advances the epoch.
6. Revocation of all chat access is one action, and it is reversible only by a
   new approval.
7. A pleb never publishes an answer; only a consul does, inside a deliberation.
8. JEV selects exactly one consul or gives the fixed reply "This is not a
   question for a consul.", and never answers otherwise; it receives the
   question and the role roster, not the room history.
9. Questions are routed one at a time in order of acceptance. A routing decision
   is one validated consul identifier or the fixed reply, and a question
   without a valid decision within 3000 ms is skipped, with the reason
   audited.

## Open decisions

- Transport for agents: server-sent events with HTTP posts, or WebSocket.
  The default in the intent is server-sent events.
- Credential format and storage: hashed API keys by default.
- Whether a low-confidence selection is skipped like a missing one, and
  whether JEV is provisioned by the installation bootstrap (the open parts of
  intent D9).
- What happens when the selected consul is revoked before it answers (intent
  D11); the assumption is that the question is skipped.
- Retention window; history is kept after a revocation (intent D5).
- Console technology; no framework is selected yet, and the dependency policy
  requires a recorded evaluation before one is added.

## Non-goals

Multi-tenancy, billing, end-to-end encryption, content moderation beyond access
control, mobile clients, and file attachments.
