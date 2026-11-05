# Git conventions (shared)

Referenced by the `pr`, `branch`, and `review` skills and the `land`,
`execute`, and `issue` commands. Change a rule here, not in six places.

Code-level rules — the CRISP priority order, comments, tests, matching the
surrounding style — live in `code-conventions.md` beside this file.

## Protected branches

`master`, `main`, `trunk`, `develop`, and detached HEAD.

Never commit to one, push to one, or open a PR from one. Stop and tell the user
which branch they are on. Offer a branch name derived from the diff, and point at
`/branch`. Do not create the branch unless the user asks.

## Base branch detection

1. `git symbolic-ref --short refs/remotes/origin/HEAD`, then strip `origin/`.
2. If that ref is missing, run `git ls-remote --heads origin`. Take whichever of
   `main` or `master` exists.
3. If the repo has no remote, use the local default branch. Skip every push and
   PR step, and say why. Several side projects have no remote.

## Push

`git push`. With no upstream: `git push -u origin HEAD`.

If the push is rejected as non-fast-forward, run `git pull --rebase` and push
again. If the rebase conflicts, stop and report it. Leave the rebase in progress
for the user. Do not abort it for them.

Never run `git push --force`. Use `--force-with-lease` only when the user asks
for it explicitly in a later turn.

## Branch names

One value names the branch, its worktree directory, and its spec file. Keep the
three identical.

Derive it from the task: kebab-case, at most four words, no slashes. A slash
breaks the worktree directory path.

Prefer the noun the change is about over a verb phrase. `refund-flow` beats
`add-refund-flow-to-orders`.

### Exception — ticket ids

A ticket id is letters-dash-digits at the start of a task description or a
branch name, for example `GU-7631` or `ABC-42`.

When the task starts with one, use the bare id as the whole branch name instead
of a slug — some trackers only link a branch named exactly that. Then prefix the
commit subject and the PR title with `<TICKET>: `.

Side projects have no tickets, which is the normal case here. Take the plain
slug, skip the prefix, and never invent an id. Confirm the convention against
`git log` before applying it — the log is the authority, not this file.

## Commit hooks

If a pre-commit hook rewrites files, re-stage and retry the commit once. If a
hook fails outright, report its output and stop. Never pass `--no-verify`.

## Worktree bootstrap

A fresh worktree does not inherit untracked or gitignored files.

1. Copy gitignored env files (`.env`, `.env.local`) from the main checkout into
   the same relative paths. Test setups load these, so tests fail confusingly
   without them. Find them with `git check-ignore` in the main checkout.
2. Install dependencies with the package manager the lockfile implies:
   `pnpm-lock.yaml` → `pnpm install`, `package-lock.json` → `npm ci`,
   `yarn.lock` → `yarn`, `bun.lockb` → `bun install`, `uv.lock` → `uv sync`.
3. A branch can live in one worktree at a time. Never check out a branch that
   another worktree already holds.

## Commit messages

Danish, imperative, short subject — match `git log`. Identifiers stay English.

## Trailers

End every commit message with the co-author trailer the harness specifies for
this session. Never hardcode a model name here; it changes between sessions.

PR titles and bodies carry no co-author trailer and no "Generated with" footer,
unless the harness for this session requires one.

## GitHub without `gh`

The skills and commands write GitHub steps as `gh` commands. In a cloud session
where `gh` is unavailable, use the GitHub MCP tools instead (load them with
ToolSearch when deferred): `create_pull_request`, `pull_request_read`,
`list_pull_requests`, `update_pull_request` (undraft), `update_pull_request_branch`,
`merge_pull_request`, `issue_read`. `owner/repo` comes from
`git remote get-url origin`. The rules around each step stay the same.
