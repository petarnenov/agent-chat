## Why

On 2026-11-11 the owner answered the open decisions D2, D4, D5 and D9 and
amended D8: JEV selects exactly one consul. The intent still lists them as
assumptions or describes voting.

## What Changes

- Move D2, D4 and D5 to Owner decisions, dated 2026-11-11.
- Record D9 as accepted for the model and provider: Jev on the TypeSafe cloud
  API. Keep its unanswered parts open.
- Amend D8: JEV selects exactly one consul, which answers with no rounds and no
  voting. The questions form a queue; 400 ms is a target, and a question
  without a selection after 3 seconds is skipped. The fallback to all active
  consuls is removed.
- Amend D8 on 2026-11-12: consuls answer only software and implementation
  questions; JEV gives a fixed reply to any other question.
- Open D11 for a selected consul revoked before it answers.
- Amend D10 on 2026-11-12: the dispatcher adapter uses `@typesafe-ai/sdk`
  behind the port; `ai` and `@ai-sdk/openai-compatible` are dropped.
- Align the consensus protocol, the JEV constraints, the estimate notes, the
  cost drivers, the risks and the phasing with the amended D8.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `owner-decisions`: adds the 2026-11-11 decisions.

- Sync the documents with the intent: `docs/architecture.md`,
  `docs/domain/model.md`, ADR 0003 (amended) and a new ADR 0004 for the
  TypeSafe dispatcher adapter.
- Sync the contracts: remove proposals, votes, rounds, escalation and the
  fallback; add `submitAnswer`, the `selected` or `not-for-consul` routing
  decision, the `dispatcher-reply` message, the skip reasons and the
  `deliberation.consul-selected` and `deliberation.skipped` events; make
  revocation instant; agents only post; mark D2 to D7 decided.
- Sync the pending tasks AC-03 to AC-07, AC-09, AC-10 and AC-12 of
  `planning/outcomes.json`. The completed AC-02 and AC-13 keep their text and
  hashes.

## Impact

`docs/intent/agent-chat.md`, `docs/architecture.md`, `docs/domain/model.md`,
`docs/decisions/0003-agent-runtime-model-port.md`,
`docs/decisions/0004-jev-on-typesafe.md`, `contracts/openapi.json`,
`contracts/asyncapi.json` and `planning/outcomes.json`. No product code
implements the changed behavior yet; the contract version stays 0.1.0.
