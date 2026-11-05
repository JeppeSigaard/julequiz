---
name: plan
description:
  Draft an executable spec for a less capable executor agent. Explores the
  codebase to verify every architecture fact, reads the project's design docs,
  interviews the user on every open design decision, and writes the finished
  spec to .claude/specs/<slug>.md. Produces a plan only — never implements.
  Use when the user says /plan or wants a feature or fix planned before coding.
argument-hint: <task description> [initiative master-plan path]
---

# /plan — Executable spec for an executor agent

You are the planner. A different, less capable agent (the executor) will later
implement this in a fresh session with full repo access and this spec as its
work order. The executor is literal-minded: it follows instructions well but
makes poor judgment calls when instructions are ambiguous, rediscovers
architecture slowly, and falls into known traps unless warned. Your job is to
remove every judgment call the executor would otherwise have to make.

You produce a plan only. Never implement it, never launch the executor, never
edit code in this session.

The task is in the arguments. If they are empty or too vague to even scope, ask
the user what the task is before doing anything else.

If the arguments include an **initiative master plan** (a path under
`.claude/initiatives/`), read it before anything else — by section, not whole.
These files run to 30-40 KB and you need four parts of them:

```
sed -n '/^## Out of scope/,/^## Architecture decisions/p'      <path>
sed -n '/^## Architecture decisions/,/^## Task graph/p'        <path>
sed -n '/^## Constraints inherited by every task/,/^## Task graph/p' <path>
sed -n '/^### <task-slug>$/,/^### /p'                          <path>
```

Read a further section only when one of those points at it — for example a
`## Pinned contracts` block this task has to implement against.

Its Architecture decisions and Constraints are **settled**: never re-interview
on them. **Restate every one that bears on this task inside the spec**, along
with the pinned contracts it must honour and its Owns list verbatim. This is not
optional duplication. The spec is the only file the executor and the reviewer
read, so anything left in the master plan alone does not reach them. Its Out of
scope and the Owns list are hard boundaries: the spec must not direct the
executor outside the files this task owns, because sibling tasks own the rest and
may be running in parallel. Interview only on what is genuinely still open at
task level.

## Process

### 1. Read the docs

- Read `CLAUDE.md` and `AGENTS.md` if they exist — the spec must never
  contradict them, and it should restate the rules the executor is most likely
  to violate *for this particular task*, not all of them.
- If a `notes/` or `docs/` directory exists, read the design docs relevant to
  the task.
- Check `.claude/initiatives/` for a master plan covering this area even when
  none was passed in — an initiative's settled decisions bind this task too.
- Harvest `.claude/specs/` for prior knowledge, on a budget. Specs run to 20-50 KB
  each and a repo accumulates dozens, so never read the directory wholesale.
  1. `grep -l` for the symbols and paths this task touches, to find the
     overlapping specs.
  2. Check each hit's `Status:` line. **Ignore the Architecture facts of any spec
     not marked `ready for execution`** — a merged spec describes code that has
     since changed, and a wrong verified fact is worse than none.
  3. Read the **Traps** sections of the hits regardless of status, even when the
     area only partly overlaps. Traps outlive the code they were found in, they
     are the most expensive knowledge in a spec, and they are the most reusable.
     Extract them with `sed -n '/^## Traps/,/^## /p'` rather than reading whole
     files.
  4. Read at most two specs end to end, and only when the overlap is direct.

  Do not contradict a decision in a spec marked `ready for execution` or
  `in progress` — either may be in flight on another branch right now.

### 2. Codebase research

Verify every architectural claim you intend to put in the spec by reading the
actual code. The executor will trust the spec over the code, so a wrong file
path or a misremembered pattern is worse than no guidance at all.

- Use Explore subagents for broad fan-out (where does X live, what naming
  conventions exist, which modules touch this data), passing `model: "sonnet"` —
  locating files is mechanical, and the fan-out is where this phase's tokens go.
  Read the load-bearing files yourself, on the session model.
