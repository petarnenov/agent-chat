## Why

The outcome runner blocked AC-03 on 2026-11-12 for two reasons its workers
cannot resolve. A worker has no shell or network, so it cannot obtain a verified
digest for the Node.js and PostgreSQL images that ADR 0002 requires to be pinned.
The AC-03 specification also requires a 400 response for an invalid `listAgents`
page token, but `contracts/openapi.json` declares none, and AC-03 may not change
the contract.

## What Changes

- Add `docs/images.md`, a register of the base images with their tags and the
  `sha256` digests of their multi-arch OCI image indexes, read from Docker Hub.
- Declare `400` (`BadRequest`) for `listAgents` in `contracts/openapi.json`.
- Declare `403` (`Forbidden`) for `getOwnAgent`, which the contract's own
  revocation rule already requires for any request after a chat-wide
  revocation.

## Capabilities

### New Capabilities

- `container-images`: a register of the base images and their verified digests.
- `identity-contract`: the error responses of the identity read operations.

### Modified Capabilities

None.

## Impact

Only `docs/images.md`, `contracts/openapi.json` and this change are edited. No
code, test, dependency, queue or governance file changes. The contract
`info.version` stays `0.1.0`: both additions declare behavior the contract
already implies. No image is pulled, built or run.

## Acceptance criteria

Owner instruction, 2026-11-12: take the digests for `node:24.22.1` and
`postgres`, show them to the owner, and fix `contracts/openapi.json` with 400
for `listAgents` and 403 for `getOwnAgent`.
