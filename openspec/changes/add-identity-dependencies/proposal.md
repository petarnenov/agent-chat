## Why

Task AC-03 needs a PostgreSQL driver, an HTTP framework, and contract tooling.
The outcome runner's workers have no shell and cannot regenerate
`package-lock.json`, so the packages must reach `dev` before AC-03 runs. On
2026-11-10 the owner approved the exact list in this change.

## What Changes

- Add the runtime dependencies `pg`, `hono`, `@hono/node-server`, `ajv`, and
  `ajv-formats` at exact versions.
- Add the development dependencies `@types/pg` and `openapi-typescript` at exact
  versions.
- Update `package-lock.json` and add the rows to `docs/dependencies.md`.

No product code uses the packages yet; AC-03 does.

## Capabilities

### New Capabilities

- `identity-dependencies`: the packages approved for the identity delivery and
  how they are pinned.

### Modified Capabilities

None.

## Impact

`package.json`, `package-lock.json`, and `docs/dependencies.md`. Installing the
project now also installs the listed packages and their transitive dependencies.
