## Context

`outcome-runner` executes one queue task as one OpenSpec change and one pull
request, without asking a person anything. It selects work from the queue on
`origin/<target>`, and the target here is `dev`. Its workers can only read and
write files and run the frozen project checks; they have no shell.

## Goals and non-goals

Goals: commit a queue that matches the intent phasing, and record the authority
under which the runner may operate.

Non-goals: running any outcome, changing the governance documents, promoting
`dev` to `main`, or deciding the open owner decisions.

## Decisions

### Queue layout

The queue is `planning/outcomes.json` and receipts live in `evidence/results`, the
locations the runner documents. Task scopes do not overlap these roots or
`openspec/changes`. Each task maps to one phase of the intent, and priorities
follow the phase numbers.

### Open owner decisions stay assumptions

Criteria use the assumptions recorded for D2 to D7 and D9 in the intent and label
them as assumptions. They do not become owner decisions through this change. The
console technology has no assumption, so AC-10 reports itself blocked until the
owner records one in `docs/architecture.md`.

### No dependency changes inside runner outcomes

A worker has no shell and cannot regenerate `package-lock.json`, and the runner
installs dependencies only before planning. Tasks therefore use only locked
packages and report themselves blocked otherwise. Dependencies reach the
repository through a separate interactive change, which is not part of this one.

### Review exception

On 2026-11-10 the owner accepted a review exception for outcomes the runner
executes. For those outcomes, the runner's automatic review in a separate session
of the selected harness replaces the assigned reviewer from the governance list,
along with the recorded reviewer session and the file snapshots. The exception is
an accepted deviation: it does not mark an independent review as passed, and
outcome records must not claim one. It does not cover work done outside the
runner, with one exception: the owner extended it on 2026-11-10 to this change.

### Integration authority

On 2026-11-10 the owner authorized the runner to merge accepted outcomes into
`dev`. The authority covers `dev` only. Merging into `main`, publication, and
deployment remain with the owner. The runner does not archive changes, so the
archive step of the agent task protocol stays a separate action.

## Risks and trade-offs

- The `pre-push` hook refuses a push of any commit other than the checked-out
  one, and the runner pushes claims that way from the primary clone. A clone with
  `core.hooksPath` enabled cannot claim work. The invocation therefore installs
  with `npm ci --ignore-scripts` instead of `make setup`, which would enable the
  hook; `make verify` still runs as a frozen check of every outcome.
- The runner labels every implementation commit `feat`, including documentation
  outcomes, so a later promotion to `main` can produce a minor release.
