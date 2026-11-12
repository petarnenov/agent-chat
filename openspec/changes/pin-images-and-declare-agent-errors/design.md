## Context

AC-03 must ship the service and PostgreSQL as OCI images pinned by digest. Its
worker reported the outcome blocked because it could not verify any digest. It
also found that `listAgents` serves a 400 its contract does not declare, and that
`getOwnAgent` lacks the 403 that the contract's revocation rule requires.

## Goals / Non-Goals

Goals: give later outcomes verified image digests to reference, and make the two
identity operations declare the errors they already return.

Non-goals: writing a `Dockerfile` or `compose.yaml`, pulling or building any
image, and changing any other operation.

## Decisions

### A separate image register

The digests live in `docs/images.md`, not in `docs/dependencies.md`.
`scripts/check-dependency-register.ts` reads every table row of that file as an
npm package, so a second table there would fail `make verify`.

### Image index digests

Each digest is the `Docker-Content-Digest` of the tag's multi-arch OCI image
index, so one pinned reference works on amd64 and arm64 hosts. Node.js follows
`.nvmrc` (24.22.1). PostgreSQL uses 18.6, the newest major and patch release on
Docker Hub on 2026-11-12. The register also lists the slim and Debian-explicit
variants so that AC-03 can choose a runtime base without another lookup.

### Contract additions

Both responses reuse the existing `BadRequest` and `Forbidden` components. The
`Forbidden` description already names the `access-revoked` problem type, which
is the cause of a 403 from `getOwnAgent`. `info.version` is unchanged because no
existing behavior changes.

## Risks / Trade-offs

- A digest pins an image that receives no security updates. A later change bumps
  the tag and its digest together in `docs/images.md`.
- The digests have not been pulled or built; AC-03 verifies them when it builds.
