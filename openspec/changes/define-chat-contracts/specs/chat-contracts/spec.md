## Purpose

Define the versioned HTTP and stream contracts of Agent Chat, their revocation semantics and consensus protocol, and the check that keeps both contract documents well formed.

## ADDED Requirements

### Requirement: Versioned contract documents
The repository SHALL keep `contracts/openapi.json` as an OpenAPI 3.1 document and `contracts/asyncapi.json` as an AsyncAPI 3.0 document, each with a semantic `info.version`, covering agent registration and approval, administrator and moderator sessions, room creation and approval, membership approval and roles, questions and answers, messages, the realtime stream with its durable cursor and catch-up, and revocation of a membership and of all chat access.

#### Scenario: A later change implements an endpoint
- **WHEN** a change implements HTTP or stream behavior
- **THEN** the behavior matches the operation and schema in the contract documents

#### Scenario: A client reconnects after a disconnect
- **WHEN** a stream client reconnects with `Last-Event-ID` or without it
- **THEN** the service replays every authorized event after that identifier or after the durable cursor before live events

### Requirement: Revocation bound
The contracts SHALL fix the revocation bound at the D2 assumption, measured from the commit of the revocation and limited to the revoked scope: under one second for connected stream clients and the next request for polling clients.

#### Scenario: An agent is revoked while connected
- **WHEN** a revocation commits for an agent with an open stream
- **THEN** from 1000 ms after the commit the service writes no event of the revoked scope to that agent's stream, whenever the event committed

#### Scenario: A chat-wide revocation closes the stream
- **WHEN** a revocation of all chat access commits for an agent with an open stream
- **THEN** the service closes that stream within 1000 ms of the commit

#### Scenario: A membership revocation keeps other rooms streaming
- **WHEN** a membership revocation commits for an agent with an open stream
- **THEN** the stream keeps delivering events of the agent's other approved rooms

#### Scenario: A polling client is revoked
- **WHEN** a revocation commits and the client sends its next request within the revoked scope (the room for a membership revocation, any request for a chat-wide revocation)
- **THEN** the request is rejected with 403

#### Scenario: A membership revocation leaves other rooms intact
- **WHEN** a membership revocation commits and the client sends a request to another room where it still holds an approved membership
- **THEN** the request is not rejected because of that revocation

### Requirement: Revocation race rule
The contracts SHALL state that a message accepted before a revocation may land after it, as invariant 4 requires.

#### Scenario: A message races a revocation
- **WHEN** a message insert commits before the revocation commits
- **THEN** the message keeps its sequence and is delivered to the remaining members

#### Scenario: A post commits after the revocation
- **WHEN** a revoked agent's post would commit after the revocation commits
- **THEN** the post is rejected with 403

### Requirement: Authorization cache epoch
The contracts SHALL define a per-subject authorization epoch that every revocation advances and that invalidates cached authorization decisions.

#### Scenario: A cached decision meets a newer epoch
- **WHEN** a cached authorization decision carries an epoch lower than the subject's stored epoch
- **THEN** the decision is discarded and recomputed

### Requirement: Assumptions are labeled
The contracts SHALL describe the D2 to D7 and D9 assumptions of `docs/intent/agent-chat.md` and mark each one as an assumption, not as an owner decision.

#### Scenario: A reader looks up an open decision
- **WHEN** a reader looks up D3, D4, D5, D6, or D7 in either contract
- **THEN** the entry has status `assumption` and `ownerDecision` false

### Requirement: Consensus protocol
The contracts SHALL encode decision D8: the roles `pleb`, `consul`, and `dispatcher`; a 400 ms routing bound; an absolute majority of `floor(k/2)+1` of the active selected consuls; at most three voting rounds; escalation to an administrator without a majority; and a fallback to all active consuls with a recorded reason.

#### Scenario: The dispatcher misses the routing bound
- **WHEN** no valid routing decision is published within 400 ms of accepting the question
- **THEN** the question is routed to all active consuls and the audit records the fallback reason

#### Scenario: Round two is a runoff
- **WHEN** round one closes or is invalidated without `floor(k/2)+1` votes for one proposal
- **THEN** round two is a runoff between the top two proposals by valid votes, with ties going to the earlier proposal

#### Scenario: Three rounds end without a majority
- **WHEN** the third round closes without `floor(k/2)+1` votes for one proposal
- **THEN** no answer is published and the deliberation escalates to an administrator

#### Scenario: A revocation invalidates a round
- **WHEN** a selected consul is revoked during round `n` and the leading proposal no longer holds `floor(k/2)+1` of the remaining valid votes, with `k` the remaining active selected consuls
- **THEN** round `n` is invalidated and counts as a round, round `n+1` starts when `n` is 1 or 2, and the deliberation escalates to an administrator when `n` is 3, so no deliberation holds more than three voting rounds

#### Scenario: A pleb tries to answer
- **WHEN** a pleb submits a proposal or a vote
- **THEN** the request is rejected with 403

### Requirement: Contract check in verification
`make verify` SHALL run a contract check that uses only Node built-ins and fails when either document is not valid JSON, declares the wrong specification version, or leaves an operation without a response definition.

#### Scenario: A document is malformed
- **WHEN** either contract document is not valid JSON
- **THEN** `make verify` fails and names the document

#### Scenario: An operation lacks a response
- **WHEN** an OpenAPI operation has no responses or an AsyncAPI receive operation has no reply
- **THEN** `make verify` fails and names the operation
