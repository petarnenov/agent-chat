# ADR 0001: Adopt the Taskelith workflow

Date: 2026-10-25
Status: Decided by the owner on 2026-10-25 in the project conversation.
Recorded; the runtime parts of the workflow are not implemented.

## Context

Agent Chat is a new, separate project, not a Taskelith module. The owner asked
that the whole Taskelith development workflow be taken over, so that this project
is developed the same way: an OpenSpec change per task, independent review,
contract-first documents, 75% coverage, and `make verify` as the single gate.

Taskelith's workflow is more than its documents: it is enforced by scripts, git
hooks, a Makefile, and a CI workflow. Copying the documents alone would leave
the gates as claims.

## Decisions

1. **Copy the enforcement, not only the prose.** The comment length check, the
   coverage thresholds and scope check, the OpenSpec strict validation, the
   archive dry run, the pinned toolchain, the pre-push and post-merge hooks, and
   the CI verify job are taken over and run in `make verify`.
2. **Single package.** Taskelith's npm workspace layout is not copied. This
   project is one package with `src/`, `test/`, and `scripts/`, so the workspace
   package contract, the boundary check, and the workspace-aware coverage scope
   are unnecessary at this size.
3. **The intent is a durable record.** The idea and the estimate are recorded in
   [the intent document](../intent/agent-chat.md), in English, with the open
   owner decisions listed rather than assumed.
4. **OpenSpec remains the framework.** The framework stays replaceable, as
   [governance](../governance.md) states, but OpenSpec is the default and the
   current choice.

## Adaptations and deferrals

Each of these is a deliberate difference from Taskelith, recorded so that nobody
mistakes it for parity.

| Taskelith gate | Here | Reason |
| --- | --- | --- |
| Workspace boundary check (`check-boundaries.ts`) | Deferred to the first product module | It encodes a package layout this project does not have yet. |
| Contract compatibility check with `oasdiff` | Deferred to the first OpenAPI document | There is no contract to compare, and the check needs Docker. |
| Dependency inventory, SBOM, and license-gap review | Replaced by a direct-dependency register in [docs/dependencies.md](../dependencies.md), checked by `npm run verify:dependencies` | The full inventory needs per-package license research; a register covers the direct dependencies honestly until artifacts exist. |
| Package verification and npm publication | Not copied | The package is private and publication is not authorized. |
| PostgreSQL, NATS, and Docker services in the test target | Not copied | There is no runtime yet; the test target runs compiled tests directly. |
| Microkernel principle | Not adopted | This project exposes no plugin surface. |

## Consequences

- The gates are real and run locally and in CI, but three of them are deferred
  and must arrive with the change that needs them.
- The reviewer configuration, rotation, and review record format are unchanged,
  so the same reviewers can review both repositories.
- Reintroducing a deferred gate is its own tracked change, not a silent edit.
