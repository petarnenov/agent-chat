## Context

The project is new and empty. The workflow to be taken over from Taskelith is a
set of documents plus the scripts, hooks, Makefile, and CI job that enforce them.
Copying the documents without the enforcement would leave every gate as a claim,
which is exactly what the governance policy forbids.

The intent already names the product decisions that are still open. This change
must not answer them; it only creates the place where they are recorded and the
gates that will check the work that follows.

## Decisions

- **Single package, no workspaces.** The product is one service. The workspace
  package contract, the boundary check, and the workspace-aware coverage scope
  exist in Taskelith because it has many packages; here they would be dead
  weight until the first module exists.
- **A dependency register instead of the SBOM inventory.** Taskelith's gate
  reviews every locked installation path that lacks a license file. That is
  honest work, but it needs per-package research that cannot be invented for a
  scaffold. The register covers every direct dependency with its locked version,
  scope, declared license, and review date, and the full inventory is deferred
  to the change that produces artifacts.
- **A scaffold module with a test.** The coverage gate must run on compiled
  product code from the first commit, so `src/index.ts` exposes the project
  identity and status and `test/index.test.ts` covers it. The first product
  change replaces it.
- **Deferred gates are recorded, not silent.** The boundary check, the OpenAPI
  compatibility check, and the SBOM inventory are listed in ADR 0001 with the
  change that must bring each one.
- **`dev` is the default branch, `main` is promotion-only.** This matches the
  release policy and keeps the pre-push gate on every change branch.
- **No npm publication.** The package is private. The release job creates a tag
  and release notes only.

## Risks

- The workflow documents name reviewers and invocations that live in the owner's
  environment; if a reviewer is unavailable, the rotation rule applies rather
  than a substitute process.
- The dependency register checks declared licenses from the lockfile, not the
  license text. That limit is stated in `docs/dependencies.md`.
- The scaffold module is intentionally trivial. Its coverage proves the gate
  runs, not that the product is tested.
