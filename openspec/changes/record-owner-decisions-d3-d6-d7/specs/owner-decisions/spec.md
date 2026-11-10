## Purpose

Record accepted owner decisions in the intent while preserving unresolved
questions and the strict documentation-only boundary of task AC-13.

## ADDED Requirements

### Requirement: Record accepted owner decisions

The intent document `docs/intent/agent-chat.md` SHALL record D3, D6 and D7 in
Owner decisions, each dated 2026-11-10, and SHALL remove their former rows from
Owner decisions still open.

#### Scenario: Manual approval applies to every agent

- **WHEN** a reader consults accepted decision D3
- **THEN** it states that approval is manual and every agent waits for approval
  by a human administrator, including an agent that already holds a credential
- **AND** it states that automatic admission does not exist
- **AND** the decision date is 2026-11-10

#### Scenario: Installation scope is accepted

- **WHEN** a reader consults accepted decision D6
- **THEN** it records a single installation with date 2026-11-10

#### Scenario: Agent credentials are accepted

- **WHEN** a reader consults accepted decision D7
- **THEN** it records issued API keys, stored hashed and revocable without a
  restart, with date 2026-11-10

### Requirement: Preserve unresolved decisions and scope

AC-13 SHALL leave D2, D4, D5 and D9 in the open decisions table with their text
unchanged. It SHALL change no other intent content, no other file under
`docs/intent`, and no contract, code, queue or governance document. Its only
additional edits SHALL be artifacts in this OpenSpec change.

#### Scenario: Open questions remain intact

- **WHEN** the updated open decisions table is compared with the original
- **THEN** D2, D4, D5 and D9 remain with their question and assumption text unchanged
- **AND** D3, D6 and D7 appear only in the Owner decisions table

#### Scenario: Documentation-only scope is checked

- **WHEN** the final change is inspected
- **THEN** the only intent edits are the three moved and finalized decision rows
- **AND** all other edits are confined to this OpenSpec change

### Requirement: Respect specification phase boundaries

The specification session SHALL write only proposal.md, design.md, tasks.md,
verification.md and specs/owner-decisions/spec.md in this change. Product edits
and frozen checks SHALL wait for specification binding in a later session.

#### Scenario: Planning is ready before binding

- **WHEN** the five planning artifacts have been prepared
- **THEN** planning is ready for binding without product writes or frozen checks
- **AND** implementation and checks remain pending rather than reported as blockers

### Requirement: Record observed verification evidence

Completed AC-13 SHALL pass `make verify` and its verification record SHALL state
exact commands and observed results without claiming independent review, CI
execution or deployment validation that did not occur.

#### Scenario: Check results are recorded honestly

- **WHEN** author verification is complete after binding and implementation
- **THEN** verification.md records the exact executed checks and their results
- **AND** it distinguishes author checks from any remaining lifecycle gates

#### Scenario: Checks have not run during planning

- **WHEN** the specification session records its evidence
- **THEN** verification.md states that make verify has not run
- **AND** it records successful project verification as a remaining gate
