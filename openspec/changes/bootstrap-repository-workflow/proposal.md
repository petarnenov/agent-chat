## Why

The owner asked on 2026-10-25, in Bulgarian and paraphrased here, to create a new
repository for the agent chat idea and to take over the whole Taskelith
development workflow, then to record the idea and the analysis in an intent
file. The project starts empty, so the workflow has to arrive before any product
work does; otherwise the first change would be developed without the gates it is
supposed to follow.

## What Changes

- Add the workflow documents: `AGENTS.md`, governance with the independent
  review process, the agent task protocol, the release policy, and two ADRs
  recording the adoption and the engineering principles.
- Add the enforcement: a `Makefile`, the pinned toolchain scripts, the comment
  length check, the compiled tests with 75% coverage and the coverage scope
  check, the dependency register check, strict OpenSpec validation, the archive
  dry run, the pre-push and post-merge hooks, and the CI verify and release
  workflow.
- Add the OpenSpec project configuration and this change.
- Add the intent document with the idea, the scope, the open owner decisions,
  the estimate, the cost drivers, the risks, and the proposed phasing.
- Add the architecture draft with the module map, the invariants, and the open
  decisions.
- Add a scaffold product module and its test so that the coverage gate runs on
  real compiled code instead of being assumed.

## Capabilities

### New Capabilities

- `project-workflow`: the verification gate, the pinned toolchain, the SDLC
  binding, the dependency register, and the push gate.

### Modified Capabilities

None; this is the first change in the repository.

## Impact

Documentation, tooling, and one scaffold module. No product behavior, no API, and
no runtime. Three Taskelith gates are deliberately deferred and recorded in
[ADR 0001](../../docs/decisions/0001-adopt-the-taskelith-workflow.md): the
workspace boundary check, the OpenAPI compatibility check, and the full
dependency inventory with SBOM. npm publication stays disabled.
