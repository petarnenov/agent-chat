# Governance policy

Policy version: 1 (2026-10-25). Status: repository policy; runtime enforcement
is not implemented. Adopted from the Taskelith workflow at the owner's request;
see [ADR 0001](decisions/0001-adopt-the-taskelith-workflow.md).

## Authority

The owner, Petar Nenov, defines scope and accepts product and architecture
decisions. Contributors and agents may propose work, inspect the repository, and
implement authorized changes. An instruction to continue authorizes the next
bounded work item; it does not authorize the whole plan in the intent document.

The implementer records author checks. An independent reviewer must be a person
or separately authorized agent that did not author the change; self-review is
never independent review. The owner may explicitly accept a documented review
exception for bounded work. Never infer an exception from silence, and never
mark a review as passed because an exception was granted.

The owner or an explicitly authorized integrator controls merging and pushing.
Finishing local work does not itself authorize integration. Merging the
integration branch into `main` is owner-only. Release authority follows
[the release policy](releases.md). Deployment requires separate owner
authorization.

## Independent review process

- **Authorized reviewers** (owner). Each runs read-only, with the model and
  effort set in the invocation, not only in the prompt. `verification.md`
  records the invocation; where a tool reports the model or effort in its output
  or log, that report is recorded as confirmation.
  - Codex CLI: model `gpt-6.1-sol`, `model_reasoning_effort = "medium"`,
    sandbox `read-only`. In this configuration it has had no network access.
  - Antigravity CLI: model `gemini-4-argon-medium`, effort `medium`, mode
    `plan`. In this configuration it has fetched public web pages.
  - OpenCode CLI: model `opencode/deepseek-v4.1-flash` with the `high` variant,
    set in the invocation; agent `reviewer`, which denies editing and allows
    only an allowlist of read-only shell commands. A pattern allowlist is not a
    sandbox, so the snapshot remains the proof.
  - Claude Code: model `claude-fable-5-1`, effort `medium`, permission mode
    `plan`, editing tools disallowed.
- **One reviewer per task.** Each task has one assigned reviewer, and no second
  reviewer cross-reviews it. Re-review passes by the assigned reviewer are
  allowed. A switch under "Unavailable reviewer" replaces the assigned reviewer;
  it is not a cross-review.
- **Rotation.** Consecutive tasks go to different reviewers in turn, unless a
  task needs a particular reviewer. The order is the list above, returning to
  the first after the last, and a reviewer that is unavailable, paused, or
  unable to meet the task's review requirements is skipped.
- **Unavailable reviewer.** A reviewer that is unavailable for any reason is not
  used for the next 30 minutes, and the next reviewer is proposed instead.
  Unavailable means that a review attempt does not run to a report, for example
  an error, a run that opens no session, a quota limit, or an outage; a pass
  that runs and reports findings is not unavailability. The replacement reviews
  the remaining passes: its first pass confirms the earlier passes' findings and
  then reviews the whole task. Failed attempts do not count toward the pass cap,
  and the pass count carries over. `verification.md` records each failed
  attempt with its time, and the switch.
- **External facts.** A task whose review depends on external facts goes to a
  reviewer with network access.
- **Proof of read-only review.** Take a SHA-256 snapshot of all tracked and
  untracked files before and after each pass, plus any external evidence
  directory shared with the reviewer. A change made by the reviewer invalidates
  the pass.
- **Review prompt.** The prompt names the [ADR 0002 principles](decisions/0002-first-class-engineering-principles.md)
  as criteria and asks for every instance of a problem, not examples.
  `verification.md` records the reviewer, model, effort, session ID, findings,
  and their resolution.
- **Before the first pass.** The author self-checks the change against the
  review criteria and runs the evidence check, and `verification.md` records
  both. The evidence check means that every external link is pinned to a tag,
  commit, or exact version, or labeled as an unversioned page.
- **At most three passes per task.** If Critical, High, or Medium findings
  remain after the third pass, the author stops and presents options to the
  owner: fix them without review (recorded as unreviewed fixes), accept them as
  a known risk, or defer them. Any further pass needs the owner's permission.
- **Low findings are fixed.** If a pass finds only Low findings, they are fixed
  and recorded as unreviewed fixes, and the reviewer is not called again. Low
  findings reported together with higher-severity findings are fixed with them
  and checked in the next pass or, after the third pass, recorded as unreviewed
  fixes.

## Lifecycle and records

Every task, including inspection, documentation, maintenance, and emergency
work, binds to a change of the selected SDLC framework, without exception.
OpenSpec is the framework of this repository, and its pinned CLI runs through
`npm run openspec -- ...`.

| Stage | Required record and transition |
| --- | --- |
| Propose and inspect | Owner request or authorized parent scope, bounded proposal, impacted capability, and exclusions. |
| Specify and design | Testable requirements and design; documentation-only work declares no runtime impact. Record unresolved decisions rather than inventing approval. |
| Implement | Task checklist and changes within the recorded scope. Material scope expansion returns to proposal. |
| Verify | Exact commands, results, environment, relevant revision or reviewed diff, limitations, and remaining gates in `verification.md`. Run `make verify`, which includes the tests and strict validation of all OpenSpec artifacts. |
| Review | Record author review separately from independent findings, reviewer identity, reviewed revision, and resolution. Structural validation is not semantic approval. |
| Accept and integrate | Owner acceptance or explicit delegated authority, required review or recorded exception, and current verification. Record the integrated revision when integration occurs. |
| Close | Reconcile tasks and evidence; archive using the pinned CLI only after acceptance and integration gates are satisfied. |

The proposal, design, capability specification, tasks, and verification record
form the evidence set. Reference the originating issue when one exists; no issue
is required merely to duplicate an already recorded owner request. Task
checkboxes show progress, not approval authority.

## Evidence freshness

Tie review to the actual source revision, or to a base revision and explicitly
identified working-tree diff before a commit exists. Record commands against the
resulting tree. Changes to requirements, policy, implementation, or verification
inputs invalidate affected evidence; repeat the relevant checks and obtain
renewed review before acceptance, except where the independent review process
allows unreviewed fixes, which are recorded as such. Documentation-only edits
need editorial and reference checks, not invented runtime coverage.

Do not rewrite historical records as if this policy applied before it existed.
Passing local checks does not prove CI execution, external deployment,
distributed recovery, or independent review.

## Framework independence

OpenSpec is the framework this repository uses. It is not a product dependency:
a later project-maintainer decision may select another framework whose pinned
tooling has been admitted through the dependency policy. Every task stays bound
to a change of the selected framework.
