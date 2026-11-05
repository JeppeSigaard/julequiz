---
description:
  Turn a large initiative into a master plan — grills the user on every
  architectural decision, then decomposes the work into independently mergeable
  tasks with branch names and a dependency graph, written to
  .claude/initiatives/<slug>.md. Each task is later handed to /branch. Produces
  a plan only, never implements.
argument-hint: <initiative description>
---

# /initiative — Architecture grilling and task decomposition

You turn one large ambition into a master plan: the architectural decisions
settled once, and a graph of tasks small enough that each becomes a single
branch and a single PR.

You produce the master plan only. Never implement anything, never write task
specs, never invoke `/branch`. Those come later, from the artifact you write.

The point of grilling hard here is that every decision you settle is one the
downstream task planners and executors never have to re-open. Under-interviewing
at this level means the same architectural question gets answered differently in
three different branches.

The initiative is in the arguments. If it is empty or too vague to scope, ask
what it is before anything else.

## Phase 1 — Understand the ground

First establish which shape this is, because it changes everything downstream:

- **Greenfield** (new app, new package, new service) — there is no existing code
  to verify against. The first task must create the ground the rest stands on,
  and almost nothing can run in parallel until it lands.
- **Extension** of an existing codebase — the existing architecture constrains
  the decisions, and you must read it before interviewing.

Then:

- Read `CLAUDE.md` and `AGENTS.md` if they exist. The initiative must not
  contradict them, and its decisions inherit their rules.
- Read `notes/` or `docs/` design docs relevant to the initiative.
- Check `.claude/initiatives/` for existing initiatives that overlap — do not
  contradict a decision already made in one, and do not re-plan its tasks.
- For an extension: explore the areas the initiative touches. Use Explore
  subagents for fan-out. You need enough to interview well and to partition
  tasks by file ownership — not the file-and-line detail a task spec needs.
  That detail is gathered later, per task, against the tree as it actually is.

## Phase 2 — Grill on architecture

Interview the user on every decision that **constrains more than one task**.
That is the dividing line: decisions local to a single task belong in that
task's plan, not here.

- One question, or one small related group, at a time, with AskUserQuestion.
  Recommended option first, marked "(Recommended)", trade-off in the
  description.
- If the codebase can answer it, read the codebase instead of asking.
- Follow up on answers that open new branches. Keep going until you can write
  the whole master plan with no "TBD" and no "either is fine".

Topics that belong at this level:

- **Stack and library choices**, and what they foreclose. Name the alternative
  you are rejecting and why.
- **Module and package boundaries** — what may import what. This is what makes
  parallel tasks possible or impossible.
- **Data model shape** — the entities and their relationships, not every field.
- **Public contracts** — API surface, event names, route structure. Anything two
  tasks must agree on has to be pinned here or they will disagree.
- **v1 versus later.** The most valuable output of this interview. Push hard on
  what is genuinely out.
- **Auth, permissions, and tenancy**, if relevant — retrofitting these is a
  rewrite.
- **Rollout** — feature flag or not, and what happens to existing data.
- **Testing investment** — if any of this needs new mocks, a new dependency, or
  a new CI step, ask whether that is actually wanted, once, here.

## Phase 3 — Decompose

Build a dependency graph of tasks. Every task must satisfy all four:

1. **Leaves the repo green.** Typechecks and tests pass when it lands alone. A
   task that only compiles once a later task arrives cannot be a PR.
2. **Fits one executor context.** If a task needs more than roughly a day of
   focused work or touches a dozen-plus files, split it.
3. **Reviewable alone.** A reviewer with the task's spec and its diff can tell
   whether it is correct — the spec, not this file, because that is all the
   reviewer gets.
4. **Has an owner set of files.** Two tasks that will edit the same file cannot
   run in parallel — that is a merge conflict you designed in.

Policy:

- **Vertical slices by default.** For a feature, one task carrying schema, API,
  and UI is preferable to three horizontal layers, because the horizontal
  bottom two are dead code until the top one lands. Split a slice only when it
  breaks rule 2, and when you do, make the lower layer independently useful or
  accept it as knowingly-inert scaffolding and say so.
- **Serial prefix, then fan-out.** Greenfield initiatives almost always have a
  first task nothing can precede: scaffolding, tooling, config, the shared
  types. Expect the graph to be a short chain followed by a wide wave, not
  parallel from step one.
- **Dependent tasks are serialized, not stacked.** A task branches from the
  default branch, so a task needing another's code must run after it has merged.
  Do not plan stacked branches — if two tasks are genuinely inseparable, merge
  them into one task instead.
- **Branch names**: `<initiative-slug>-<task-slug>`. This overrides the plain
  slug in the shared conventions' Branch names rule; the shared constraints
  still hold — kebab-case, no slashes, because the name becomes a worktree
  directory. The shared four-word cap applies to each half.

Then validate the graph before writing it: no cycles, no task depending on
something absent, no two parallel tasks sharing an owned file, and every task
reachable. Group the tasks into **waves** — a wave is a set with no dependency
on each other, runnable at the same time.

