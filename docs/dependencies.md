# Dependency register

Every direct dependency is listed here with the version in `package-lock.json`,
its scope, the license declared in its manifest, and the date its addition was
reviewed. `npm run verify:dependencies` checks this table against `package.json`
and the lockfile, and fails on a missing, extra, or mismatched entry.

Scope: this register covers **direct** dependencies only. It records declared
licenses, not license texts, and it does not review transitive packages. The full
inventory and SBOM that Taskelith keeps are deferred to the change that produces
distributable artifacts ([ADR 0001](decisions/0001-adopt-the-taskelith-workflow.md)).
A dependency whose declared license is missing or unexpected is not added until
the owner decides.

Adding, removing, or upgrading a dependency updates this table in the same
change that touches `package.json`.

| Package | Version | Scope | License | Reviewed |
| --- | --- | --- | --- | --- |
| @fission-ai/openspec | 1.14.3 | dev | MIT | 2026-10-25 |
| @semantic-release/commit-analyzer | 13.0.1 | dev | MIT | 2026-10-25 |
| @semantic-release/github | 12.0.10 | dev | MIT | 2026-10-25 |
| @semantic-release/release-notes-generator | 14.1.1 | dev | MIT | 2026-10-25 |
| @types/node | 24.19.2 | dev | MIT | 2026-10-25 |
| conventional-changelog-conventionalcommits | 9.3.1 | dev | ISC | 2026-10-25 |
| semantic-release | 25.0.9 | dev | MIT | 2026-10-25 |
| typescript | 5.9.3 | dev | Apache-2.0 | 2026-10-25 |
