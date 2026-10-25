## Why

The owner asked on 2026-10-26 to record the stack decision that came out of the
research on agent frameworks. The intent left the runtime open, and the choice
affects the first product change, the dependency register, and the test strategy.

## What Changes

- Add [ADR 0003](../../docs/decisions/0003-agent-runtime-model-port.md): no agent
  framework; `ai` with `@ai-sdk/openai-compatible` and `zod` behind a
  `ModelPort`; consensus, audit, and revocation as a PostgreSQL transition table.
- Record the decision as D10 in the intent and adjust the phasing so that the
  routing change includes the port.
- Note the model port in the architecture's port list.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The decision is documentation only; the `project-workflow` capability does
not name a runtime.

## Impact

Documentation only. No dependency is installed, no code changes, and the 400 ms
bound remains unproven until a local benchmark runs.
