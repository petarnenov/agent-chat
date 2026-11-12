# Container image register

Every base image that a `Dockerfile` or `compose.yaml` of this repository may
reference is listed here with its tag and the `sha256` digest of its multi-arch
OCI image index. A reference uses both, as `<image>:<tag>@<digest>`, so a build
cannot pick up a different image under the same tag.

The digests were read on 2026-11-12 from `registry-1.docker.io` with a `HEAD`
request for the manifest of each tag. Each response had the content type
`application/vnd.oci.image.index.v1+json`, and the digest is its
`Docker-Content-Digest` header. Changing an image or its
digest updates this table in the same change that touches the image reference.

| Image | Tag | Digest | Use |
| --- | --- | --- | --- |
| `node` | `24.22.1` | `sha256:d862bb5d082c5ae0210ac07e8c0344cb8cf7bef6d78e9b8c50c179da923108ea` | Build stage; matches `.nvmrc` |
| `node` | `24.22.1-bookworm-slim` | `sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c` | Service runtime stage |
| `postgres` | `18.6` | `sha256:e3d24f6906d0760bf4da0dae872415391ededefad23fd471c47dc53b0ddf3c42` | Database service |
| `postgres` | `18.6-bookworm` | `sha256:f1ea2a1a4fb7b68d4836be1fdcb8a6466a89b072158bf9d97663600538c294c5` | Same release, explicit Debian base |

PostgreSQL 18 is the newest major release on Docker Hub at that date, and 18.6
its newest patch release. No image in this table has been pulled, built or run
by this change.