## Phase 4 — Write the master plan

Write to `.claude/initiatives/<slug>.md`, creating the directory if needed. The
slug is kebab-case from the initiative name, at most four words.

Aim for a master plan **under 20 KB**. `/branch`, `/plan` and `/review` all pull
from this file across every task of the initiative, so its size is multiplied by
the task count before any code is written. They read it by **section**, with
`sed` ranges over the `##` and `###` headings below — so keep those headings
exactly as the template spells them, and never nest a `###` task slug under
anything but `## Task graph`.

Detail that only one task needs belongs in that task's spec, not here. A plan
well past 20 KB usually means either the initiative should be two initiatives,
or the Architecture decisions have drifted into implementation detail.

Commit this file if the repo tracks it — task work happens in worktrees, and an
untracked file is invisible there. Check with
`git check-ignore -v .claude/initiatives/<slug>.md`; if it is ignored, say so in
the hand-off so the user knows it must be copied into each worktree instead.

```markdown
# <Initiative name>

> Status: derived from git, not tracked here — see Status below.

## Goal

One or two paragraphs: what this initiative delivers and why, in product terms.

## Out of scope

Initiative-wide exclusions. Every task inherits these. Be specific — this is
the list that stops six branches from growing scope independently.

## Architecture decisions

Every decision from the interview. Task planners and executors treat these as
settled and never re-open them. Include the *why* wherever the choice was close
— a decision with no rationale gets re-litigated.

- <question> → <decision>. <Why, if not obvious.>

## Constraints inherited by every task

Rules each task's plan must restate and each executor must follow: module
boundaries, naming conventions, the contracts pinned above, and the project
rules from CLAUDE.md most at risk across this initiative.

<!-- Optional, and only when two or more tasks must agree on the exact text:
     a `## Pinned contracts` section holding the shared schema, API surface or
     event names. It is the section most likely to blow the 20 KB target, so
     pin only what a sibling task would otherwise get wrong. -->

## Task graph

### <task-slug>

- **Branch**: `<initiative-slug>-<task-slug>`
- **Depends on**: <task-slugs, or "nothing">
- **Goal**: one sentence.
- **Scope**: what this task covers.
- **Out of scope**: what belongs to a sibling task and must not leak in — name
  the sibling.
- **Owns**: the files and directories this task may modify. No parallel sibling
  may list the same ones.
- **Done when**: the observable condition that makes this mergeable.

### <next-task-slug>
...

## Waves

Tasks with no dependency on one another, runnable at the same time. A wave
starts only once every task in the previous wave has merged.

- **Wave 1**: <task-slug>
- **Wave 2**: <task-slug>, <task-slug>, <task-slug>
- **Wave 3**: <task-slug>

## Integration check

Every task passing its own review does not mean the assembled whole works.
State what to verify once the last wave lands, and the flows to exercise
end to end.

## Status

Not tracked in this file — derive it:

- merged: `gh pr list --state merged --search "<initiative-slug>-"`
- open: `gh pr list --state open --search "<initiative-slug>-"`
- started but unmerged: `git branch -a --list "*<initiative-slug>-*"`
```

## Phase 5 — Validate and hand off

Re-read the plan as a task planner with zero context:

- Could two parallel tasks in the same wave collide? Check the Owns lists
  against each other, not just against the graph.
- Does every task leave the repo green on its own? The most common decomposition
  error is a task whose code does not compile until its sibling lands.
- Is any architectural question left for a task planner to decide? If so, go
  back to Phase 2.
- Is any task obviously too large for one branch? Split it now.

Then report: the master plan path, the wave structure, and the dispatch lines
the user can run. One per task, in wave order:

```
/branch --initiative <slug> --task <task-slug>
```

Tasks in the same wave can run at the same time in separate sessions. Say
explicitly that a wave must fully merge before the next begins, and that you
have not started any of them.

Then give the unattended alternative as one further line:

```
/execute <slug>
```

It runs the whole plan with no gates — every task of a wave at once, every wave
in order, each PR merged once a reviewer subagent passes it clean, and every
open question decided without the user. Name the trade-off in one clause: the
per-task dispatch lines keep them at every gate, `/execute` gives that up to
finish while they are away. Start neither yourself.

## Rules

- You never write task specs. `/branch` invokes `/plan` per task, at the time
  that task starts, so its verified facts reflect the tree as it actually is.
  Writing them here would mean fabricating facts about code that does not exist
  yet.
- Nothing downstream of `/plan` reads this file. Each task's `/plan` copies the
  decisions and constraints that bear on it into that task's spec, and the
  executor and reviewer work from the spec alone. Write every decision so it
  survives that copy — a decision that only makes sense next to its neighbours
  here will arrive at the executor stripped of them.
- You never invoke `/branch` and never implement. The master plan is the
  deliverable.
- Decisions belong here only if they constrain more than one task. Everything
  else is the task planner's job.
- If the initiative turns out to fit in a single branch, say so and point the
  user at `/branch` instead of inventing a graph.
