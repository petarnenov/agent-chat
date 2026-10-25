# Releases

Agent Chat uses semantic-release and GitHub Actions. The repository checks are
defined once, as `make verify` in the root `Makefile`; the same target is the
local gate and the GitHub `verify` job. Each push to `main` runs `make verify`
and then the release job, which creates a Git tag and GitHub release notes for
qualifying Conventional Commits.

npm publication is disabled. The package is private and the release job does not
publish it. Publication needs explicit owner authorization, a trusted publisher,
and a separate policy change.

## Branch flow

1. Each change is developed on its own feature branch in its own git worktree,
   so several changes can proceed in parallel, and is merged into `dev`, the
   default branch, through a pull request. Pushes and pull requests targeting
   `dev` run no workflow.
2. Before every push, `make verify` must pass locally. Run `make hooks` once per
   clone; the `pre-push` hook then runs `make verify` and blocks the push on
   failure. The target first checks that Node matches `.nvmrc` and npm matches
   the CI pin.
3. A promotion pull request from `dev` into `main` runs `make verify` in GitHub.
4. Merging the promotion into `main` runs `make verify` again and releases
   qualifying changes.

## Parallel work with worktrees

Keep the main clone on `dev` and give each change a worktree outside it:

```sh
git fetch origin
git worktree add --no-track ../agent-chat-worktrees/<change> -b <change> origin/dev
cd ../agent-chat-worktrees/<change>
make setup   # node_modules is per worktree
git push -u origin <change>
```

Push each branch from its own worktree: the `pre-push` hook refuses a push of
any commit other than the checked-out one, because `make verify` checks only
that. `--no-track` keeps `origin/dev` from becoming the branch's upstream, so
`git push -u` sets the branch's own upstream.

Two pitfalls to avoid:

- `gh pr merge --delete-branch` run from a worktree can leave the remote branch
  in place. After confirming the merge, delete it from the main clone with
  `git push origin --delete <change>`.
- The `pre-push` hook runs `make verify` for every push, including a branch
  deletion. `make verify` selects the `.nvmrc` Node.js through nvm when nvm has
  it; without it, the toolchain check fails and the deletion is refused.

## Branch protection

Applied by the owner when the repository has a remote:

- `main` accepts changes only through a pull request whose `verify` check passed
  on a branch that is up to date with `main`. Administrators are included. Force
  pushes and deletion are blocked. Tags created by the release job are not
  affected.
- `dev` blocks force pushes and deletion.
- Squash merging is disabled; merge commits and rebase merges stay available.

Because the `verify` check must run on a branch that is up to date with `main`,
synchronize `dev` after every promotion: fast-forward it after a merge-commit
promotion, and merge `main` into `dev` after a rebase promotion.

## Commit classification

| Commit | Version change |
| --- | --- |
| `fix: correct the room check` | Patch |
| `perf: reduce the stream fan-out` | Patch |
| A revert | Patch |
| `feat: add room approval` | Minor |
| `feat!: replace the registration API` or a `BREAKING CHANGE:` footer | Major |
| `docs:`, `test:`, `chore:`, `build:`, `ci:` without breaking changes | No release |

These rules also apply before 1.0; a breaking change advances the major version.
One promotion may bundle several changes; their commits are analyzed together,
and the largest increment among them wins. Promotions use a merge commit or a
rebase, never a squash, so that semantic-release sees each Conventional Commit
and its breaking-change footer.

## Version source of truth

Published Git tags are authoritative. semantic-release changes the version in
the release workspace without committing a generated bump back to `main`. The
version in a source checkout is therefore a development placeholder.

## Authentication

The release job uses the repository `GITHUB_TOKEN` with `contents: write`. No npm
token exists, and none may be added without an owner decision that changes this
policy.

## Verification and recovery

The workflow installs locked dependencies without lifecycle scripts and runs
`make verify`: the comment length check, the compiled tests with coverage
thresholds of 75% for lines, branches, and functions plus the coverage scope
check, the type check, the dependency register check, strict OpenSpec
validation, and the archive dry run. Releasing runs only after verification
succeeds. Workflow runs are serialized and are not cancelled mid-release.

Use the workflow's manual dispatch on main to retry. Never move a published tag
or reuse a version. If release notes failed after a tag was created, complete
the missing GitHub release for that tag. Disable the workflow to suspend
automatic releases.
