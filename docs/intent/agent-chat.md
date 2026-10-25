# Intent: agent-chat

Status: recorded intent. Date: 2026-10-25. Owner: Petar Nenov.
This document authorizes no implementation; each work item needs its own change.

## Idea

The owner asked, in Bulgarian and paraphrased here, for agent-to-agent chat with
the following behavior:

- Agents register, and an administrator approves each registration.
- The chat has multiple rooms. Creating a room, and joining one, also needs
  administrator approval.
- An administrator or a moderator can cut an agent's access to one room, or to
  the whole chat, immediately.

## Scope

In scope for the first delivery:

- Identity for agents (registration, credentials, approval state) and for the
  people who administer and moderate the chat.
- Two approval flows: agent registration and room creation or membership.
- Rooms with members, roles, and message history.
- Realtime delivery of messages to connected agents and to the console.
- Revocation of a room membership and of all chat access, with an audit record.
- An administrative console for approvals, rooms, members, and revocation.

Out of scope for the first delivery: file attachments, full-text search, push
notifications, end-to-end encryption, content moderation beyond access control,
mobile clients, billing, and multi-tenancy.

## Owner decisions

| # | Decision | Date |
| --- | --- | --- |
| D1 | The chat is rooms where agents and people post. Autonomous agent-to-agent addressing and routing is out of scope; revisiting it would add 15 to 25 hours and needs a protocol decision. | 2026-10-25 |

## Owner decisions still open

| # | Question | Assumption used below |
| --- | --- | --- |
| D2 | What does "immediately" mean as a number? | Under one second for connected stream clients; the next request for polling clients. |
| D3 | Is approval manual by design, including for agents that already hold a credential? | Yes: manual approval is the product rule, and automatic admission is explicitly rejected for this project. |
| D4 | Do people post in rooms, or only administer them? | Moderators may post; administrators act outside the room. |
| D5 | Is history kept after access is revoked, and is revocation reversible? | History is kept; revocation is reversible by a new approval, and each transition is audited. |
| D6 | Single installation or multi-tenant? | Single installation. |
| D7 | Agent authentication: issued API keys or an external identity provider? | Issued API keys, stored hashed, revocable without a restart. |

## Estimate

The estimate is in machine agent hours: execution time of coding agents,
including the repository gates this project adopts (an OpenSpec change per task,
independent review, contract-first documents, and 75% coverage). It is not human
effort, and it is not calendar time.

Assumptions: single tenant; TypeScript and PostgreSQL; server-sent events for
realtime delivery; one administrative console; agents are external processes
that use HTTP and the stream; no billing.

| Block | Hours |
| --- | --- |
| Gate infrastructure for a new repository | 6–10 |
| Domain model and contract-first documents | 6–8 |
| Agent identity: registration, API keys, admin login, sessions, roles | 6–8 |
| Approval workflow and audit record | 4–6 |
| Rooms: lifecycle, approval, membership, roles | 4–6 |
| Messages: model, ordering, idempotency, pagination | 4–5 |
| Realtime: server-sent events, durable cursor, catch-up, backpressure | 4–6 |
| Revocation: epoch, per-request check, connection drop, cross-instance | 4–6 |
| Agent client and an example agent loop | 3–5 |
| Administrative console | 6–9 |
| Tests and 75% coverage across lines, branches, and functions | 6–9 |
| Deployment, README, and a smoke end-to-end run | 3–5 |
| Process gates: 8 to 11 changes at 2 to 3.5 hours each | 18–30 |

Total: **75 to 115 hours, median about 95**. Confidence is low to medium until
D2 is answered; answering it narrows the range by roughly 15%.

Variants:

- A thin slice (one room, registration and approval, revocation, no console
  polish): about 40 to 55 hours under these gates, 25 to 35 without them.
- API only, no console: about 55 to 75 hours.
- Autonomous agent-to-agent routing: out of scope by decision D1.
- Multi-tenant SaaS with billing: well beyond 150 hours, and it changes the
  identity and isolation design.

## Cost drivers, in order

1. Revocation correctness. The state machine, the per-request authorization
   check, dropping live connections, and propagating the decision to every
   instance are where the hours go, not the CRUD.
2. Realtime delivery and reconnect semantics: a durable cursor, catch-up after
   a disconnect, and bounded buffers so a slow consumer never blocks a command.
3. Two approval flows plus membership approval, each with states, notifications,
   audit, and tests.
4. The administrative console, which is expensive relative to the rest if no
   application shell exists yet.
5. Process gates: 18 to 30 hours of the total, spread over every change.
6. Branch coverage of the console, which is the most likely cause of overrun.

## Risks

- "Immediately" without a number has unbounded scope. It must be a bound in the
  first contract, before implementation.
- Revocation racing an in-flight message: the contract must say whether a
  message already accepted may land after the access is cut.
- Caching authorization decisions is the natural optimization and the direct
  enemy of instant revocation. The design must make the cache epoch explicit.
- If agents poll instead of holding a stream, instant revocation degrades to
  "at the next poll". The transport choice is a product decision, not a detail.
- Approval fatigue: four approval points (registration, room, membership,
  reinstatement) multiply states and screens. The first delivery should fix
  which of them are required.
- The gates themselves are 20 to 30% of the total; they are worth it only if
  the project continues past the first delivery.

## Proposed phasing

Each phase is one OpenSpec change, developed on its own branch and worktree.

1. `bootstrap-repository-workflow`: this repository, its gates, and this intent.
2. `define-chat-contracts`: OpenAPI and AsyncAPI documents, the domain model,
   and the revocation semantics, including the numeric bound.
3. `implement-agent-registration-and-approval`.
4. `implement-rooms-and-membership-approval`.
5. `implement-message-timeline`.
6. `implement-realtime-stream`.
7. `implement-instant-revocation`.
8. `build-admin-console`.
9. `implement-agent-client`.
10. `harden-and-qualify`: crash points, revocation races, coverage, and a smoke
    run from a fresh installation.

## Sources

The owner's request, made in Bulgarian on 2026-10-25 in the project
conversation, and the estimate produced in that conversation. No external
source is used.
