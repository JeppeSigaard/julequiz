---
description:
  Run an /initiative master plan to completion, unattended. Executes every task
  in a wave concurrently and every wave in sequence, planning, implementing and
  reviewing each task in fresh subagents, and merging a task's PR once a
  reviewer subagent approves it. Decides open questions itself, always taking
  the recommended option, and stops only for problems it cannot solve.
argument-hint: <initiative-slug> [--from-wave <n>] [--concurrency <n>] [--dry-run]
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, Agent, Skill, AskUserQuestion, TaskCreate, TaskUpdate
---

# /execute — a master plan, start to finish, unattended

`/initiative` produces a master plan and stops. `/branch` executes one task of it
and stops, asking the user at two gates. This command executes the whole plan: all
tasks of a wave at once, all waves in order, no gates.

You are the orchestrator and nothing else. You never write code, never write a
spec, and never enter a worktree — the tasks each own one and you must stay in
the main checkout to keep them apart. Every unit of work happens in a subagent.
Your own jobs are: git and `gh` plumbing, dispatch, and the merge decision.

Read `.claude/skills/_shared/git-conventions.md` for base branch detection, the
protected branch list, the branch-name rule, the worktree bootstrap steps, and
the push rules. `code-conventions.md` beside it holds the rules the subagents
must follow.

## Standing authorization

The user starts a run that lasts hours and walks away. Invoking `/execute` is
their approval, given once, for everything the plan needs:

- create branches and worktrees, commit in them, push them;
- open a PR per task and merge it after a reviewer subagent approves;
- delete a merged branch and prune its worktree;
- settle every design question the master plan left open.

It authorizes nothing else. These stay forbidden, and reaching one is an
escalation, never a judgment call:

- force push, any push to the base branch, any merge without a reviewer pass;
- migrations, schema push/pull/reset, container commands, any shared database or
  dev environment — editing a schema file is fine, applying it is not;
- discarding uncommitted work, in a worktree or in the main checkout;
- anything the master plan lists under Out of scope, and any file outside a
  task's Owns list.

## Decision policy

You never interview the user and no subagent may either. Where `/plan` and
`/branch` would ask, you decide, by this order:

1. The master plan's Architecture decisions and Constraints. They are settled.
2. The codebase. An existing pattern in the area beats an opinion about it.
3. `CLAUDE.md` and `AGENTS.md`.
4. The option you would have marked "(Recommended)" — the smallest change that
   satisfies the task, following the nearest existing pattern, adding no
   dependency, no abstraction and no scope the plan did not ask for.

Record every decision from rule 4 in the task's spec under
`## Autonomous decisions`, one line each, naming the alternative you rejected.
The final report collects them, and that collection is the one thing the user
must read afterwards.

## Phase 0 — Load the plan and preflight

Resolve the slug to `.claude/initiatives/<slug>.md`. With no argument, take the
sole file in that directory; if there are several, list them and ask which —
that is the one question you may ask before starting.

Read it **by section**, never whole. This session outlives every subagent and
must stay small:

```
sed -n '/^## Out of scope/,/^## Architecture decisions/p'            <path>
sed -n '/^## Architecture decisions/,/^## Task graph/p'              <path>
sed -n '/^## Constraints inherited by every task/,/^## Task graph/p' <path>
sed -n '/^## Waves/,/^## Integration check/p'                        <path>
sed -n '/^## Integration check/,/^## Status/p'                       <path>
```

Read a task's `### <task-slug>` section only when you dispatch it, and pass it
onward rather than keeping it.

Then check the ground, in one batch:

- `gh auth status` succeeds and the repo has a remote. Without both, stop: a run
  that cannot open or merge a PR cannot finish.
- The main checkout is clean. Uncommitted work there blocks the post-merge pull,
  and a long run would trample it. Stop and say so.
- Detect the base branch, `git fetch origin <base>`, and confirm the checkout is
  on it.
- The project's check command — the one the repo actually uses for typecheck and
  tests. You re-run it yourself before every merge, so find it now.

Validate the graph, and repair what you can:

- Every task named in Waves exists in Task graph, and every `Depends on` names a
  real task. A dangling name is an escalation — the plan is wrong.
