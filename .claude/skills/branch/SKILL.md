---
name: branch
description:
  Full task-to-PR workflow on a dedicated branch. Creates a git worktree and
  branch for the task (so several sessions can run in parallel), plans the work
  interactively into a spec file, then loops fresh implementer and reviewer
  subagents until approved, and finishes with /pr. Can also execute a spec
  written ahead of time, or one task of an /initiative master plan. Use when the
  user says /branch or wants the complete flow for a feature or fix.
argument-hint: <task description> | --spec <path> | --initiative <slug> --task <name>
---

# /branch — Task to PR, one flow

You are the orchestrator. You own the git state, the conversation with the user,
and the approval gates. All heavy work happens elsewhere: planning research runs
in Explore subagents, and implementation and review each run in their own fresh
subagent with the spec file as the only handoff. Never implement or review code
in this session yourself.

Read `.claude/skills/_shared/git-conventions.md` first. It holds base branch
detection, the branch-name rule, the worktree bootstrap steps, and the push
rules. `code-conventions.md` beside it holds the CRISP priority order and the code
rules the subagents must follow.

## Arguments

Three forms, which differ only in where the plan comes from:

- **`<task description>`** — plan it from scratch. If the description is empty or
  too vague to name a branch, ask what the task is before anything else. Depth
  beyond that is the planning phase's job — don't interrogate here.
- **`--spec <path>`** — a complete spec already exists. Skip planning entirely.
- **`--initiative <slug> --task <name>`** — one task of a master plan at
  `.claude/initiatives/<slug>.md`. Read the **sections you need**, not the whole
  file. These plans run to 30-40 KB and this session must stay small:

  ```
  sed -n '/^## Architecture decisions/,/^## Task graph/p'  .claude/initiatives/<slug>.md
  sed -n '/^### <task-slug>$/,/^### /p'                    .claude/initiatives/<slug>.md
  sed -n '/^## Waves/,/^## Integration check/p'            .claude/initiatives/<slug>.md
  ```

  Together these give the settled decisions, the task's Goal, Scope, Out of
  scope, Owns and Depends on, and the wave structure. Read more only when one of
  them points at a section you actually need. Verify every task it depends on
  has merged before starting; if one has not, stop and say which — the base
  would be missing its code.

## Phase 0 — Worktree setup

The flow runs in a dedicated git worktree so several `/branch` sessions can run
in parallel without touching each other or the main checkout. The main
checkout's branch is never switched and its working tree is never modified.

1. Establish the **branch name** by the shared conventions' Branch names rule.
   - `--initiative` — use the task's `Branch` field from the master plan
     verbatim. Do not derive your own.
   - `--spec` — use the spec's filename slug.
   - otherwise — derive it from the task description.
2. If the session is already inside this task's worktree (a re-run), skip setup
   and resume from the phase matching the current state: spec exists → Phase 2;
   commits exist → Phase 3.
3. Detect the base branch as the shared conventions describe, then
   `git fetch origin <base>` so the worktree branches from an up-to-date base.
4. Check `git worktree list` for an existing worktree on this branch. If found,
   enter it with EnterWorktree (`path`) and resume as in step 2.
5. Otherwise create it:
   `git worktree add .claude/worktrees/<branch> -b <branch> origin/<base>`
   Then switch the session into it with EnterWorktree, passing the absolute
   `path` — not `name`, which would generate its own branch name.
6. Uncommitted changes in the main checkout are **not** visible in the worktree.
   If `git status` there shows work that looks relevant to this task, ask the
   user before continuing.
7. Bootstrap the worktree as the shared conventions describe — copy the
   gitignored env files, then install dependencies with the package manager the
   lockfile implies. A fresh worktree inherits neither.
8. Every later phase, subagents included, runs with the worktree as working
   directory.

## Phase 1 — Plan (inline, interactive)

**With `--spec`** — there is nothing to plan. Read the spec, confirm it still
matches the tree (spot-check a few of its paths and symbols; a spec written
before other work landed may have gone stale), and go to Phase 2. If it has
gone stale, say which parts and ask whether to re-plan rather than handing a
wrong spec to the executor.

**Otherwise** — invoke the **plan** skill with the Skill tool. Pass:

- the task description, or for `--initiative`, the task's Goal, Scope, Out of
  scope, and Owns fields from the master plan;
- for `--initiative`, the path to `.claude/initiatives/<slug>.md` as inherited
  context, with two instructions: treat its Architecture decisions as settled
  and interview only on what is still open at task level, and **restate in the
  spec** every settled decision, pinned contract, inherited constraint and Owns
  entry that bears on this task. The spec has to stand alone, because no later
  phase reads the master plan;
- an explicit instruction to write the spec to `.claude/specs/<slug>.md` using
  the branch name from Phase 0 — otherwise it derives its own and the later
  phases point at the wrong file.

This runs **inline, not in a subagent** — the interview needs AskUserQuestion,
which subagents cannot use.

If the project has its own planning skill that is better tuned to the repo (for
example a `feature` skill), prefer that one and pass it the same instructions.

The plan skill ends by writing the spec and handing back. It does not launch the
executor — that is Phase 2's job.

Once the spec exists, rewrite its `Status:` line to `in progress — <branch>`. A
stale `ready for execution` on shipped work is what makes a later `/plan` trust
facts that no longer hold.

Then gate explicitly: ask the user (AskUserQuestion) whether the plan is
approved.

- **Approved** → Phase 2.
- **Changes requested** → revise the spec, then gate again. Loop until approved.

## Phase 2 — Implement (fresh subagent)

Spawn the **developer** subagent with the Agent tool (`subagent_type:
"developer"`), passing `model: "sonnet"`, with this work order (substitute the
real slug):

