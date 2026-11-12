# Verification: pin-images-and-declare-agent-errors

## Scope

Base: `origin/dev` at `e06f536`. Edited: `docs/images.md` (new),
`contracts/openapi.json` (two response lines added) and this change.

## Digest lookup

For each tag, an anonymous pull token from `auth.docker.io` and a `HEAD` request
to `https://registry-1.docker.io/v2/library/<image>/manifests/<tag>` with
`Accept: application/vnd.oci.image.index.v1+json,
application/vnd.docker.distribution.manifest.list.v2+json`. Every response was
`HTTP/2 200` with content type `application/vnd.oci.image.index.v1+json`:

| Reference | `Docker-Content-Digest` |
| --- | --- |
| `node:24.22.1` | `sha256:d862bb5d082c5ae0210ac07e8c0344cb8cf7bef6d78e9b8c50c179da923108ea` |
| `node:24.22.1-bookworm-slim` | `sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c` |
| `postgres:18.6` | `sha256:e3d24f6906d0760bf4da0dae872415391ededefad23fd471c47dc53b0ddf3c42` |
| `postgres:18.6-bookworm` | `sha256:f1ea2a1a4fb7b68d4836be1fdcb8a6466a89b072158bf9d97663600538c294c5` |

The PostgreSQL major release was chosen from the Docker Hub tag listing of
2026-11-12, where 18.6 was the newest release. No image was pulled or built.

## Checks

| Command | Result |
| --- | --- |
| `npm ci --ignore-scripts` | exit 0 |
| `npm run openspec -- validate pin-images-and-declare-agent-errors --strict` | `Change 'pin-images-and-declare-agent-errors' is valid` |
| `make verify` | exit 0; 9 of 9 OpenSpec items passed; archive dry run valid |

## Remaining gates

- Independent review has not been performed. The owner's runner review
  exception does not cover this change.
- No CI run and no deployment validation occurred.
- Integration into `dev` and archive belong to the coordinator.
