# Redesign: door-frame

> Status: merged — d11ce8d

Branch `redesign-door-frame`, branched from and PR-targeting `claude/sweet-mendel-p0gtn1` (the initiative's integration branch, NOT `main`: every push to `main` deploys to GitHub Pages). Diff against `origin/claude/sweet-mendel-p0gtn1`. Master plan: `.claude/initiatives/redesign.md` (settled; restated below). Wave 1 (`foundation`) is merged.

## Goal

The open door (`src/components/QuestionScreen.tsx`) is restyled to match `.claude/initiatives/redesign-mockup/Door.dc.html`: a dimmed, blurred board behind a stitched cream paper card with a red ribbon banner `{doorWord} {n}`, a holly sprig top-left, a round close button top-right, and at the bottom big pill buttons with key caps ("Vis svaret" + `Enter`; award buttons `1`, `Q`, `2`). The card's content area is a fixed box that the door content (`question.body`/`answer`) is centred in. The spring entrance stays.

## Owns (hard boundary)

`src/components/QuestionScreen.tsx` — nothing else. Siblings run in parallel on `index.tsx`, `QuestionCard.tsx`, `src/questionTypes/`, `EndScreen.tsx`, `SettingsMenu.tsx`, `ResetQuizSetting.tsx`, the mini-games, `styles.css`, `decor.tsx`. A missing token or primitive is built locally in `QuestionScreen.tsx` and named in the PR body.

## Out of scope

- What is inside the content area (`door-content`, `minigames`): no edits to `src/questionTypes/*`, `FoxChickenGrain`, `WordPuzzle`, `GuessThatCat`, `MusicBox`, and no "Spørgsmål"/"Svar" caption (the mockup's caption belongs to the content).
- Keyboard behaviour, scoring, `QuestionScreen`'s props, sounds, `index.tsx` (the `<QuestionScreen …>` call stays as is).
- Fonts, new dependencies, tests, committed screenshot scripts, CLAUDE.md edits.

## Settled decisions restated (from the master plan)

- Fixed 1920x1080 `Stage`; the mockup is 1600x900, so every mockup px is multiplied by 1.2. No `vw`/`vh`. `position: fixed` inside the stage is stage-relative (intended).
- Colours only through token utilities (`bg-paper`, `text-ink`, `bg-accent`, `bg-accent-deep`, `border-accent/35`, `bg-night/..`, `text-paper-lit` …). No raw hex, no Tailwind `green-*`/`red-*`/`amber-*`/`gray-*`.
- Fonts: `font-display` (ribbon), `font-body` (rest). Icons: `material-symbols-outlined`; decoration is inline SVG with `aria-hidden`.
- Team names come from `props.teamNames`, never hardcoded "Hold 1"/"Hold 2".
- Motion: keep the existing spring entrance exactly (`scale 0 -> 1`, spring `visualDuration 0.4`, `bounce 0.5`). No new animation.
- `exactOptionalPropertyTypes`: omit optional props (e.g. `keyHint` is always given here; do not pass `undefined`).
- UI text and comments in Danish.

## Decisions made

- Pill buttons use `PillButton`/`KeyCap` from `./decor` as pinned (variants `dark`, `team-1`, `neutral`, `team-2`).
- The card is built locally, not with `Paper` (see Traps).
- Top-left play button (old "reveal" icon) is removed; "Vis svaret" pill replaces it. Mouse path to reveal is preserved.

## Architecture facts (verified)

- `QuestionScreen.tsx` today: `motion.div` wrapper `fixed … z-40` (line 75-83) with `bg-green-200` card (84), header with play/close material-symbols buttons (85-105), `<main>` showing `hasAnswered ? answer : body` (106-108), absolute footer with plain text buttons (109-134). Keyboard `handleKeyDown` (40-66) and `useEffect` (67-72), `onRevealAnswer`, `onAnswer(team?)` (25-38) are correct and stay byte-for-byte.
- The board is still rendered under the open door (`index.tsx` renders `<QuestionScreen>` as a sibling after the board, inside `<Stage>`), so the "dimmed board" is a scrim over it, not a ghost grid.
- `decor.tsx` exports `PillButton` (props `variant`, `keyHint`, `className`, button props; already min-w 276px, text 34px, `gap-4`, key cap rendered AFTER children) and `KeyCap`. `Paper` hardcodes `rounded-[19px]` and `shadow-paper-edge` (7px edge, 26px blur).
- `styles.css` tokens: `night`, `felt`, `paper`, `paper-lit`, `paper-edge`, `ink`, `ink-soft`, `accent`, `accent-deep`, `highlight`; `@theme inline`, so `var(--color-*)` is NOT reliable at runtime. Quiz colours exist as `--quiz-*` on the Stage root, usable in arbitrary values.
- Stage root text colour is `text-snow`: the card must set `text-ink` itself.
- Only caller: `src/pages/index.tsx:289`; props unchanged.

## Implementation steps

All in `src/components/QuestionScreen.tsx`. Add `import { PillButton } from "./decor";`. Leave lines 1-72 logic untouched. Replace the returned JSX with this structure (px = mockup x 1.2):

1. **Fragment root** with two siblings:
   - Scrim: `<div aria-hidden="true" className="fixed inset-0 z-40 bg-night/80 backdrop-blur-[4px]" />` (dims and blurs the real board; tune opacity by screenshot, mockup is ghost grid 18% + 55% overlay). Not clickable-to-close (behaviour unchanged).
   - The existing `motion.div` with the same `initial/animate/transition`, className `fixed inset-0 z-40 flex items-center justify-center` (drop `p-20`).
2. **Card** (inside motion.div): `<div role="dialog" aria-label={`${props.doorWord} ${props.questionIndex + 1}`} className="relative flex h-[912px] w-[1656px] flex-col items-center rounded-[36px] bg-paper text-ink px-[84px] pb-[53px] shadow-[0_12px_0_color-mix(in_oklab,var(--quiz-paper)_80%,black),0_48px_96px_rgb(0_0_0/0.6)]" style={{ backgroundImage: "radial-gradient(color-mix(in oklab, var(--quiz-accent) 6%, transparent) 1.8px, transparent 1.9px)", backgroundSize: "26px 26px" }}>` (mockup: 1380x760, radius 30, padding 0 70 44, dot grid 22px).
3. **Stitching**: `<div aria-hidden="true" className="pointer-events-none absolute inset-[17px] rounded-[24px] border-[4px] border-dashed border-accent/35" />`.
4. **Holly**: inline `<svg aria-hidden="true" width="144" height="108" viewBox="0 0 120 90" className="absolute left-[31px] top-[26px]">` using the mockup's four paths/circles (copy geometry from `Door.dc.html` lines 28-34). Fills with tokens, never hex: leaves `fill-ink-soft` and `fill-ink` with `stroke-ink` `strokeWidth=2`; berries `fill-accent`, third berry `fill-accent-deep`, highlight dot `fill-paper-lit`.
5. **Close button**: `<button type="button" aria-label="Luk lågen" onClick={() => props.onClose()} className="absolute right-[41px] top-[36px] flex size-[62px] cursor-pointer items-center justify-center rounded-full bg-ink/10 text-ink"><span className="material-symbols-outlined text-[32px]">close</span></button>`.
6. **Ribbon** (`-mt-0.5`, `relative flex items-start`): left tail `<div aria-hidden className="mt-[22px] -mr-[17px] h-[77px] w-[55px] bg-accent-deep [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,34%_50%)]" />`, `<h2 className="relative bg-accent px-[67px] pt-3 pb-[17px] font-display text-[79px] font-bold leading-none text-paper-lit rounded-b-[22px] shadow-[0_7px_0_color-mix(in_oklab,var(--quiz-accent)_72%,black)]">{props.doorWord} {props.questionIndex + 1}</h2>`, right tail mirrored with `-ml-[17px]` and `polygon(0_0,100%_0,66%_50%,100%_100%,0_100%)`. Keep `{doorWord} {n}` as a single text node pair exactly as before.
7. **Content box**: `<main className="flex min-h-0 w-[1200px] grow flex-col items-center justify-center gap-[26px] text-center">{hasAnswered ? props.question.answer : props.question.body}</main>` — the fixed box (mockup max-width 1000 -> 1200) the door content is centred in. No `overflow-hidden` (it would clip sibling-restyled content shadows); no padding hacks.
8. **Footer**: `<footer className="flex min-h-[101px] w-full items-center justify-center gap-[29px]">`.
   - `!hasAnswered`: `<PillButton variant="dark" keyHint="Enter" onClick={() => onRevealAnswer()}>Vis svaret</PillButton>`.
   - `hasAnswered`: `<PillButton variant="team-1" keyHint="1" onClick={onAnswer(1)}>{props.teamNames[0]}</PillButton>`, `<PillButton variant="neutral" keyHint="Q" onClick={onAnswer()}>Ingen fik den</PillButton>`, `<PillButton variant="team-2" keyHint="2" onClick={onAnswer(2)}>{props.teamNames[1]}</PillButton>`.
9. Remove the now-unused old header/play button/`absolute` footer. `x` still awards "ingen" via the unchanged handler.
10. Run `npm run check`; fix type errors only inside this file.

## Traps

- **Do not use `Paper` for the card.** `Paper` hardcodes `rounded-[19px]` and the 26px-blur shadow; passing a conflicting `rounded-[36px]` via `className` is decided by Tailwind's generated order, not by DOM order, and silently loses. `decor.tsx` is not ours to change. Build the card locally as in step 2-3 and name this in the PR body.
- **Do not build the shadows from `var(--color-*)`.** `styles.css` uses `@theme inline`; those variables may not exist at runtime and the shadow silently vanishes. Use `color-mix` on `var(--quiz-*)` as written in steps 2 and 6.
- **Do not use raw hex from the mockup** (holly greens, `#8f1d24`, `#cbb48c`) or `green-*`/`red-*`. Use the token mapping given; the greens differ slightly from the mockup and that is accepted.
- **Do not build class names dynamically**; Tailwind drops them. Full class strings only.
- **Do not use `vh`/`vw`/`h-screen`**, and do not restore `p-20` / `aspect-video` / `w-full` on the card; its size is the fixed 1656x912.
- **Do not put the scrim inside the spring `motion.div`**: it would scale up from 0 with the card. Keep it a sibling.
- **Do not touch `handleKeyDown`, the effect, or the sound calls.** `Escape` toggling answer/close, `Enter`/space, `1`, `2`, `q`/`x` must behave exactly as on the base branch. A `PillButton` is a real `<button>`; the window handler already `preventDefault`s keys, so focus-then-Enter does not double fire. Do not add `type="submit"` or `autoFocus`.
- **Do not hardcode "Hold 1"/"Hold 2"** (the old text was `props.teamNames`; keep it).
- **Do not set optional props to `undefined`** (`exactOptionalPropertyTypes`).
- Comments must ADD value: only non-obvious why. One warranted comment (Danish) on the scrim being a sibling of the spring wrapper (steps 1); everything else needs none.

## Verification

No tests. `npm run check` must pass. Then run `npm run dev` and, with the pre-installed Chromium via a Playwright script kept OUTSIDE the repo (scratchpad), at 1920x1080: reset the quiz (`m` -> "Nulstil quiz"), start it, open one standard door, screenshot before reveal and after reveal (Enter), compare to the mockup (render `Door.dc.html` scaled 1.2 if needed). Check: ribbon text `{doorWord} {n}` with folds, stitching and dots, holly top-left, close button works, spring entrance plays, board visibly dimmed behind. Then exercise the keyboard flow: `Enter` reveals; `Escape` after reveal returns to question; `Escape` on question closes; after reveal `1`/`2`/`q`/`x` award and (unchanged) close/record as on the base branch; mouse clicks on all pill buttons and the close button do the same. Check a door with tall content (a video or image door) and `FoxChickenGrain` still fit visually in the content box; report overflow in the PR body rather than editing other files.

## Autonomous decisions

- Card built locally instead of `Paper` — rejected: `Paper` with `className` overrides (Tailwind order makes radius/shadow overrides unreliable, `decor.tsx` not owned).
- Holly drawn with token fills (`ink`, `ink-soft`, `accent`, `accent-deep`, `paper-lit`) — rejected: the mockup's raw green hex (forbidden in components).
- Close icon via `material-symbols-outlined` `close` — rejected: the mockup's inline-SVG cross (master plan names material-symbols for UI icons).
- Top-left play/reveal icon button removed — rejected: keeping it (holly occupies that corner; the "Vis svaret" pill replaces it).
- Mockup's "Spørgsmål"/"Svar" caption omitted — rejected: adding it in the frame (it lives in the content area, out of scope).
- Scrim is a sibling with `bg-night/80` + `backdrop-blur-[4px]` over the real board — rejected: reproducing the mockup's ghost grid.
- Neutral button reads "Ingen fik den" and calls `onAnswer()` (no team) — rejected: the mockup's `back` behaviour, which would change keyboard/mouse semantics.
- Key cap placement follows `PillButton` (after the label) — rejected: reordering `1` before the label as in the mockup (would need editing `decor.tsx`).
- Content box is `w-[1200px] grow min-h-0` inside the fixed-size card — rejected: a hardcoded height (derived from card minus ribbon/footer, brittle).
- Ribbon and card shadows written as arbitrary `color-mix` on `--quiz-*` — rejected: new shadow tokens in `styles.css` (not owned).