> Implement the spec at `.claude/specs/<slug>.md` exactly. Read it fully first.
> The spec's decisions are final — do not re-open them, do not add anything
> listed as out of scope. Follow the implementation steps in order and honor the
> Traps section. Carry out the spec's Verification section, and the database rule
> stated below, if any. When done, commit all work on the current branch in one
> or more logical commits. Do NOT push and do NOT create a PR. Your final message must
> report: what changed (files), the verification output verbatim, and anything
> from the spec you could not complete and why.

`.claude/agents/developer.md` already carries the standing rules — `CLAUDE.md`
when it exists, `code-conventions.md`, `npm run check`, the stack's idioms
(Waku, React 19 with the React Compiler, Tailwind 4), Danish quiz text and
commit messages, and the plan-first gate on architecture changes. Do not repeat
them in the work order; change them in the agent definition instead.

The julequiz has no database and no shared environment, so there is no
database rule to add. If that changes, decide it in Phase 0: never touch a shared
or hosted database; a local-only one may be migrated with the project's own
scripts.

For an initiative task, append the task's **Owns** list to the work order
verbatim, with: modify only these files — a sibling task owns the rest, and
editing them creates a merge conflict with work running in parallel. Do **not**
give the executor the master plan path. Phase 1 restated its settled decisions
in the spec, and re-reading a 30-40 KB plan in every subagent of every iteration
is the largest avoidable cost in this flow.

If this is a re-run after feedback (the Phase 3 loop), append to the work order
the user's feedback verbatim, the reviewer's confirmed findings, and an
instruction to fix those on top of the existing commits rather than starting
over. Escalate the re-run to `model: "opus"` when the previous iteration failed
on reasoning rather than on a mechanical slip — a second cheap pass that repeats
the same mistake costs more than one expensive pass that does not.

Relay the implementer's report to the user briefly, then go straight to Phase 3
— there is no gate between implement and review.

## Phase 3 — Review (delegated)

Invoke the **review** skill with the Skill tool, passing `--spec
.claude/specs/<slug>.md` and the base branch you detected in Phase 0. For an
initiative task, pass `--initiative <slug> --task <name>` as well, so it can
check the task's **Owns** boundary.

On the second and later passes of the Phase 2 → Phase 3 loop, also pass
`--since <sha>`, where `<sha>` is the HEAD you reviewed the previous time.
Record that sha at every call. Without it each iteration re-reviews the whole
branch diff with two fresh subagents, re-deriving findings you already reported
and the user already accepted.

It spawns the conformance and quality passes itself, merges them, and hands back
one finding list. It never edits and never gates — both remain yours.

Then present to the user in one message: what was implemented, the review
findings, and how to try it out. Gate with AskUserQuestion:

- **Approve** → Phase 4.
- **Fix the review findings** → back to Phase 2 with the findings.
- **Request changes** (the user's own notes) → back to Phase 2 with the notes.

Loop Phase 2 → Phase 3 as many times as needed. Each iteration uses fresh
subagents; accumulated feedback travels in the work order, not in shared
context. If a requested change contradicts the spec, update the spec file first
so it stays the single source of truth, then re-run Phase 2.

## Phase 4 — PR

Invoke the **pr** skill with the Skill tool, passing `--draft --yes` as args. It
detects the base branch and handles the title and body conventions. `--yes`
suppresses its own confirmation, because Phase 3 already gated with the user.
Without it this flow asks twice for one approval.

Then clean up the worktree, so the branch can be checked out in the main folder
— a branch can only be checked out in one worktree at a time:

1. If `.claude/specs/` is gitignored, copy the spec from the worktree into the
   main checkout's `.claude/specs/` first. Removing the worktree would otherwise
   delete the only copy. Check with `git check-ignore -v .claude/specs/<slug>.md`.
   Leave its `Status:` line at `in progress — <branch>`. `/land` sets it to
   `merged` when the PR actually lands.
2. Return to the main checkout with ExitWorktree (`action: "keep"` — the
   worktree was entered via `path`, so ExitWorktree cannot remove it).
3. `git worktree remove .claude/worktrees/<branch>`. Everything is committed and
   pushed by now, so this should succeed. If git refuses because of stray
   uncommitted files, report them rather than forcing the removal.
4. Do NOT check the branch out in the main folder yourself — parallel sessions
   share that checkout, and switching it is the user's call.

Finally report: the PR URL, the spec path, how many implement/review iterations
it took, and that the branch can now be checked out locally with
`git checkout <branch>`. Add one line: `/land` merges the PR, deletes the
branch, and marks the spec merged. On a solo project that is the real finish
line, because a draft PR nobody reviews is not.

For an initiative task, also report which wave this task belongs to and what
remains in it — the next wave cannot start until this one has fully merged. Do
not start the next task yourself.

## Rules

- Never skip a gate. There are two: plan approval (Phase 1) and implementation
  approval (Phase 3). With `--spec` the plan gate is already satisfied — the
  user handed you the plan — *unless* the staleness check found a problem, in
  which case you must stop and ask rather than implementing a stale spec.
- Never widen the task. With `--initiative`, the master plan's Out of scope and
  the task's Owns list are hard boundaries: a sibling task owns the rest and may
  be running right now. If the task cannot be completed without touching
  another's files, stop and report it — that is a decomposition error for the
  initiative to fix, not something to work around here.
- The spec file is the single source of truth between phases. Subagents get the
  spec path, not a paraphrase of it.
- You never edit code, never commit, never push. Subagents commit; the `pr`
  skill pushes.
- If a subagent fails or returns an unusable result, say what happened and retry
  with a corrected work order — don't silently absorb it.
