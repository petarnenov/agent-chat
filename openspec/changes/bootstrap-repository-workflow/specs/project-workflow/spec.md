## Purpose

Define the development gates this repository runs, so that every change is verified, reviewed, and tracked the same way.

## ADDED Requirements

### Requirement: Single verification gate
The repository SHALL provide one `make verify` target that runs the comment rule, the compiled tests with coverage thresholds, the type check, the dependency register check, strict OpenSpec validation, and the archive dry run, and the CI verify job SHALL call the same target.

#### Scenario: A comment breaks the length rule
- **WHEN** a tracked comment spans more than two lines, or a comment line exceeds 80 characters
- **THEN** `make verify` fails and names the file and line

#### Scenario: Coverage falls below the threshold
- **WHEN** the compiled product code falls below 75% of lines, branches, or functions
- **THEN** `make verify` fails

#### Scenario: A product module is not loaded by any test
- **WHEN** a module under `src/` is missing from the coverage report
- **THEN** `make verify` fails and names the module

### Requirement: Pinned toolchain
The repository SHALL pin Node.js in `.nvmrc` and npm in the CI workflow, and the gate SHALL fail when either differs from the pin.

#### Scenario: A different Node.js is active
- **WHEN** the active Node.js version differs from `.nvmrc`
- **THEN** `make verify` fails before running the other checks and names the expected version

### Requirement: SDLC binding
Every task SHALL be bound to an OpenSpec change, and the gate SHALL validate all OpenSpec artifacts strictly and archive every active change in a temporary copy.

#### Scenario: A change cannot be archived
- **WHEN** an active change has a missing purpose or an invalid specification delta
- **THEN** `make verify` fails with the archive problem

### Requirement: Dependency register
Every direct dependency SHALL be registered in `docs/dependencies.md` with its locked version, scope, declared license, and review date, and the gate SHALL fail on a missing, extra, or mismatched entry.

#### Scenario: A dependency is added without a register row
- **WHEN** `package.json` lists a direct dependency that the register does not
- **THEN** `make verify` fails and names the dependency

#### Scenario: A registered version drifts from the lockfile
- **WHEN** the register names a version that differs from `package-lock.json`
- **THEN** `make verify` fails and names both versions

### Requirement: Push gate
The repository SHALL provide a pre-push hook that runs `make verify` and refuses a push of any commit other than the checked-out one.

#### Scenario: A push includes another commit
- **WHEN** the push updates a ref whose commit is not the checked-out head
- **THEN** the hook refuses the push and names the ref

### Requirement: Release without publication
The CI workflow SHALL verify every promotion to `main` and SHALL create a tag and release notes for qualifying Conventional Commits, and it SHALL NOT publish the package.

#### Scenario: A documentation promotion
- **WHEN** a promotion to `main` contains only `docs:` commits
- **THEN** verification runs and no release is created

#### Scenario: A feature promotion
- **WHEN** a promotion to `main` contains a `feat:` commit
- **THEN** verification runs and a minor release tag and release notes are created
