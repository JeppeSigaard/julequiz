# Code conventions (shared)

Referenced by the `branch`, `plan`, and `review` skills, and by the `developer`
and `reviewer` agents. Change a rule here, not in five places.

Read the project's `CLAUDE.md` first when it exists. A project rule beats
anything below.

## Priority order

Five attributes, in strict order. When two of them conflict, the higher one wins.
After John Arundel's CRISP ruleset:
<https://bitfieldconsulting.com/posts/crisp-code>

1. **Correct** — it does what it is meant to do.
2. **Readable** — the next reader understands it on one pass.
3. **Idiomatic** — it looks like the code around it.
4. **Simple** — it holds no part that earns nothing.
5. **Performant** — it does not waste the machine.

Never trade down the list. Do not hurt readability for speed, and do not hurt
correctness for anything.

## 1. Correct

Assume that wherever a bug *can* exist, one *does*. Read the surrounding code
before you call a change safe.

A green test suite is necessary, not sufficient. A test can be wrong too — read
each new test as an adversary, and ask what it would still pass with the code
broken.

### Tests

Write a test only for real branching or edge-case logic, or to lock in a bug fix.

Skip it for a simple derivation, a constant, or a small UI change whose
correctness is visible on read. A test there is ceremony.

When a test would need new mocks, a new dependency, or a new CI step, that is a
decision for the user, not a default yes.

## 2. Readable

Readability outranks everything except correctness. Remove the obstacles to
understanding rather than adding explanation on top of them.

Re-read your own change as a stranger would. Any part that costs real effort to
follow is a defect, not a style preference.

Reject the function call, the layer, or the indirection that exists only to
satisfy a rule. It buys nothing and it costs a jump.

### Comments

Comments must ADD value. Write one only for a non-obvious constraint, an
invariant, a *why*, or a corner case.

Never write a comment that explains what the code does. When in doubt, write no
comment.

## 3. Idiomatic

Follow the idiom, naming, and comment density already in the file. A change that
introduces a new style is not a small change, whatever its line count.

Use the language's own conventions, not a pattern carried in from another
language. Keep names consistent locally: the same concept gets the same name
everywhere in the file.

Small deviations look harmless one at a time. They add up into constant friction
for every later reader.

## 4. Simple

Simplicity comes from taking things away, not from adding abstraction.

Accept repetition when the alternative is a forced abstraction. Two similar
blocks that read straight through beat one clever helper that hides the
difference.

Prefer fewer functions and shallower call stacks. A function is as long as it
needs to be; length alone is not a reason to split it.

## 5. Performant

Lowest priority, and still not free to ignore. Know the cost of the design you
pick — the allocations, the data structure, the work inside the loop.

Optimise programmer time over machine time in the normal case. Spend on speed
only where the measurement, or the obvious scale, asks for it.