- Within a wave, no two tasks share a path in their Owns lists. If two do, they
  cannot run at the same time: run them in sequence in plan order, inside that
  wave, and log it. Do not ask.
- A task whose dependency sits in a **later** wave is a cycle. Escalate.

With `--dry-run`, report the waves, the branch names, the serialized pairs and
the concurrency you would use, then stop without creating anything.

## Phase 1 — Derive what already ran

The run is resumable, and git is the truth. A killed session, a second
`/execute`, or a task the user ran by hand through `/branch` must all be picked
up rather than repeated.

```
gh pr list --state merged --search "<slug>-" --json number,headRefName,mergedAt
gh pr list --state open   --search "<slug>-" --json number,headRefName,reviewDecision,mergeable
git branch -a --list "*<slug>-*"
git worktree list
ls .claude/specs/
```

Classify every task: **merged** (skip it), **PR open** (resume at Phase 2 step
5), **branch with commits, no PR** (resume at review), **worktree only or spec
only** (resume at implement), **untouched** (start at plan).

Keep a run log at `.claude/initiatives/<slug>.run.md`, append-only, one line per
event: dispatch, stage completion, PR opened, merged, decision recorded,
escalation. It is a breadcrumb trail for the user and for the next session, not
state you rely on — where it disagrees with git, git wins. Also create one task
list entry per plan task, so the user watching the session sees progress without
reading your messages.

`--from-wave <n>` starts at that wave and treats every earlier wave as done.

## Phase 2 — Run a wave

A wave's runnable tasks are all of it except the pairs Phase 0 serialized.
Default concurrency is 4; `--concurrency` overrides it. Beyond the cap, queue.

Each task walks stages 1 to 6. **Never batch the stages across tasks.** Launch
stage 1 for every runnable task of the wave in a single message so they start at
once; then, the moment one task's agent returns, launch that task's next stage
in its own message. A task must never wait on a sibling. Waiting for a whole
stage to finish before starting the next wastes the difference between the
fastest and the slowest task, every stage, every wave.

### Step 1 — worktree

You do this yourself, from the main checkout, without entering anything:

```
git worktree add .claude/worktrees/<branch> -b <branch> origin/<base>
```

`<branch>` is the task's `Branch` field from the master plan, verbatim. Then
bootstrap it as the shared conventions describe: copy the gitignored env files
from the main checkout, and install dependencies with the package manager the
lockfile implies. A fresh worktree inherits neither. Bootstrap every task of the
wave in one batch — the installs are independent.

If the worktree already exists (a resumed run), keep it.

### Step 2 — plan (fresh subagent, sonnet)

Extract the task's own section first, and pass its text — not the master plan
path. Handing a 30-40 KB file to every subagent of every iteration is the
largest avoidable cost in this flow.

> Work in the git worktree at `<abs path>`; enter it with EnterWorktree
> (`path`) before anything else. Invoke the `plan` skill with the Skill tool for
> this task, and pass it these settled inputs verbatim: <task section>, plus the
> master plan's Architecture decisions and Constraints below. Write the spec to
> `.claude/specs/<branch>.md`.
> You are running unattended: **you may not ask any question**, and neither may
> the skill you invoke. Wherever it would interview, choose the option you would
> have recommended — the smallest change that satisfies the task, following the
> nearest existing pattern in this repo, adding no dependency and no abstraction
> the task did not ask for — and record each such choice in the spec under
> `## Autonomous decisions`, one line each, naming the alternative you rejected.
> The task's Owns list is a hard boundary: the spec must never direct the
> executor outside it, because sibling tasks own the rest and are running right
> now. Set the spec's `Status:` line to `in progress — <branch>`. Change no code.
> Your final message: the spec path, the autonomous decisions as a list, and
> anything the master plan left genuinely undecidable.

That last item is the escape hatch. A planner reporting one is an escalation
candidate — see below — not a reason to guess at a product-level fork.

### Step 3 — implement (fresh subagent, sonnet)

The work order is `/branch`'s Phase 2 order, unchanged, with two additions.
Prepend the worktree instruction from step 2. Append the task's **Owns** list
verbatim, with: modify only these files — a sibling task owns the rest, and
editing them creates a merge conflict with work running in parallel right now.

