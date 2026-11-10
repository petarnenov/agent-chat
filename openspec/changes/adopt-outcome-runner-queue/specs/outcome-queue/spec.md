## Purpose

Define how outcomes are queued, authorized, reviewed, and integrated when the outcome runner executes them in this repository.

## ADDED Requirements

### Requirement: Committed outcome queue
The repository SHALL define runner outcomes in `planning/outcomes.json` on the target branch and SHALL keep accepted receipts under `evidence/results`, and each task SHALL map to one OpenSpec change and one pull request.

#### Scenario: A task scope overlaps a controller root
- **WHEN** a task scope overlaps `planning/outcomes.json`, `evidence/results`, or `openspec/changes`
- **THEN** the runner refuses to start

#### Scenario: A task is edited after authorization
- **WHEN** a task differs from the hash in its invocation file
- **THEN** the runner refuses to execute that task

### Requirement: Explicit authority for each run
A runner invocation SHALL be kept outside the repository and SHALL carry the owner's actual instruction and the exact hash of every task it authorizes.

#### Scenario: A queued task is not in the invocation
- **WHEN** a queue task has no hash in the invocation authority
- **THEN** the runner does not execute that task

### Requirement: Runner review exception
Outcomes executed by the runner SHALL use the runner's automatic review under the owner's documented exception, and their records SHALL NOT claim an independent review.

#### Scenario: An outcome is accepted by the runner
- **WHEN** the runner's automatic review accepts an outcome
- **THEN** `verification.md` of that outcome claims no independent review

#### Scenario: Work is done outside the runner
- **WHEN** a change is developed outside the runner
- **THEN** the independent review process of the governance policy applies to it

### Requirement: Integration limited to the development branch
The runner SHALL merge accepted outcomes only into `dev`, and promotion to `main`, publication, and deployment SHALL remain with the owner.

#### Scenario: An invocation targets another branch
- **WHEN** an invocation for this repository targets a branch other than `dev`
- **THEN** it falls outside the recorded integration authority and is not used
