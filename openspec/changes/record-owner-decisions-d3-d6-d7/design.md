## Context

Task AC-13 supplies the exact owner decisions and acceptance date. The intent
already contains Owner decisions and Owner decisions still open tables.
These artifacts specify `record-owner-decisions-d3-d6-d7`; the harness must
bind the specification in a later session before implementation or frozen checks.

## Goals / Non-Goals

Record D3, D6 and D7 as accepted decisions dated 2026-11-10 while retaining
D2, D4, D5 and D9 verbatim in the open table. No runtime behavior, API,
dependency, architecture, queue or governance change is authorized.

## Decisions

Use the existing table columns and insert these rows after D1, in numerical
order, during the later implementation session:

| # | Decision | Date |
| --- | --- | --- |
| D3 | Approval is manual, so every agent waits for approval by a human administrator, including an agent that already holds a credential, and automatic admission does not exist. | 2026-11-10 |
| D6 | A single installation. | 2026-11-10 |
| D7 | Issued API keys, stored hashed and revocable without a restart. | 2026-11-10 |

Remove only their former open-table rows. Keep all other intent content
unchanged, including the D9 bootstrap assumption: D9 remains unresolved and is
not silently decided by this documentation change. These are recorded decisions,
not claims of implemented functionality.

Use the `owner-decisions` documentation capability delta with a Purpose of at
least 50 characters, ADDED requirements and WHEN/THEN scenarios. No contracts
or product code are needed.

## Risks / Trade-offs

D9 may appear in tension with D3. Retain D9 verbatim rather than deciding its
bootstrap question. Updating architecture or contracts is outside AC-13.
The small table edit needs editorial comparison and project checks, not new
runtime tests or invented runtime coverage.

## Verification

This session inspects and writes only the five planning artifacts. It does not
attempt product writes or run_checks. Specification binding and those operations
belong to the later session and are not blockers for planning readiness.

After binding, inspect the diff for exactly three new accepted rows and three
removed open rows, and compare all remaining intent text to the original.
Run `make verify` through the frozen project checks and record the exact commands
and observed results from the checks context. Keep author checks separate from
independent review.

## Remaining gates

Implementation, successful verification, independent review under existing
governance, integration and archive remain separate lifecycle gates.
Do not infer a review exception or claim CI execution or deployment validation.