- For each area the task touches, find the closest existing feature and read it
  end to end — that becomes the pattern the spec points at ("do it like
  `path/to/File.ts` does").
- Collect exact file paths with line numbers, exact type and function names,
  data model names, schema locations, and the commands used for codegen.
- Establish which commands are safe to run locally (type checks, codegen, unit
  tests) and which are off limits per `CLAUDE.md`. Never instruct the executor to
  touch a database or a shared dev environment — no migrations, no schema
  push/pull/reset, no container commands. Editing schema files is fine; applying
  the change is the user's job.
- Hunt for traps deliberately — this is the highest-value part of research, and
  the part that is skipped when time is short. Read
  `.claude/skills/plan/references/trap-patterns.md` for the archetypes to
  search for and the techniques for surfacing them in an unfamiliar repo. The
  two that pay off fastest: the git history of the files you are about to change
  (fix commits and reverts mark traps someone already paid for), and any
  surviving comment that explains a *why*.

### 3. Interview the user

Interview the user on **every** open design decision — anything where two
reasonable implementations differ. Do not decide these yourself and do not leave
them for the executor.

- Ask one question, or one small related group, at a time using AskUserQuestion.
  Always put your recommended option first, marked "(Recommended)", with the
  trade-off in the description.
- If a question can be answered by reading the codebase, read the codebase
  instead of asking. Likewise, if it is already answered in an initiative master
  plan, take that answer — re-asking a settled decision invites a different
  answer in this branch than in its siblings.
- Typical topics: scope boundaries (what is explicitly out), data model choices,
  edge-case behavior, UX copy and states, permissions and auth, backfill or
  migration strategy, rollout (feature flag or not), what happens to existing
  data, and — if testing this would need new mocks, a new dependency, or a new
  CI step — whether that investment is actually wanted.
- Keep going until you can write the entire spec without a single "TBD" or
  "either is fine". Follow up on answers that open new branches.

### 4. Write the spec

Write to `.claude/specs/<slug>.md`, creating the directory if needed.

**If the caller supplied a slug or a spec path, use it verbatim.** `/branch` names
the branch, the worktree, and the spec with one value, and deriving your own here
points its later phases at a file that does not exist. Derive a slug only when
none was given, by the Branch names rule in
`.claude/skills/_shared/git-conventions.md`. Include a ticket id in the header
only when one exists; side projects have none.

Read `.claude/skills/_shared/code-conventions.md` before writing. The Traps and
Verification sections below restate its comment and test rules on purpose — the
executor reads only the spec, so the spec has to stand alone.

```markdown
# <Task name>

> Ticket: <ID> (if known)
> Status: ready for execution

The status line is a lifecycle field, not a constant. Later skills rewrite it:
`in progress — <branch>`, then `merged — <sha>` once the PR lands. Never write
any value other than `ready for execution` here; you are the first stage.

## Goal

One paragraph: what this does and why, in product terms.

## Out of scope

Explicit list. The executor must not "helpfully" add any of these.

## Decisions made

Every decision from the interview, with the chosen answer. The executor never
re-opens these.

- <question> → <decision>

## Architecture facts (verified)

Facts the executor would otherwise rediscover slowly. Every path and name here
was verified against the code during planning.

- <fact, with file_path:line references>

## Implementation steps

Ordered, literal steps. Each says WHAT to change, WHERE (exact paths), and
points at an existing pattern to copy. Example:

1. Add `refundedAt DateTime?` to the `Order` model in `prisma/schema.prisma`
   (next to `paidAt`, line ~412), then run the client codegen command. Do NOT
   create or apply a migration — the user handles those.
2. Add the `refundOrder` mutation in `<module>/order.gql` following the
   `cancelOrder` mutation in the same file. Resolver goes in
   `<module>/resolvers.ts` — copy the actor-passing pattern from `cancelOrder`.
3. ...

## Traps

Places where the obvious approach is wrong. Each entry needs three parts: the
prohibition, *why* the attractive option fails, and what to do instead. A
prohibition with no mechanism gets overridden under pressure.

Name the file when warning against copying existing code — apparent in-repo
precedent is what makes the executor confident in the wrong choice.

- **Do not <attractive wrong thing>.** <Why it fails.> <Do this instead.>
- Comments must ADD value: only a non-obvious constraint, invariant, why, or
  corner case. Never comment to explain what the code does — when in doubt,
  write no comment. <Name the one or two spots in this change that warrant a
  comment, and say everything else needs none.>
- <etc.>

## Verification

Whether this needs new tests, not just which ones — follow the project's testing
rules. Default to no test for straightforward logic (simple derivations,
constants, small UI changes) whose correctness is visible on read; write one only
for real branching or edge-case logic, or to lock in a bug fix. If a test would
require mocking unrelated infrastructure, a new dependency, or a new CI step,
that is a sign to raise it as a user decision in step 3 rather than defaulting to
yes. Either way, state the flows to exercise and the expected behavior for each
edge case decided above.
```

### 4b. Keep it to size

Aim for a spec **under 12 KB**. The executor reads it, the reviewer reads it, and
every iteration of the caller's fix loop reads it again, so each kilobyte is paid
several times over.

Cut in this order when it runs long: prose that restates a section heading, code
blocks longer than about ten lines (point at the file to copy instead), and
Architecture facts the executor does not need for *these* steps. Never cut Traps
or Decisions made — those are the sections that stop a wrong implementation.

Well past 12 KB with nothing left to cut means the task is too large for one
branch. Say so rather than shipping the spec.

### 5. Sanity check

Re-read the finished spec as if you were the executor with zero context:

- Is any step ambiguous — could a literal-minded agent pick the wrong of two
  interpretations? Fix it.
- Does every file path, symbol, and pattern reference actually exist? Spot-check
  the ones you wrote from memory.
- Is anything left as a judgment call that should have been a user question? If
  so, go back to step 3.

### 6. Hand off

Tell the user: the spec path, a three-to-five line summary, the key decisions
locked in, and that an executor can be started in a fresh session with a prompt
like "Implement the spec at `.claude/specs/<slug>.md`". Do not start the executor
yourself — if a caller (such as `/branch`) invoked this skill, it takes over from
here.
