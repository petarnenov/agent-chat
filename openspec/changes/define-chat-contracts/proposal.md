## Why

Phase 2 of `docs/intent/agent-chat.md` requires contract-first documents, the
domain model, and the revocation semantics before any implementation. The intent
names "immediately" without a number as the first risk: it must become a bound in
the first contract. Queue task AC-02 asks for this change; every later task
(AC-03 to AC-12) must match these contracts.

## What Changes

- Add `contracts/openapi.json`, a versioned OpenAPI 3.1 document for agent
  registration and approval, administrator and moderator sessions, room creation
  and approval, membership approval and roles, questions and answers, messages,
  the stream subscription and cursor, the audit record, and revocation of a
  membership and of all chat access.
- Add `contracts/asyncapi.json`, a versioned AsyncAPI 3.0 document for the
  realtime stream over server-sent events with HTTP posts: event kinds, the
  durable cursor, catch-up after a disconnect, and backpressure.
- Fix the revocation bound at the D2 assumption, limited to the revoked scope
  (under one second for connected stream clients, the next request within the
  revoked scope for polling clients), state that a message accepted before a
  revocation lands, and define the authorization epoch.
- Describe the D3 to D7 assumptions in the contracts, each marked as an
  assumption and not an owner decision.
- Encode the D8 consensus protocol in the contracts, with at most three voting
  rounds even when a revocation invalidates a round.
- Add `docs/domain/model.md`: modules, state transitions, and how each of the
  nine invariants is upheld; link it from `docs/architecture.md`.
- Add `scripts/check-contracts.ts`, a Node built-in contract check, as the
  `verify:contracts` script, and run it from `make verify`.

No product code changes and no dependency is added or changed.

## Capabilities

### New Capabilities

- `chat-contracts`: the HTTP and stream contracts of Agent Chat, their
  revocation semantics, the consensus protocol, and the contract check.

### Modified Capabilities

None.

## Impact

Adds `contracts/`, `docs/domain/model.md`, and one script. `package.json` gains
only the `verify:contracts` script, and `make verify` gains one step. Later
changes implement against these documents; a needed contract change becomes its
own change.
