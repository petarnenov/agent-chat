# Verification: define-chat-contracts

## Scope and source

Queue task AC-02 of `planning/outcomes.json`, executed by the outcome runner on
branch `outcome/AC-02-5d12e367c6a5`. Base revision: `7cb313b`. The proposal,
design, and spec delta of this change were bound before implementation and
were not modified.

## Environment

The worker had no shell. It read and wrote files through the runner and ran the
runner's frozen project checks, which execute `make verify` in this worktree.

## Changes checked

- `contracts/openapi.json`: OpenAPI 3.1.0, `info.version` 0.1.0.
- `contracts/asyncapi.json`: AsyncAPI 3.0.0, `info.version` 0.1.0.
- `docs/domain/model.md` and a Contracts section in `docs/architecture.md`.
- `scripts/check-contracts.ts`, the `verify:contracts` script in
  `package.json` (no dependency change), and its step in `make verify` after
  the comment check.

## Checks

Command: `make verify`, run through the runner's frozen checks. Two runs were
made before the work was committed, when `scripts/check-contracts.ts` was still
untracked; their comments were then checked by hand against the rule (at most
two lines of at most 80 characters). A later run on the committed branch
(head `5453384`, with the script tracked and so covered by the comment check)
also passed; only this section changed after it. Every run passed with these
results:

- `npm run verify:comments`: "Every comment is within the comment length
  rule."
- `npm run verify:contracts`: "The contracts are valid: contracts/openapi.json
  and contracts/asyncapi.json."
- `make test`: 1 test passed, 0 failed; coverage of `dist/index.js` 100% lines,
  branches, and functions; "Every product module is in the coverage report."
- `npm run check:types`: no errors.
- `npm run verify:dependencies`: "Every direct dependency is registered: 8."
- `npm run openspec -- validate --all --strict --no-interactive`: 4 passed,
  0 failed, including `change/define-chat-contracts`.
- `npm run verify:archive`: "Every active OpenSpec change archives into
  strictly valid specs."

The runner reported the outcome of the latest run as `passed` for `make
verify`; the step outputs above were recorded from the earlier runs.

The contract check runs built-in fixtures before the real documents and fails
if any is misjudged: a valid OpenAPI and a valid AsyncAPI document must pass;
invalid JSON for each document, OpenAPI 3.0, AsyncAPI 2.6, an OpenAPI
operation without or with empty `responses`, an AsyncAPI operation without
messages, an AsyncAPI `receive` operation without a `reply`, and an unresolved
`$ref` must fail. The passing runs show that every fixture was judged as
expected. The fixtures prove the check's detection; the check has no unit test
under `test/`, which is outside this task's scope, as the design records.

## Review

Independent review: not performed, and not passed. This outcome is subject to
the runner's automatic review under the owner's documented exception; this
record claims no independent review.

## Not performed

- No CI run and no deployment validation occurred.
- The documents were not validated against the official OpenAPI or AsyncAPI
  meta-schemas; the check is structural, as the design records.
- No implementation exists, so no behavior in the contracts is proven yet.

## Remaining gates

- The runner's automatic review, integration into `dev`, and the archive step.
- Owner decisions D2 to D7 and D9 remain open; the contracts use them as
  assumptions.