Keep `/branch`'s database rule. The julequiz has none today; if one appears,
the executor never touches a shared or hosted database. When unsure, take the
restrictive branch.

The executor commits on the branch. It does not push and does not open a PR —
you do both, after the review.

On a re-run after review findings, append the confirmed findings verbatim and an
instruction to fix them on top of the existing commits. Escalate that re-run to
`model: "opus"` when the previous pass failed on reasoning rather than on a
mechanical slip.

### Step 4 — review (fresh subagent)

> Work in the git worktree at `<abs path>`; enter it with EnterWorktree
> (`path`) first. Invoke the `review` skill with the Skill tool, passing
> `--spec .claude/specs/<branch>.md`, `--base <base>`, and
> `--initiative <slug> --task <task-slug>`. Change nothing. Your final message:
> the finding list exactly as the skill returns it, each with `file:line` and
> severity.

On the second and later passes, also pass `--since <sha>` with the HEAD you
reviewed last time. Record that sha at every call; without it each iteration
re-reviews the whole branch diff.

Then decide, without the user:

- **Blockers present** → back to step 3 with the findings. At most **three**
  implement/review iterations. Blockers surviving the third is an escalation.
- **Minor findings only** → one fix pass. Minors that survive it are merged and
  listed in the final report. A second fix pass for cosmetics costs more than the
  findings do.
- **No findings** → step 5.

The reviewer is the only gate in this command. Never merge a task that has not had
a clean pass, however obvious the change looks.

### Step 5 — verify, then PR

Before the PR, verify the two things a subagent's report cannot be trusted to
settle, yourself, from the main checkout:

```
git -C .claude/worktrees/<branch> diff --name-only origin/<base>...HEAD
```

Every path must be inside the task's Owns list. A stray path goes back to step 3
once with the boundary restated; a second violation is an escalation, because it
means the decomposition was wrong.

Then run the project's check command in the worktree. Red output goes back to
step 3 with the output verbatim. This costs one command and catches the
implementer that reported green tests it never ran.

Then push and open the PR yourself — `/pr` needs the branch checked out, and you
are in the main checkout:

```
git -C .claude/worktrees/<branch> push -u origin <branch>
gh pr create --head <branch> --base <base> --title "<title>" --body "<body>"
```

Follow `/pr`'s conventions for the text: an imperative title under ~72
characters, a body of at most three lines, and the `<TICKET>: ` prefix only
under the shared conventions' ticket-id exception. Not a draft — a draft cannot
merge, and this PR is about to.

### Step 6 — merge and clean up

```
gh pr checks <n> --watch --fail-fast
```

No CI returns nothing, which is the normal case on these projects and not a
failure; rely on the check command you already ran. A red check goes back to
step 3 with the failing output. The same check failing a second time for the
same cause is an escalation.

Then merge:

```
gh pr merge <n> --merge --delete-branch
```

Use the methods the repo permits — `gh repo view --json
squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed` — preferring a merge
commit, then squash, then rebase. If the merge is refused because the base
moved, run `gh pr update-branch`, wait for checks, and retry once.

Then finish the task exactly as `/land` does, because nothing else will:

1. If `.claude/specs/` is gitignored, copy the spec out of the worktree into the
   main checkout first — removing the worktree deletes the only copy.
2. Rewrite the spec's status line to `> Status: merged — <short-sha>`. A spec
   left at `in progress` feeds wrong architecture facts to every later `/plan`,
   including the ones running in this same wave.
3. `git worktree remove .claude/worktrees/<branch>` then `git worktree prune`.
   If git refuses because of stray uncommitted files, report them and leave the
   worktree — never force the removal.
4. `git pull` on the base in the main checkout.

Report one line: task merged, PR URL, iterations it took.

### Closing the wave

A wave is complete when every one of its tasks is merged. Then, once:

- `git pull` the base, so the next wave's worktrees branch from the merged work;
- run the project's check command on the updated base. Wave N+1 planning against
  a red base produces specs built on broken facts.

A red base after a wave, where the failure clearly belongs to one task's files,
gets **one** repair task: a branch `<slug>-fix-<n>`, through steps 1 to 6 like
any other. A red base for any other reason is an escalation.

