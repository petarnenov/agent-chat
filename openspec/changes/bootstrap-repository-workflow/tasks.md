## 1. Workflow documents

- [x] 1.1 Write `AGENTS.md` with the language, scope, comment, SDLC, and commit rules.
- [x] 1.2 Write the governance policy with the independent review process.
- [x] 1.3 Write the agent task protocol for coordinator and worker sessions.
- [x] 1.4 Write the release policy with the `dev` to `main` flow.
- [x] 1.5 Record ADR 0001 (workflow adoption and deferrals) and ADR 0002 (principles).
- [x] 1.6 Write the intent document and the architecture draft.

## 2. Enforcement

- [x] 2.1 Add the pinned toolchain scripts and the `Makefile` targets.
- [x] 2.2 Add the comment length check, the coverage scope check, and the archive dry run.
- [x] 2.3 Add the dependency register and its check.
- [x] 2.4 Add the pre-push and post-merge hooks.
- [x] 2.5 Add the CI verify job and the release job without npm publication.

## 3. OpenSpec

- [x] 3.1 Add `openspec/config.yaml` with the project context.
- [x] 3.2 Add the `project-workflow` capability delta for this change.

## 4. Verification and review

- [x] 4.1 Run `make verify` and the strict OpenSpec validation.
- [ ] 4.2 Obtain independent review and record the result in `verification.md`; deferred by the owner on 2026-10-25 as future work.
