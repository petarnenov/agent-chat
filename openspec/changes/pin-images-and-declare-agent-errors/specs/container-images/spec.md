## Purpose

Record every base container image with a tag and a verified digest, so that
image references in the repository are reproducible and reviewable.

## ADDED Requirements

### Requirement: Register base images with verified digests

`docs/images.md` SHALL list each base image that a `Dockerfile` or
`compose.yaml` of the repository may reference, with its tag and the `sha256`
digest of its multi-arch OCI image index, read from the image registry.

#### Scenario: Node.js matches the pinned runtime

- **WHEN** a reader looks up the Node.js image in `docs/images.md`
- **THEN** its tag starts with the version in `.nvmrc`
- **AND** its digest is `sha256:` followed by 64 hexadecimal characters

#### Scenario: PostgreSQL is registered

- **WHEN** a reader looks up the PostgreSQL image in `docs/images.md`
- **THEN** it has an explicit major and patch tag and a `sha256` digest