Never start wave N+1 before wave N has fully merged. A task branches from the
base, so a dependent task started early builds on code that is not there.

## Phase 3 — Integration check

The master plan's Integration check section states what to verify once the last
wave lands. Every task passing its own review does not mean the assembled whole
works.

Create a scratch worktree on the merged base — do not touch the main checkout —
and dispatch one subagent to run the flows that section names, end to end.
Failures found here go through steps 1 to 6 as a single fix task on a branch
`<slug>-integration-fix`. One attempt; a second failure is an escalation.

Remove the scratch worktree afterwards.

## Phase 4 — Offer to try it

The integration check runs the flows the plan named. Nobody has clicked through
the quiz yet: `npm run check` proves it typechecks and builds, and a reviewer
subagent reads a diff.

After the integration check and before the final report, ask once, with
AskUserQuestion and the recommended option first:

- **"Start dev-serveren, så jeg kan prøve (anbefalet)"** — run `npm run dev` in
  the background from the main checkout on the merged base, report the URL
  (Waku defaults to port 3000), and tell the user which questions or screens
  changed, so they know what to click through.
- **"Spring over"** — say so in the final report, in one line: the plan was
  merged without anyone clicking through it.

If the question goes unanswered, the run is already finished: the report stands
without it, and the line above says so.

## Escalation

You surface a problem to the user only when you cannot solve it. The list is
exhaustive — anything not on it, you decide and continue:

- `gh` cannot authenticate, or branch protection refuses the merge.
- A conflict with the base that a rebase does not settle, in a file the task does
  not own alone.
- Blockers still present after the third implement/review iteration.
- The same CI failure twice.
- A task that cannot be completed inside its Owns list, or a diff that left it
  twice. That is a decomposition error, and only the plan can fix it.
- The plan contradicts itself, names a task that does not exist, or holds a
  cycle.
- A question the master plan left open where the two answers produce materially
  different products, and neither the codebase nor `CLAUDE.md` settles it.
- Anything needing a credential, an external account, a paid service, or a
  database migration.
- Every task in a wave failing. That is systemic, and continuing burns tokens on
  the same fault repeated.

Protocol, when you hit one:

1. **Quarantine the task.** Let its siblings in the wave finish; they are
   independent by construction. Mark every task that depends on it blocked.
2. Keep the worktree and the branch. They hold the work done so far.
3. **Batch.** Do not interrupt with each problem as it appears. Ask when the
   wave can go no further, in one message: what is blocked, what you tried, and
   the options, with AskUserQuestion and your recommendation first.
4. On an answer, resume the quarantined task at the stage it stopped, and carry
   on. The run does not restart.

If the whole plan is blocked, say so plainly with the state of every task, and
stop. Do not idle and do not invent work.

## Reporting

While running, one short line per state change — dispatched, merged, blocked —
and nothing else. No progress narration, no relaying of subagent reports.

At the end, one message:

- tasks merged, with PR numbers, grouped by wave;
- **every autonomous decision**, collected from the specs. This is the part the
  user has to read, because they were away when you made them;
- minor findings merged unfixed, per task;
- the integration check result;
- whether the quiz was tried in the browser (Phase 4), or one line saying the
  plan was merged without anyone clicking through it;
- anything blocked, and the command to resume it.

## Rules

- Never enter a worktree yourself. Parallel tasks each hold one, and this
  session must stay in the main checkout to manage them.
- Never write code, never write a spec, never review a diff yourself.
- Never merge a task that no reviewer subagent passed clean.
- Never start a wave before the previous one has fully merged.
- Never widen a task past its Owns list or the plan's Out of scope. If it cannot
  be done inside them, that is an escalation, not something to work around.
- Never re-open an Architecture decision from the master plan, in any subagent.
- Never ask the user something the master plan, the codebase, or `CLAUDE.md`
  already answers.
- Read the master plan by section, and pass sections to subagents rather than
  the path. This session runs for hours; everything you keep, you keep for all
  of them.
- If a subagent fails or returns an unusable result, retry it once with a
  corrected work order. Twice is an escalation.
- If the plan turns out to be one wave of one task, say so and hand it to
  `/branch` instead.
