## Why

The owner asked on 2026-11-10, in Bulgarian and paraphrased here, to create an
outcome file so that implementation can start through the globally installed
`outcome-runner` package, and then to prepare this change for that file and for
the receipt directory. The runner reads its queue from the target branch, so the
queue has to be committed on `dev` before any outcome can run.

The owner also accepted a review exception for outcomes the runner executes and
authorized the runner to merge into `dev`. Governance requires that an exception
is documented and that integration authority is explicit, so both are recorded
here.

## What Changes

- Add `planning/outcomes.json`, a version 1 queue with the tasks AC-02 to AC-12,
  one per remaining phase of `docs/intent/agent-chat.md`.
- Add `evidence/results/.gitkeep`, the root for accepted outcome receipts.
- Record the owner's review exception and integration authority for runner
  outcomes.
- Record the runner constraints that shape the queue.

No product code, contract, dependency, gate, or governance document changes. The
change authorizes no outcome by itself: each run needs an invocation file with
the owner's instruction and the exact task hashes.

## Capabilities

### New Capabilities

- `outcome-queue`: how outcomes are defined, authorized, reviewed, and integrated
  when the outcome runner executes them.

### Modified Capabilities

None.

## Impact

Adds two tracked paths outside `src/`. `make verify` is unaffected apart from
validating this change.
