---
description:
  Merge the current branch's pull request, delete the branch, prune its
  worktree, and mark its spec merged. The finish line that /pr and /branch stop
  short of.
argument-hint: [--merge | --squash | --rebase] [--pr <number>]
allowed-tools: Bash, Read, Grep, Glob, Edit, AskUserQuestion, ExitWorktree
---

# /land — merge and clean up

`/pr` opens a draft PR and `/branch` stops there. On a team repo a reviewer takes
over at that point. On a solo project nobody does, so the branch sits open. This
command closes the loop.

Read `.claude/skills/_shared/git-conventions.md` for base branch detection and
the protected branch list.

Merging is hard to reverse and outward-facing. Confirm before you merge, every
time, even when the user's phrasing sounds decisive.

Current branch: !`git branch --show-current`

## 1. Find the PR

```
gh pr view --json number,title,url,state,isDraft,mergeable,mergeStateStatus,baseRefName,headRefName,reviewDecision
```

With `--pr <number>`, view that one instead of the current branch's.

Stop and report when:

- there is no PR for this branch — point at `/pr`;
- its state is not `OPEN`;
- `mergeable` is `CONFLICTING` — say which files conflict, and let the user
  resolve them. Do not resolve conflicts here.

## 2. Check the checks

```
gh pr checks --watch --fail-fast
```

If checks fail, stop and report which. Do not merge past a red check unless the
user says so explicitly in a later turn.

A repo with no CI returns nothing. That is not a failure — say that no checks
ran, and rely on the local test run instead. Most of these side projects have no
CI, so this is the normal path.

## 3. Undraft

A draft PR cannot merge. `gh pr ready <number>` marks it ready.

## 4. Confirm

Show the user: the PR title and URL, the base branch, the check result, the
merge method you intend, and that the branch and worktree will be deleted. Ask
with AskUserQuestion.

Merge method — take it from the arguments, otherwise infer and say what you
chose:

- **merge** by default. It keeps the branch's individual commits in the history.
- **squash** or **rebase** only when the user asks.

## 5. Merge

```
gh pr merge <number> --merge --delete-branch
```

`--delete-branch` removes the remote branch and the local one, when the local
branch is not checked out anywhere.

If the merge is refused because the base moved, run `gh pr update-branch`, wait
for checks again, and retry once. Report a second refusal rather than forcing it.

## 6. Mark the spec merged

Find the spec for this branch at `.claude/specs/<branch>.md`, or by grepping
`.claude/specs/` for the branch name.

Rewrite its status line to the merge commit:

```
> Status: merged — <short-sha>
```

This step is the point of the whole command. `/plan` harvests prior specs and
trusts the Architecture facts of anything still marked `ready for execution`. A
merged spec describes code that has since changed, so a stale status feeds wrong
facts to every later plan in that area. Nothing else in the set writes this
value, so skipping it here leaves the spec wrong for good.

If `.claude/specs/` is tracked by git, commit the status change on the base
branch with the message `mark <slug> spec merged`, then push. If it is
gitignored, just edit the file.

## 7. Prune the worktree

```
git worktree list
```

If a worktree holds this branch:

1. Leave it first with ExitWorktree if the session is inside it.
2. Copy out anything gitignored that only exists there, above all the spec.
3. `git worktree remove .claude/worktrees/<branch>`
4. `git worktree prune`

If git refuses because of stray uncommitted files, report them. Do not force the
removal — that discards work.

## 8. Update the base checkout

In the main checkout, on the base branch:

```
git checkout <base>
git pull
```

Only when the main checkout is clean. If it holds uncommitted work, skip this
and say so. Parallel sessions share that checkout, so never discard its state.

## 9. Report

Four lines at most: the merge commit sha, the PR URL, what you deleted (branch,
worktree), and the spec status you wrote.

For an initiative task, also report which wave this completes, and whether the
next wave can now start. Read `.claude/initiatives/<slug>.md` and check the
remaining tasks in the wave with
`gh pr list --state merged --search "<initiative-slug>-"`. Do not start the next
task yourself.
