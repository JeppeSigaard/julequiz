# Trap patterns

A trap is a place where the **obvious approach is wrong** — where a
literal-minded executor, having read the spec and the surrounding code, would
still confidently do the wrong thing because the wrong thing looks right.

Defined relative to the executor's instincts, not relative to the codebase. If a
competent agent would not plausibly do the wrong thing here, it is not a trap: it
belongs in Architecture facts, or nowhere.

A well-formed entry has three parts. Missing the *why* is what makes traps get
ignored or "improved" by the executor:

1. the prohibition — what not to do
2. the mechanism — why the attractive option actually fails
3. the replacement — what to do instead

## Archetypes

Hunt for these by name. Most real traps are one of them.

**Attractive wrong tool.** An API that looks purpose-built for the job but has a
fatal edge case. Signal: you can name the thing the executor will reach for.
*The obvious observer/watcher/diff API whose callback fires on the wrong
transition; the batch helper that silently drops partial failures.*

**Broken precedent.** Existing code that looks like the pattern to copy but is
itself a latent bug. The most dangerous archetype, because the executor finds
apparent in-repo support for the wrong choice. Always name the file and say
explicitly that it is not a pattern to copy.

**Load-bearing shared contract.** A file, type, select, or config read by far
more callers than the task touches. State the blast radius, not just "don't
touch it" — an executor that understands the radius will not negotiate with it.

**Silent failure.** The wrong version throws nothing and logs nothing; it just
produces a null, an empty list, or a wrong number. Serialization and enum
mismatches are the classic source. Neither the executor nor a reviewer will
catch these by reading, so they must be in the spec.

**Near-identical names, different semantics.** Two helpers one character apart
where one is a function and one is a value, or one validates and one asserts.
Say which is which and what the wrong choice does.

**Framework boundary rule.** A rule the framework enforces that reads as
arbitrary style until it bites: relation loading that causes N+1 unless done the
framework's way, module or package boundaries that cannot be crossed, hook or
effect ordering, server/client component splits.

**Ordering as precedence.** A sequence of branches or middleware where the order
*is* the logic. An executor refactoring nearby code will happily reorder it.
Say that the order is semantic.

**The helpful addition.** The thing the executor will add because it seems
obviously missing — a fallback, a cache, a retry, a defensive default — where
failing closed or staying simple is the actual design decision. Overlaps with
Out of scope; put it in Traps when the executor needs to know *why*.

## Finding them in an unfamiliar repo

The traps for a given area are usually already recorded somewhere. In rough
order of yield:

- **Prior specs.** Harvest the Traps sections of existing specs in
  `.claude/specs/` for overlapping areas. This is the cheapest source and it
  compounds — every spec written makes the next one better.
- **Git history for the files you are about to change.** `git log --oneline -20 --
  <path>` and look for fix commits, reverts, and re-fixes of the same line. A
  revert is a trap someone already paid for. `git log -S'<symbol>'` finds when a
  workaround was introduced.
- **Existing comments that explain a *why*.** In a codebase with a
  no-redundant-comments rule, a surviving comment marks something non-obvious
  that bit someone. Promote it into the spec.
- **Tests with surprising expectations.** An assertion that looks wrong until you
  read the implementation is documenting a trap. So is a test named for a bug.
- **The absent obvious API.** If the repo plausibly needs some well-known API and
  never uses it, find out why before the executor "fixes" the omission.
- **The closest existing feature, read end to end.** Note every place it deviates
  from the naive implementation. Each deviation is either a trap or dead code —
  determine which.
- **Enforced config.** Lint rules, `tsconfig` strictness, CI checks. Anything
  enforced mechanically is something contributors kept getting wrong.

## Anti-patterns

- Generic advice with no specific wrong action attached ("handle errors", "write
  clean code"). Not a trap.
- Restating the whole style guide. Include only the rules the executor is likely
  to break *on this task*, and where possible say which specific spot in this
  change they apply to.
- A prohibition with no mechanism. The executor will treat it as a preference and
  override it under pressure.
- Facts dressed as traps. "The config lives in `X`" is an Architecture fact.
