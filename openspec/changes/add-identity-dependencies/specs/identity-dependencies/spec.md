## Purpose

Define which packages are approved for the identity delivery and how they stay pinned and registered.

## ADDED Requirements

### Requirement: Approved identity packages
The project SHALL depend on the packages approved by the owner for the identity delivery at their exact versions, with `pg`, `hono`, `@hono/node-server`, `ajv`, and `ajv-formats` as runtime dependencies and `@types/pg` and `openapi-typescript` as development dependencies.

#### Scenario: A clean install
- **WHEN** the dependencies are installed from `package-lock.json`
- **THEN** every approved package resolves to its exact approved version

#### Scenario: A package is missing from the register
- **WHEN** an approved package has no row in `docs/dependencies.md`
- **THEN** `make verify` fails and names the package
