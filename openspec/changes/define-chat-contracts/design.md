## Context

No implementation exists. `docs/architecture.md` lists six modules and nine
invariants; `docs/intent/agent-chat.md` records owner decisions D1, D8, and D10
and assumptions for the open decisions D2 to D7 and D9. ADR 0002 requires
contract-first OpenAPI. The worker that writes this change has no shell and can
only run the frozen project checks.

## Goals and non-goals

Goals: contracts precise enough that AC-03 to AC-12 can implement and test
against them, an explicit revocation bound and race rule, and a check that keeps
the documents well formed.

Non-goals: implementation, deciding any open owner decision, choosing the
console technology, the JEV model (D9), or the retention window.

## Decisions

### Two documents, one contract

`contracts/openapi.json` (OpenAPI 3.1.0) holds every HTTP operation, including
the `GET /v1/stream` subscription and `PUT /v1/stream/cursor`.
`contracts/asyncapi.json` (AsyncAPI 3.0.0) holds the event payloads of the
stream and the cursor post. Both carry `info.version` 0.1.0 while unimplemented;
the URL prefix `/v1` is the API generation. Product-specific semantics live in
`x-agent-chat-*` extension objects that both documents share in meaning.

### Revocation bound (D2 assumption)

The revoked scope is the room for a membership revocation and the whole chat
for a chat-wide revocation. Time is measured from the commit of the revocation
transition. This one rule is stated identically in the design, the spec delta,
and both contracts, and AC-09 proves exactly it:

- Connected stream client: from 1000 ms after the revocation commits, the
  service writes no event of the revoked scope to the revoked subject's stream,
  whenever that event committed. Events of the revoked scope may still reach
  the subject during the first 1000 ms. A chat-wide revocation also closes the
  subject's stream within 1000 ms of the commit; a membership revocation leaves
  the stream open for the subject's other approved rooms.
- Polling client: the next request within the revoked scope whose authorization
  check begins after the commit is rejected with 403 (a request to the room for
  a membership revocation, any request for a chat-wide revocation). A request to
  another room where the subject still holds an approved membership is not
  rejected because of a membership revocation.

The bound is labeled as the D2 assumption, not an owner decision.

### Accepted messages land (invariant 4)

A message is accepted when its insert commits, and the insert transaction
re-reads the author's authorization epoch. A revocation that commits first makes
the post fail with 403; a message that committed first keeps its sequence, stays
in history (D5 assumption), and is delivered to the remaining members even after
the revocation. Delivery of any event to the revoked subject itself follows the
revocation bound above and nothing stricter. This is the simplest rule that a
race test can prove exactly.

### Authorization epoch (invariant 5)

Every subject (agent or person) has an `authorizationEpoch`, a non-negative
integer stored with its access state. Every access transition of the subject,
and so every revocation, increments it in the same transaction. A cached
authorization decision records the epoch it was computed at and is used only
while it equals the stored epoch, which every request reads. A per-subject epoch
limits invalidation to the affected subject instead of the whole installation.

### Consensus (D8)

The deliberation states, the 400 ms routing deadline, `floor(k/2)+1`, the
three rounds, escalation, and the fallback reasons are encoded in
`x-agent-chat-consensus` and in the deliberation schemas. JEV is an agent: it
receives `routing.requested` on its stream and posts its selection. Where the
intent leaves a detail open, the contract fixes one and labels it a contract
rule:

- Runoff ties go to the earlier proposal.
- The round deadline is configuration.
- The limit of three voting rounds is absolute. A revocation during a
  deliberation removes the consul from the selected set, so `k` becomes the
  number of active selected consuls. If the round's leading proposal no longer
  holds `floor(k/2)+1` of the remaining valid votes, the round is invalidated,
  and an invalidated round consumes its round number like any other round.
  After an invalidated round 1, round 2 is the runoff between the top two
  proposals by the remaining valid votes; after an invalidated round 2, round 3
  is final; an invalidated round 3 escalates to an administrator. When no
  selected consul remains active, the deliberation escalates at once. No
  deliberation therefore holds more than three voting rounds.

### Contract check

`scripts/check-contracts.ts` uses only `node:fs` and `node:url`. It fails when a
document is unreadable or not JSON, when `openapi` is not 3.1.x or `asyncapi` is
not 3.0.x, when `info.version` is not a semantic version, when an OpenAPI
operation has an empty `responses`, when an AsyncAPI operation declares no
message or a `receive` operation has no `reply`, and when a `$ref` is not a
resolvable local pointer. For a server-sent `send` operation the pushed messages
are its response; the subscription's HTTP response is in the OpenAPI document.
The check runs in `make verify` after the comment check.

The check has no unit test: `test/` is outside this task's scope, and coverage
measures only `dist/`. It is exercised by every `make verify` against the real
documents.

## Risks and trade-offs

- The documents are hand-written JSON with no schema validator, because no
  package may be added; the check covers structure, not full schema validity.
- The contracts fix assumptions D2 to D7 and D9; if the owner decides otherwise,
  a contract change is required before implementation of the affected task.
- One revocation bound for every instance requires cross-instance propagation
  in AC-09; the contract states the bound, not the mechanism.
- Counting an invalidated round against the limit can escalate a question that
  a repeated round would have settled; the absolute limit is preferred because
  D8 fixes at most three rounds.
