## Why

On 2026-11-10 the owner decided D3, D6, and D7 of `docs/intent/agent-chat.md`, and
asked for one independent outcome that the Codex harness can run in parallel with
AC-03. Those decisions still appear as open assumptions in the intent document.

## What Changes

- Add task AC-13 to `planning/outcomes.json`. Its only product scope is
  `docs/intent`, so it does not overlap AC-03.
- Record the owner's review exception for this change.

No other task changes, and their hashes stay the same. The task runs under its own
invocation file.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change adds one queue entry under the existing queue requirement of
`adopt-outcome-runner-queue`, so it declares no spec delta.

## Impact

`planning/outcomes.json` only, apart from this change.
