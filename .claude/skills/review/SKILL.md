---
name: review
description:
  Review the current branch's diff and report findings, without changing
  anything. Runs a spec-conformance pass and a quality or security pass in
  parallel subagents, merges the results, and hands back one deduplicated
  finding list. Used by /branch and /execute, and standalone. Use when the user
  says /review, "review this branch", or asks whether a diff matches its spec.
argument-hint: [--spec <path>] [--base <ref>] [--since <sha>] [--initiative <slug> --task <name>]
allowed-tools: Bash, Read, Grep, Glob, Agent, Skill
---

# /review — findings only, no changes

You produce a finding list. You never edit code, never commit, never push, and
never ask the user to choose anything. The caller owns the gate and the fix
loop; when there is no caller, the user does.

The heavy reading happens in subagents so their file dumps stay out of this
context. You only merge and report.

Two things get checked, and they are not the same:

- **Spec conformance** — does the diff do what the plan said, and nothing else?
  No built-in skill covers this. It is the reason this skill exists.
- **Quality or security** — the ordinary code review. A built-in skill covers
  this, so delegate it rather than reimplementing it.

## 1. Establish the range and the plan

Detect the base branch as `.claude/skills/_shared/git-conventions.md`
describes, unless `--base` names one. Then pick the range from the tree's state,
because callers arrive at different points:

- **Clean tree** — the work is committed. Use
  `git diff origin/<base>...HEAD`.
- **Dirty tree** — the work is not committed yet, as when a direct fix is
  reviewed before committing. Use `git diff $(git merge-base origin/<base> HEAD)`, which spans the
  commits **and** the uncommitted tracked changes. Add
  `git status --porcelain` so the passes see new untracked files too; a diff
  alone hides them.

Both use `origin/<base>`, not the local ref. A worktree branches from the remote
base and the local branch of that name can lag behind it. When the repo has no
remote — the shared conventions expect this — fall back to the local `<base>`
and say so.

**`--since <sha>`** overrides both. It means the caller already reviewed up to
`<sha>` and wants only what came after it, so use `git diff <sha>..HEAD` (add
`git status --porcelain` on a dirty tree, as above). This is how `/branch` calls
the second and later passes of its fix loop. Say in the report that the range is
incremental and name the sha — a finding outside it was reported before, not
resolved.

State the range you chose in the work orders. A subagent that reruns
`origin/<base>...HEAD` on a dirty tree reviews an empty diff and reports no
findings.

If the range is empty, say so and stop. Nothing to review.

Then find the plan the diff should conform to, in this order:

1. `--spec <path>`, if given.
2. `.claude/specs/<current-branch>.md`, if it exists.
3. `--initiative <slug> --task <name>` — extract only that task's section with
   `sed -n '/^### <task-slug>$/,/^### /p' .claude/initiatives/<slug>.md`, which
   holds its Goal, Scope, Out of scope and Owns. Never read the file whole.
4. No plan on disk. Then the caller's task description is the plan. Ask for it
   only when running standalone with no description in the arguments — one
   question, then continue.

## 2. Run both passes in one message

Spawn both subagents with the Agent tool **in the same message**, so they run at
once. Give each the base branch you detected.

**Pass A — spec conformance.** The **reviewer** subagent (`subagent_type:
"reviewer"`), whose definition already carries the standing project rules and
the `npm run check` command (typecheck + build) — the work order adds only what is specific to this
review:

> Review the diff `<range command>` on this branch against the spec at
> `<spec path>`, the rules in `CLAUDE.md`, and
> `.claude/skills/_shared/code-conventions.md`. Check: (1) every spec
> implementation step is actually done, (2) nothing out of scope was added,
> (3) those rules are followed, at the CRISP priority order that file opens
> with — flag any comment that merely explains what the code does, rank a
> correctness or readability problem above an idiomatic, simplicity, or
> performance one, and report nothing that trades a higher attribute for a
> lower one, (4) real bugs — verify each suspected bug by reading the
> surrounding code before reporting it. Your final message: a list of findings,
> each with `file:line`, severity (blocker/minor), and a one-line fix
> suggestion — or "no findings" if clean.

With no spec on disk, replace the spec sentence with the task description
verbatim and drop check (1) — there are no numbered steps to tick off.

For an initiative task, extract the task's section yourself with
`sed -n '/^### <task-slug>$/,/^### /p' .claude/initiatives/<slug>.md` and put the
**Owns** list in the work order verbatim. Do not hand the subagent the master
plan path — the file runs to 30-40 KB and the pass needs one list from it. Add:
check that no file outside that Owns list was modified, and that the task leaves
the repo green on its own — it must typecheck and pass tests without its sibling
tasks, or it cannot be merged independently.

**Pass B — quality or security.** Skip this pass when the range changes fewer
than roughly 50 lines **and** touches none of the areas listed below. On a diff
that small Pass A already read every changed line, and a second subagent plus its
nested built-in skill buys nothing. Say in the report that you skipped it and
why. Otherwise run it: a second general-purpose subagent that invokes a built-in
skill with the Skill tool. This pass stays general-purpose deliberately — the
`reviewer` agent is limited to Read, Grep, Glob and Bash, so it cannot invoke a
skill. Both built-ins default to the pending
changes, so on a dirty tree they need no range; on a clean tree, tell the
subagent to point them at the branch:

- default — `code-review`, for correctness bugs and reuse, duplication, and
  altitude problems.
- when the diff touches auth, sessions, uploads, secrets, payments, or any
  external input — `security-review` instead.

Choose from the actual diff, not from the task description. Instruct the
subagent to invoke the skill, then return its findings in the same
`file:line` + severity + fix format as Pass A, and to change no files.

Tell it the priority order in `code-conventions.md` binds its findings too.
`code-review` hunts duplication and altitude; this project accepts repetition
over a forced abstraction, so it must drop any finding that only asks for
another layer.

Use `code-review`, not `simplify`. `simplify` applies its fixes; this skill
reports. A pass that edits the tree behind the caller's back breaks the caller's
gate.

## 3. Merge

Combine both lists. Drop duplicates — the same `file:line` and the same
underlying problem is one finding, keep the clearer wording. Keep both when they
name the same line for different reasons.

Order by severity, blockers first. Within a severity, group by file.

Discard any finding whose subagent did not read the code to confirm it. A
speculative finding costs the caller a wasted implement pass.

Discard any finding that the priority order forbids — a new abstraction whose
only argument is DRY, a helper that exists only to shorten a function, or a
speed change that costs readability. When two findings disagree, the one
defending the higher attribute wins.

## 4. Report

One message:

- the range reviewed, and which plan it was checked against;
- which Pass B skill ran, and why, in one clause;
- the merged findings, or `no findings` when clean;
- one line naming anything you could not check, and why.

Stop there. Do not offer to fix them, and do not ask what to do next. The caller
decides.

## Rules

- You never edit, commit, or push. Neither do the subagents.
- Never gate. No AskUserQuestion except the single standalone case in step 1.
- Pass A runs always. A clean spec pass never excuses Pass B — only the
  under-50-line rule in step 2 does, and you must say so in the report.
- If a subagent fails or returns an unusable result, say which pass failed and
  retry it once with a corrected work order. Report a half review as a half
  review — never present one pass as if both ran.
