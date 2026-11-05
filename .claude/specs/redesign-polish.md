# Redesign: polish

> Status: in progress — redesign-polish

Branch `redesign-polish`, base and PR target `claude/sweet-mendel-p0gtn1` (never `main`).

## Goal

All redesign tasks (foundation, board, door-frame, door-content, end-screen, settings, minigames) have merged. Check that the assembled quiz is coherent (felt advent calendar: garland, stitched paper doors, rosettes, paper-card open door, end screen under fireworks, per-pack colours), fix shared-value inconsistencies found, and bring CLAUDE.md up to date with everything the redesign changed.

## Out of scope

- New features and screen-specific rewrites.
- Any file except the Owns list. **Owns (hard boundary): `src/styles.css`, `src/components/decor.tsx`, `CLAUDE.md`.** Everything else found goes in a follow-up list in the PR body, not in the diff.
- Settled and never re-opened: the master plan's decisions (fixed 1920×1080 `Stage`, seven pack colours with derived `color-mix` tokens, Hold 1 red / Hold 2 gold, fonts Mountains of Christmas + Nunito, decor primitives in `decor.tsx`, EndScreen its own component, motion only ambient + door opening, no new dependency/test framework/CI step, no committed screenshot scripts, token utilities only: no raw hex, no Tailwind `green-/red-/amber-/gray-`). Keyboard, scoring, consolation (+5) and `src/quizState.ts` format are untouched.
- Known follow-ups to list (do NOT fix): FoxChickenGrain message pill flush against the boat; WordPuzzle's convoluted `offset` key; `Standard.tsx` formatting churn; `QuestionScreen` neutral pill etc.

## Decisions made / Autonomous decisions

- `var(--color-<derived>)` in arbitrary values resolves on `:root` against default `--quiz-*` under `@theme inline`. Verified: no `var(--color-` use exists in `src/` today (everyone uses `color-mix(... var(--quiz-*) ...)`). → Document the rule in CLAUDE.md; change nothing in `styles.css` for it. Rejected: redeclaring all ~20 derived tokens on `[style*="--quiz-"]` (duplicates every formula, hacky selector, risks the utilities).
- `Paper`'s hardcoded radius/shadow and `PillButton`'s fixed 34px type, min-width and key-cap-after-label, `TeamPlaque` having no winner ring → leave as they are; list as follow-ups. Rejected: adding props to `decor.tsx` now (no screen is inconsistent because of them; "no new features"). Exception: only change `decor.tsx` if the Integration check shows a visible shared-value bug there.
- Keep `Paper`'s extra optional `stitchSize` prop (additive); mention in CLAUDE.md.
- Fix in `styles.css`/`decor.tsx` only values that are shared and visibly inconsistent across screens (e.g. a derived-colour percentage that fails on the three-question recoloured pack, keyframe timing, stitch colours). Anything screen-specific → follow-up.
- Playwright scripts live in the scratchpad (outside the repo); nothing added to `package.json`. The recoloured/three-question pack is a temporary local copy under `src/quizzes/` and `public/quizzes/` that must be deleted before finishing (never committed). Rejected: committing a test pack.
- No questions were asked (unattended).

## Architecture facts (verified on the base branch)

- `src/styles.css`: `:root` defaults for `--quiz-*`; `@theme inline` defines the colour tokens (night, felt, felt-deep, paper(+lit/edge), ink(+soft), snow, mist, accent(+deep), highlight(+deep), team-1/2 (+deep/ink)), fonts, `shadow-paper-edge`, `shadow-pill-team-1/2/dark`, `animate-twinkle` (2.4s), `animate-glow` (2s alternate). `team-1-ink` = paper, `team-2-ink` = ink.
- `src/components/decor.tsx` (142 lines): `Paper` (with extra `stitchSize`), `KeyCap`, `PillButton`, `TeamPlaque` (sizes `board` 360px / `end` 440px, rotate -2/+2, strings above, `AnimatedNumber`).
- `src/components/Stage.tsx`: outer `fixed inset-0 bg-night` carries the `--quiz-*` inline style; inner 1920×1080 box scaled via `resize` effect, felt texture gradient.
- `src/pages/index.tsx`: `Stage` > own `Snowfall` + (`EndScreen` when finished, else `Garland`, `BoardHeader`, grid of `QuestionCard`, `Footer`), `QuestionScreen`, `SettingsMenu` (key `m`/Escape). `gridColumns(count)` and `tickGroup` make the board dynamic. `?quiz=` picks the pack (default `DEFAULT_QUIZ` in `src/config.ts` = `jul-2025`); unknown pack lists packs (`text-highlight underline`) without `Stage`.
- Packs: `src/quizzes/<name>/quiz.ts` (`Quiz`, incl. `colors`, `music.background/finale`, `pointsPerQuestion`, `doorWord`, `shuffle`) and `questions/*.tsx` (`QuestionSpec`, sorted by filename, converted by `src/questionTypes/` `toQuestion`); assets in `public/quizzes/<name>/{audio,images,video}`. `QuestionSpec.type`: standard, wordPuzzle, music, posterReveal, video, custom (02, 07, 08 in jul-2025). `backgroundVolume` dims the background music.
- Wave-2 files: `src/components/board/{Garland,BoardHeader,Footer}.tsx`, `QuestionCard.tsx` (no longer receives the question), `QuestionScreen.tsx` (paper card, ribbon, holly, scrim `bg-night/80` + blur), `EndScreen.tsx` (own `Snowfall` + `Fireworks`, crown, tie "Uafgjort!"), `SettingsMenu.tsx` + `ResetQuizSetting.tsx`, mini-games in `src/components/`.
- Per-spec notes in `.claude/specs/redesign-*.md` (`## Autonomous decisions`) are the source for CLAUDE.md prose; read them and the code before writing.

