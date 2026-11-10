## Context

The runner skips a task whose scope overlaps a task that another run has claimed.
Every remaining queue task depends on AC-03 and includes `src`, so a parallel run
needs a task with its own scope.

## Decisions

AC-13 records the decisions D3, D6, and D7 in the intent document. D3 stays manual:
every agent waits for approval by a human administrator. D6 is a single
installation. D7 is issued API keys.

The task has no dependencies and is scoped to `docs/intent`, which no other task
uses.

AC-13 runs in a separate clone, because a local lock refuses a second active
invocation in one clone.

## Risks and trade-offs

- Merging this change advances `dev` while AC-03 runs. The advance is outside the
  AC-03 scope and change directory, so the runner merges it and repeats the final
  checks.
- The outcome is small, so it shows how two harnesses share a repository, not how
  they compare on work of similar size.
