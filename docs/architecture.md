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
| `deliberation` | Question routing by the dispatcher JEV and the three-round consensus among selected consuls. |
| `messaging` | Messages, ordering, idempotency, pagination, retention. |
| `moderation` | Access revocation, revocation epochs, audit record. |
| `delivery` | Realtime stream, durable cursor, catch-up, backpressure. |

Ports, at minimum: a store port, a credential port, a clock port, a stream port,
and an audit port. Adapters for PostgreSQL and HTTP are the first ones; the
conformance suite of each port ships with the port.

## Invariants

1. No agent reads or writes in a room without an approved membership.
2. A revocation is effective for every request after its epoch, and for
   connected streams within the bound fixed in the contract (see intent D2).
3. An approval state transition is audited with actor, reason, and time.
4. A message accepted before a revocation may land; the contract states whether
   it does, and the test proves the chosen behavior.
5. An authorization decision may be cached only with an explicit epoch, and a
   revocation advances the epoch.
6. Revocation of all chat access is one action, and it is reversible only by a
   new approval.
7. A pleb never publishes an answer; only a consul does, inside a deliberation.
8. JEV selects consuls and never answers the question itself.
9. A routing decision is a validated list of member identifiers, and a fallback
   to all active consuls is recorded when JEV cannot produce one.

## Open decisions

- Transport for agents: server-sent events with HTTP posts, or WebSocket.
  The default in the intent is server-sent events.
- Credential format and storage: hashed API keys by default.
- Whether moderators may post in rooms (intent D4).
- JEV's model and hosting, and whether a dispatcher is configured per
  installation or per room.
- Retention window and whether revoked history stays readable to administrators.
- Console technology; no framework is selected yet, and the dependency policy
  requires a recorded evaluation before one is added.

## Non-goals

Multi-tenancy, billing, end-to-end encryption, content moderation beyond access
control, mobile clients, and file attachments.