## Implementation steps

1. `cd /home/user/julequiz/.claude/worktrees/redesign-polish` (use absolute paths; `EnterWorktree` may refuse). `npm ci` if `node_modules` is missing. Run `npm run check`; it must pass before you start.
2. Build and serve: `npm run build && npm start` (port 3000, `/julequiz/`). Write the Playwright script in the scratchpad dir using the pre-installed Chromium (find it with `ls ~/.cache/ms-playwright`; resolve `playwright` from a scratchpad `node_modules` or a global install, do not add it to the repo). Capture `console` messages and failed requests.
3. Run the Integration check below at 1920×1080 and once at 1366×768, taking screenshots into the scratchpad and looking at each. Reach states by clicking, by `m` → "Nulstil quiz", or by seeding `localStorage` (key and shape in `src/quizState.ts`; read it first).
4. For each inconsistency: if it is a shared value inside `src/styles.css` or `src/components/decor.tsx`, fix it there (smallest edit), rebuild, re-check. Otherwise add a line to the follow-up list. Keep notes in the scratchpad.
5. Rewrite the stale parts of `CLAUDE.md` (Danish; keep the existing structure and tone; target under ~9 KB):
   - Stack/Arkitektur: fixed 1920×1080 `Stage` (no `vw`/`vh`; `fixed` inside it is stage-relative); `index.tsx` composition above; `EndScreen` in place of header+grid, with its own `Snowfall`/`Fireworks`, tie shows "Uafgjort!"; board pieces in `src/components/board/`; the lightning-round remark and "overwrites each door's id" remark are wrong now: delete them (point is `EndScreen` music = `music.finale`; `QuestionCard` gets no question).
   - Quiz-pakker: `src/quizzes/<name>/quiz.ts` + `questions/*.tsx`, `?quiz=`, `DEFAULT_QUIZ`, `public/quizzes/<name>/`, `QuestionSpec` types and `src/questionTypes/` renderers (replace the old `src/questions/QuestionN.tsx` / `Question.body` text, which no longer describes the packs; verify against the code).
   - Farver og stil: the seven `Quiz.colors`, `--quiz-*` on `Stage`, token utilities in `styles.css`, no raw hex or Tailwind palette classes, derived tokens via `color-mix`; the `@theme inline` gotcha (never `var(--color-<derived>)` in arbitrary values: use `color-mix(... var(--quiz-*) ...)`); fonts `font-display`/`font-body`; decor primitives (`Paper` incl. `stitchSize`, `KeyCap`, `PillButton`, `TeamPlaque`) and their known limits (hardcoded radius/shadow; fixed pill size; no winner ring); animations `animate-twinkle`/`animate-glow`; settings menu (`m`) and `ResetQuizSetting`; door-content tiers live in the renderers.
   - Keep: commands table, keyboard list (verify against `QuestionScreen.tsx`), Medier, Arbejdsgang.
6. Run `npm run check`. Delete the temporary local pack and any scratch output from the repo (`git status` must show only the Owns files). Do not commit unless the caller says so.
7. PR body (when asked): what was fixed, what was found and not fixed (follow-ups, incl. the out-of-scope items above), and that `Paper.stitchSize` was kept.

## Integration check (run in step 3)

In `npm run build && npm start`, at 1920×1080 and once at 1366×768:

- Fresh board: garland twinkles, doors glow in turn once the title is clicked, snow falls.
- Open every door type (standard, wordPuzzle, music, posterReveal, video, custom 02/07/08). Reveal and award to Hold 1, Hold 2 and nobody. The won door swings open with the right rosette; points animate on the plaque.
- Background music dims for doors with `backgroundVolume` and restores on close (inspect via the `Audio`/`volume` state or listen for the volume calls; a code read of `pickQuestion`/close in `index.tsx` is acceptable evidence if headless audio is unavailable; say so).
- `m` opens settings over the board; reset clears the pack.
- Finish the quiz (seed state): end screen crowns the leader, a tie shows "Uafgjort!", plaque clicks add 5.
- Local pack copy with three questions and changed `colors` (not committed) recolours every screen; the board lays out for three doors.
- `/julequiz/?quiz=nope` shows the restyled pack list.
- Console: no hydration warnings, no 404s.

## Traps

- **Do not edit any file outside the Owns list**, even for an obvious one-line bug (e.g. FoxChickenGrain, Stage.tsx, index.tsx). Sibling work is done and the boundary is the plan's; list it as a follow-up.
- **Do not add props or primitives to `decor.tsx` speculatively.** The task is "fix inconsistencies found", not to remove the known workarounds. Changing `Paper`'s default radius/shadow or `PillButton` sizes would shift every screen that already tuned itself to them (door-frame, settings, minigames).
- **Do not "fix" the derived-token gotcha by removing `inline` from `@theme`.** Utilities would then resolve on `:root` and stop following pack colours on the Stage.
- **Do not leave the test pack behind.** `import.meta.glob` in `src/quizzes/index.ts` picks up any `src/quizzes/*/quiz.ts`, so a stray copy ships and appears in the pack list. Remove it and re-run `npm run check`.
- **A saved quiz survives reloads** (`localStorage`); reset it between scenarios or states leak across checks. Playwright contexts should be fresh.
- **`check` only proves typecheck + build.** Do not claim a door works without opening it.
- CLAUDE.md must be verified against code, not against this spec or older specs: older specs describe code that has since changed. Comments in code: add none unless a non-obvious why (a CSS fix may warrant one Danish line).

## Verification

`npm run check` passes; the Integration check passes (or each failure is fixed within the Owns list or recorded as a follow-up); `git status` shows only `src/styles.css`, `src/components/decor.tsx` (if needed), `CLAUDE.md` and this spec. No tests are added (project has none).
