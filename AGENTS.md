# Agent Chat contributor instructions

## Identity and language

- Product: Agent Chat. Repository and npm package: `agent-chat`.
- All repository content, documentation, comments, specifications, issues,
  commits, and pull requests must be English.
- Chat, progress updates, reports, and final answers addressed to the owner must
  be Bulgarian. Preserve exact technical identifiers.

## Scope and architecture

- Implement only the requested work. The intent document and the architecture
  draft are roadmaps, not implementation authorization.
- Product-owned code is TypeScript.
- Follow [docs/architecture.md](docs/architecture.md): hexagonal modules,
  explicit ports and adapters, and established open-source dependencies.
- Design and review every change against the first-class principles in
  [ADR 0002](docs/decisions/0002-first-class-engineering-principles.md): Clean
  Code, SOLID, hexagonal architecture, Docker, contract-first OpenAPI, a
  Makefile-driven workflow, a mandatory SDLC framework with OpenSpec, and code
  coverage of at least 75% of lines, branches, and functions.
- A code comment is at most two lines of at most 80 characters each. Count
  every line of the comment, including the `/**` and `*/` lines of a block
  comment, and count indentation and the comment marker; a trailing comment
  counts its whole physical line. The rule applies to every comment in tracked
  authored source, script, build, and configuration files (`*.ts`, `*.mts`,
  `*.cts`, `*.js`, `*.mjs`, `*.cjs`, `*.sh`, `*.yml`, and `*.yaml` files, files
  named `Makefile` or `Dockerfile`, and extensionless scripts), whether or not a
  change's diff touches it. Generated files and lockfiles are exempt.
  `make verify` enforces the rule through `npm run verify:comments`.
- Keep the scaffold status honest; do not expose commands that imply
  unimplemented behavior.

## SDLC

- Every agent task must be tracked through the selected SDLC framework,
  including documentation and maintenance.
- Every task that develops this project is bound to an OpenSpec change, without
  exception. OpenSpec is the default and the current framework; the framework
  stays replaceable, as [governance](docs/governance.md) states.
- Use the pinned local CLI through `npm run openspec -- ...`.
- Record scope, requirements, verification evidence, and remaining gates. Do not
  claim independent review or deployment validation that did not occur.
- Follow the [independent review process](docs/governance.md#independent-review-process):
  authorized read-only reviewers, one reviewer per task with a replacement when
  that reviewer is unavailable, at most three passes, and Low-only passes fixed
  without another review.
- When several agent sessions work in parallel, follow the
  [agent task protocol](docs/agent-task-protocol.md): workers develop and hand
  off one task at a time, and the coordinator integrates and archives it. A
  session whose context approaches 150,000 tokens tells the owner and
  recommends `/compact` or `/clear`.
- Publication and deployment require owner authorization.

## Checks and commits

- Run `make setup` once per worktree (it installs the dependencies and enables
  the hooks, which are shared repository configuration); `make doctor` checks
  the environment. `make verify` must pass before every push; the `pre-push`
  hook enforces it.
- Develop each change on its own feature branch in its own git worktree, so
  changes can proceed in parallel, and target `dev`, the default branch. Only
  promotion pull requests from `dev` target `main` (see
  [docs/releases.md](docs/releases.md)).
- Use conventional commit messages without attribution or session trailers.

## Automated release policy

- Follow [docs/releases.md](docs/releases.md) for commit classification and
  release behavior.
- The owner authorizes automatic releases from `main` after all verification
  gates pass.
- npm publication is disabled until the owner authorizes it. Do not add npm
  publish tokens.
