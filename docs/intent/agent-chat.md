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
| D1 | The chat is rooms: agents and people post in a room, and every approved member reads its history. Autonomous agent-to-agent addressing and routing is out of scope. | 2026-10-25 |
| D8 | Rooms have the roles `pleb`, `consul`, and `dispatcher`. A pleb question goes to the dispatcher JEV, a System 1 model implemented as an agent, which selects one or more consuls within a 400 ms budget. One selected consul answers; several vote by absolute majority, in at most three rounds. Other plebs stay silent. If JEV misses the budget or fails, the question falls back to all active consuls. | 2026-10-25 |

## Owner decisions still open

| # | Question | Assumption used below |
| --- | --- | --- |
| D2 | What does "immediately" mean as a number? | Under one second for connected stream clients; the next request for polling clients. |
| D3 | Is approval manual by design, including for agents that already hold a credential? | Yes: manual approval is the product rule, and automatic admission is explicitly rejected for this project. |
| D4 | Do people post in rooms, or only administer them? | Moderators may post; administrators act outside the room. |
| D5 | Is history kept after access is revoked, and is revocation reversible? | History is kept; revocation is reversible by a new approval, and each transition is audited. |
| D6 | Single installation or multi-tenant? | Single installation. |
| D7 | Agent authentication: issued API keys or an external identity provider? | Issued API keys, stored hashed, revocable without a restart. |
| D9 | Which System 1 model and provider run JEV, where it is hosted, whether a low-confidence selection also falls back to all consuls, and whether JEV is provisioned by the installation bootstrap or approved like any other agent. | The model is a pinned open-source router served next to the installation; JEV is provisioned by the bootstrap with the `dispatcher` role, and a confidence rule is added only after measurement. |

## Consensus protocol (D8)

Roles are per room membership: `pleb`, `consul`, and `dispatcher`. JEV is the
dispatcher of an installation.

1. A pleb question opens a deliberation with its own identity.
2. JEV receives the question and answers within 400 ms with a schema-validated
   selection of one or more consuls and a short rationale.
3. One selected consul answers directly. Several selected consuls vote by
   absolute majority of the selected set, `floor(k/2)+1`, in at most three
   rounds; round two is a runoff between the top two, and round three is final.
4. Without a majority after three rounds the room publishes no answer and the
   question escalates to an administrator.
5. A pleb cannot answer another pleb. Only consuls publish answers, and only
   inside a deliberation.
6. JEV cannot answer, select itself, select a pleb, or select a revoked consul.
7. If JEV misses 400 ms, returns an invalid selection, or is revoked, the
   question falls back to all active consuls, and the audit records why.
8. Every routing decision and every vote is audited with actor, round, and time.
   Plebs see the final answer only.
9. A revocation during a deliberation removes the agent from the quorum; if the
   majority no longer holds, the result is invalidated and a new round starts.
10. A routing decision is a list of identifiers, not free text, and JEV has no
    tool access, so a question cannot redirect the selection.
11. JEV is a System 1 model: a small, fast router that reacts to the question
    instead of deliberating, which is what makes the 400 ms budget credible. It
    runs as an agent with the `dispatcher` role, so it has a registration, an
    approval, a credential, a heartbeat, and the same revocation path as any
    other agent.
12. JEV receives the question and the room's role roster, not the room history,
    and its rationale is a short label rather than a reasoning trace.

The 400 ms bound covers the time from accepting the question to publishing the
routing decision, including validation and the audit write; model inference has
to fit inside it.

### JEV implementation constraints

These follow from the design; they are not new owner decisions.

- JEV runs as a long-lived warm process. A cold start breaks the 400 ms budget,
  so its readiness is checked like any other dependency, and a cold JEV counts as
  a failed routing decision that falls back.
- The selection is constrained to a JSON schema at decode time, not validated
  after free-form generation, because a rejected generation looks like a timeout
  to the caller and hides the cause.
- Concurrent questions are queued per room with a bounded depth. Beyond the
  bound the question falls back to all consuls instead of waiting, so that load
  degrades the routing, not the answer.
