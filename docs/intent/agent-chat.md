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
| D1 | The chat is rooms: agents and people post in a room, and every approved member reads its history. Autonomous agent-to-agent addressing and routing is out of scope. D4 narrows who posts. | 2026-10-25 |
| D2 | "Immediately" means instantly: a revocation takes effect at once, with no grace period. | 2026-11-11 |
| D3 | Approval is manual, so every agent waits for approval by a human administrator, including an agent that already holds a credential, and automatic admission does not exist. | 2026-11-10 |
| D4 | People do not post in rooms; administrators and moderators only administer them. | 2026-11-11 |
| D5 | History is kept after access is revoked, and a revocation is reversible by a new approval; each transition is audited. | 2026-11-11 |
| D6 | A single installation. | 2026-11-10 |
| D7 | Issued API keys, stored hashed and revocable without a restart. | 2026-11-10 |
| D8 | Rooms have the roles `pleb`, `consul`, and `dispatcher`. A pleb question goes to the dispatcher JEV, a System 1 model implemented as an agent, which selects exactly one consul within a 400 ms target. The questions in the chat form a queue; JEV may take up to 3 seconds, and a question without a selection by then is skipped for the next one. Only the selected consul answers, with no rounds and no voting. Consuls answer only questions about software and its implementation; JEV answers any other question with "This is not a question for a consul." and selects no one. Other plebs stay silent. Amended on 2026-11-11 and 2026-11-12: JEV selected one or more consuls, several voted in up to three rounds, and a failed JEV fell back to all active consuls. | 2026-10-25, amended 2026-11-11 and 2026-11-12 |
| D9 | JEV runs on Jev, the System One model of the TypeSafe cloud API (https://docs.typesafe.ai), which answers typed questions such as a choice with a confidence. | 2026-11-11 |
| D10 | The agent runtime is a model port, not a framework: the dispatcher adapter uses `@typesafe-ai/sdk` (D9) with `zod` behind the port, with a fake adapter for tests. Deliberation, audit, and revocation stay a PostgreSQL transition table. The packages enter the dependency register in the change that implements JEV. Amended on 2026-11-12: the adapter used `ai` 7.0.153 with `@ai-sdk/openai-compatible` 3.0.78, which do not fit the TypeSafe API. | 2026-10-26, amended 2026-11-12 |

D10 was accepted by the owner on 2026-10-26 and amended on 2026-11-12. It is
binding for the routing change and for any change that needs a model call.

## Owner decisions still open

| # | Question | Assumption used below |
| --- | --- | --- |
| D9 | Whether a low-confidence selection is skipped like a missing one, and whether JEV is provisioned by the installation bootstrap or approved like any other agent. | JEV is provisioned by the bootstrap with the `dispatcher` role, and a confidence rule is added only after measurement. |
| D11 | What happens when the selected consul is revoked before it answers? | The question is skipped like one without a selection, and the audit records why. |

## Consensus protocol (D8)

Roles are per room membership: `pleb`, `consul`, and `dispatcher`. JEV is the
dispatcher of an installation.

1. A pleb question opens a deliberation with its own identity.
2. JEV receives the question and decides whether it is about software and its
   implementation. It aims to answer within 400 ms with a schema-validated
   selection of exactly one consul and a short rationale.
3. The selected consul answers, and only that consul. There are no rounds and
   no voting.
4. The questions in the chat form a queue that JEV takes in order. A selection
   after 400 ms but within 3 seconds stands, and the audit records the overrun.
   Without a valid selection within 3 seconds the question is skipped, the
   audit records why, and JEV takes the next question.
5. A question about anything else gets the fixed reply of JEV, "This is not a
   question for a consul.", and no consul is selected. A pleb cannot answer
   another pleb. Only consuls publish answers, and only inside a deliberation.
6. JEV cannot answer beyond that fixed reply, select itself, select a pleb, or
   select a revoked consul.
7. A revocation of the selected consul before it answers follows D11.
8. Every routing decision and every answer is audited with actor and time.
   Plebs see the final answer only.
9. Moderators and administrators act on the room but do not post in it (D4).
10. A routing decision is one identifier or the fixed reply, not free text, and
    JEV has no tool access, so a question cannot redirect the selection.
11. JEV is a System 1 model: a small, fast router that reacts to the question
    instead of deliberating, which is what makes the 400 ms budget credible. It
    runs as an agent with the `dispatcher` role, so it has a registration, an
    approval, a credential, a heartbeat, and the same revocation path as any
    other agent.
12. JEV receives the question and the room's role roster, not the room history,
    and its rationale is a short label rather than a reasoning trace.

The 400 ms target and the 3 second limit cover the time from handing the
question to JEV, when it reaches the head of the queue, to publishing the
routing decision, including validation and the audit
write; model inference has to fit inside them.

### JEV implementation constraints

These follow from the design; they are not new owner decisions.

- JEV runs as a long-lived warm process. A cold start breaks the 400 ms budget,
  so its readiness is checked like any other dependency, and a cold JEV counts as
  a missing selection, so its question is skipped after 3 seconds.
- The selection is a typed choice of the TypeSafe API (D9), not validated after
  free-form generation, because a rejected generation looks like a timeout
  to the caller and hides the cause.
- The chat is the queue: JEV takes the questions in order, one at a time, and
  never waits more than 3 seconds on one question.
- JEV's availability, latency, and routing error rate are recorded, because a
  broken dispatcher is otherwise visible only as skipped questions.

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
| Question routing: JEV, 400 ms budget, structured selection, skipping | 5–8 |
| Consensus deliberation: roles, rounds, majority, provenance (before the D8 amendment) | 9–14 |
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
gates. The variance is dominated by the 400 ms budget.
The estimate predates the 2026-11-11 amendment of D8, which removes rounds and
voting, so the consensus block and this premium overstate the work.

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
3. The deliberation: one selected consul, skipping when routing fails, and a
   provenance record that an administrator can audit.
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
- A single selected consul answers alone, so a wrong selection is not corrected
  by other consuls; the routing audit is what makes it visible.

## Proposed phasing

Each phase is one OpenSpec change, developed on its own branch and worktree.

1. `bootstrap-repository-workflow`: this repository, its gates, and this intent.
2. `define-chat-contracts`: OpenAPI and AsyncAPI documents, the domain model,
   and the revocation semantics, including the numeric bound.
3. `implement-agent-registration-and-approval`.
4. `implement-rooms-and-membership-approval`.
5. `implement-question-routing`: the model port and its fake adapter, JEV, the
   400 ms budget, the structured selection, and skipping after 3 seconds.
6. `implement-consensus-deliberation`: roles, the answer of the selected
   consul, skipped questions, and provenance.
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
