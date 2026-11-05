---
name: pr
description:
  Create a GitHub pull request for the current branch with a short, honest
  title and a body of at most three lines. Detects the base branch, and a ticket
  id in the branch name when the repo uses them. Use when the user says /pr, "open a PR",
  "create a pull request", or "make a PR".
argument-hint: [--draft] [--yes]
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
---

# Open a pull request

Create a PR for the current branch with the `gh` CLI. Keep it minimal — a PR
body is a pointer for the reviewer, not documentation.

Read `.claude/skills/_shared/git-conventions.md` first. It holds the protected
branch list, base branch detection, the push and rebase rules, and the Branch
names rule with its ticket-id exception.

Arguments: `--draft` adds `--draft` to `gh pr create`. `--yes` skips the
confirmation in step 5, and only a caller that already gated with the user may
pass it.

## 1. Check the branch

```
git rev-parse --abbrev-ref HEAD
```

If the branch is protected, stop. There is nothing to open a PR from. Tell the
user which branch they are on.

Detect the base branch as the shared conventions describe. If the repo has no
remote, stop and say so — a PR needs one. Offer to add it instead.

## 2. Read the change

```
git log <base>..HEAD --oneline
git diff <base>...HEAD --stat
```

Read the actual diff when the change is non-trivial. The title and body have to
describe what changed, and paths alone do not show that.

If the branch has no commits ahead of the base, stop and say so.

## 3. Title

`<short summary>` — imperative mood, no trailing period, under ~72 characters.

Add a `<TICKET>: ` prefix only under the ticket-id exception in the shared
conventions. Side projects have no tickets, so the title is the summary alone.

## 4. Body

At most **three lines** describing the essence of the change for the reviewer.
No headings, no checklists, no bullet ceremony, no test-plan section.

Under the ticket-id exception, put the bare id on the first line by itself —
some trackers auto-link it — then the three lines. Otherwise the body is the
three lines alone.

The shared conventions forbid a co-author trailer and a "Generated with" footer
in PR text.

## 5. Confirm

Show the user the title and body, and ask whether to create it. A PR is
outward-facing, so do not skip this. If they want edits, revise and ask again.

Skip this step only when the arguments contain `--yes`.

## 6. Push and create

```
git push -u origin HEAD
gh pr create --base <base> --title "<TITLE>" --body "$(cat <<'EOF'
<body>
EOF
)"
```

Use a heredoc for the body, so line breaks survive. Follow the push and rebase
rules in the shared conventions.

If a PR already exists for the branch, `gh pr create` says so. Report the
existing URL instead of working around it.

## 7. Report

The PR URL, and the base branch it targets. One or two lines.

On a solo project nobody else reviews this, so a draft PR is a dead end. When
the repo has no other contributors, add one line: `/land` merges it, deletes the
branch, and cleans up the worktree.