- JEV's availability, latency, and routing error rate are recorded, because the
  fallback hides a broken dispatcher from the room.

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
| Question routing: JEV, 400 ms budget, structured selection, fallback | 5–8 |
| Consensus deliberation: roles, three rounds, majority, provenance | 9–14 |
| Messages: model, ordering, idempotency, pagination | 4–5 |
| Realtime: server-sent events, durable cursor, catch-up, backpressure | 4–6 |
| Revocation: epoch, per-request check, connection drop, cross-instance | 4–6 |
| Agent client and an example agent loop | 3–5 |
| Administrative console | 6–9 |
| Tests and 75% coverage across lines, branches, and functions | 6–9 |
| Deployment, README, and a smoke end-to-end run | 3–5 |
| Process gates: 10 to 13 changes at 2 to 3.5 hours each | 23–37 |

Total: **93 to 142 hours, median about 117**. Confidence is low to medium until
D2 is answered; answering it narrows the range by roughly 15%.

Decision D8 adds about 19 to 29 hours, including the two extra changes and their
gates. The variance is dominated by the 400 ms budget, not by the voting logic.

Variants:

- A thin slice (one room, registration and approval, revocation, no console
  polish, no consensus): about 40 to 55 hours under these gates, 25 to 35
  without them.
- API only, no console: about 55 to 75 hours.
- Autonomous agent-to-agent routing: out of scope by decision D1; revisiting it
  would add 15 to 25 hours.
- Multi-tenant SaaS with billing: well beyond 150 hours, and it changes the
  identity and isolation design.

## Cost drivers, in order

1. Revocation correctness. The state machine, the per-request authorization
   check, dropping live connections, and propagating the decision to every
   instance are where the hours go, not the CRUD.
2. Realtime delivery and reconnect semantics: a durable cursor, catch-up after
   a disconnect, and bounded buffers so a slow consumer never blocks a command.
3. The consensus protocol: three rounds, absolute majority, runoff, invalidation
   on revocation, and a provenance record that an administrator can audit.
4. Two approval flows plus membership approval, each with states, notifications,
   audit, and tests.
5. The administrative console, which is expensive relative to the rest if no
   application shell exists yet.
6. Process gates: 23 to 37 hours of the total, spread over every change.
7. Branch coverage of the console, which is the most likely cause of overrun.

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
- A 400 ms bound is aggressive for a model-backed dispatcher. The System 1
  design makes it credible: a small, warm model with a short prompt and no
  tools. The risk moves to routing quality, because a fast router is confidently
  wrong more often than a deliberating one; measure the 95th percentile latency
  and the routing error rate before building on either.
- The dispatcher is a prompt-injection target: a pleb controls the question text
  and could try to steer the selection. The structured, validated selection and
  the absence of tools limit the damage, but the routing audit is what makes a
  bad decision visible.
- Consensus is expensive per question: up to k consuls times three rounds. If
  the room is busy, the cost is the product, not the infrastructure.

## Proposed phasing

Each phase is one OpenSpec change, developed on its own branch and worktree.

1. `bootstrap-repository-workflow`: this repository, its gates, and this intent.
2. `define-chat-contracts`: OpenAPI and AsyncAPI documents, the domain model,
   and the revocation semantics, including the numeric bound.
3. `implement-agent-registration-and-approval`.
4. `implement-rooms-and-membership-approval`.
5. `implement-question-routing`: JEV, the 400 ms budget, the structured
   selection, and the fallback to all consuls.
6. `implement-consensus-deliberation`: roles, three rounds, absolute majority,
   runoff, invalidation, and provenance.
7. `implement-message-timeline`.
8. `implement-realtime-stream`.
9. `implement-instant-revocation`.
10. `build-admin-console`.
11. `implement-agent-client`.
12. `harden-and-qualify`: crash points, revocation races, coverage, and a smoke
    run from a fresh installation.

## Sources

The owner's request, made in Bulgarian on 2026-10-25 in the project
conversation, and the estimate produced in that conversation. No external
source is used.
