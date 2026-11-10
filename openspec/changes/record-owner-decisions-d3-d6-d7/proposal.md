## Why

AC-13 records the owner's decisions of 2026-11-10. D3, D6 and D7 currently
appear as assumptions in the intent's open decisions table.

## What Changes

- Move D3, D6 and D7 to Owner decisions, dated 2026-11-10.
- State that every agent waits for manual approval by a human administrator,
  including an agent that already holds a credential; automatic admission does
  not exist.
- Record a single installation and issued API keys stored hashed and revocable
  without a restart.
- Preserve the open D2, D4, D5 and D9 rows verbatim.

## Capabilities

### New Capabilities

- `owner-decisions`: documentation requirements for the accepted D3, D6 and D7
  decisions and preservation of the remaining open decisions.

### Modified Capabilities

None.

## Impact

The completed AC-13 change may edit only `docs/intent/agent-chat.md` and this
OpenSpec change. This specification phase writes only proposal.md, design.md,
tasks.md, verification.md and specs/owner-decisions/spec.md in this change.
No product writes or checks are attempted before specification binding in a
later session. This is an expected phase boundary, not a blocker.
No other intent, contract, code, queue or governance document is changed.
This documentation change authorizes no product implementation.

## Acceptance criteria

Source: task AC-13, "Record owner decisions D3, D6 and D7", priority 13,
scope `docs/intent`, dependencies: none. Supplied criteria, verbatim:

- In docs/intent/agent-chat.md, move D3, D6 and D7 from the open decisions table to the Owner decisions table with the date 2026-11-10.
- Record D3 as: approval is manual, so every agent waits for approval by a human administrator, including an agent that already holds a credential, and automatic admission does not exist.
- Record D6 as: a single installation. Record D7 as: issued API keys, stored hashed and revocable without a restart.
- Keep D2, D4, D5 and D9 in the open decisions table with their text unchanged.
- Change no other file under docs/intent, and no contract, code, queue or governance document.
- make verify passes.
- Complete this OpenSpec change with proposal.md, design.md, tasks.md, verification.md and a spec delta; a delta that creates a capability starts with a Purpose of at least 50 characters.
- verification.md records the exact commands and results and claims no independent review, CI run or deployment validation that did not occur.
