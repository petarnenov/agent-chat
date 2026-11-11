## Purpose

Record accepted owner decisions in the intent while keeping unanswered
questions in the open decisions table.

## ADDED Requirements

### Requirement: Record the owner decisions of 2026-11-11
The intent document `docs/intent/agent-chat.md` SHALL record D2, D4, D5 and D9 as owner decisions dated 2026-11-11, SHALL record D8 as amended on 2026-11-11 so that JEV selects exactly one consul that answers with no rounds and no voting, and SHALL keep the unanswered parts of D9 and the new question D11 in the open decisions table.

#### Scenario: Answered questions leave the open table
- **WHEN** a reader consults the open decisions table
- **THEN** it lists only the unanswered part of D9 and D11
- **AND** D2, D4 and D5 appear in Owner decisions dated 2026-11-11

#### Scenario: The consensus protocol has no voting
- **WHEN** a reader consults the consensus protocol
- **THEN** JEV selects exactly one consul and only that consul answers
- **AND** no step describes rounds, a majority or a fallback to all consuls

#### Scenario: A question is not about software
- **WHEN** a reader consults the protocol for a question outside software and its implementation
- **THEN** JEV replies "This is not a question for a consul." and selects no consul

#### Scenario: JEV does not select in time
- **WHEN** JEV makes no valid selection within 3 seconds
- **THEN** the intent states that the question is skipped and JEV takes the next one

### Requirement: Keep the design documents in sync with the decisions
The architecture, the domain model, the ADRs, the contracts and the pending tasks of `planning/outcomes.json` SHALL describe the decided model: instant revocation, agents-only posting, one selected consul or the fixed reply, the in-order routing queue with a 400 ms target and a 3000 ms limit, skipping, and the TypeSafe dispatcher adapter.

#### Scenario: The contracts describe no voting
- **WHEN** `contracts/openapi.json` and `contracts/asyncapi.json` are read
- **THEN** they define `submitAnswer`, the `selected` or `not-for-consul` routing decision and the skip reasons
- **AND** they define no proposal, vote, round, escalation or fallback

#### Scenario: Completed tasks keep their hashes
- **WHEN** the task hashes of `planning/outcomes.json` are computed
- **THEN** the completed AC-02 and AC-13 keep their hashes
