## 1. Image register

- [x] 1.1 Read the index digests of `node:24.22.1`, `node:24.22.1-bookworm-slim`,
  `postgres:18.6` and `postgres:18.6-bookworm` from `registry-1.docker.io`.
- [x] 1.2 Show the digests to the owner.
- [x] 1.3 Add `docs/images.md` with the tags, digests and source.

## 2. Contract

- [x] 2.1 Declare `400` (`BadRequest`) for `listAgents`.
- [x] 2.2 Declare `403` (`Forbidden`) for `getOwnAgent`.

## 3. Verification and review

- [x] 3.1 Run `openspec validate pin-images-and-declare-agent-errors --strict`.
- [x] 3.2 Run `make verify`.
- [ ] 3.3 Independent review by an assigned reviewer, as governance requires.
