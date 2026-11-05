# Redesign: foundation

> Status: in progress — redesign-foundation

Branch `redesign-foundation`, branched from and PR-targeting `claude/sweet-mendel-p0gtn1` (the initiative's integration branch, NOT `main`: every push to `main` deploys to GitHub Pages). Diff against `origin/claude/sweet-mendel-p0gtn1`. Master plan: `.claude/initiatives/redesign.md` (settled; this spec restates what binds this task).

## Goal

The theme, the stage, the decor primitives and the end-screen seam exist, and the quiz runs inside them. After this task the quiz plays exactly as before, but on a fixed 1920×1080 stage that is scaled to the window and letterboxed, coloured by seven pack colours (`Quiz.colors`) through Tailwind tokens. Wave-2 tasks (board, door-frame, door-content, end-screen, settings, minigames) build the new looks on top of this.

## Out of scope

- The new look of any screen (wave 2). `decor.tsx` primitives are knowingly **inert** until wave 2 uses them; their look follows the mockup, judged in isolation.
- Any file outside Owns. Sibling tasks own `QuestionCard.tsx`, `QuestionScreen.tsx`, `SettingsMenu.tsx`, `ResetQuizSetting.tsx`, `src/questionTypes/*`, the mini-games and the door files. Their `green-*`/`red-*`/`vh` leftovers stay for now; do not fix them.
- pack-theme's `snow`/`titleFont` fields, a per-pack decoration switch, a lightning round, new npm dependencies, a test framework, CI steps, committed screenshot scripts, other fonts, sound changes.
- Keyboard controls, scoring, consolation points (+5), `src/quizState.ts` format, `QuestionScreen`'s props and key handling.

## Owns (hard boundary)

`src/types.ts`, `src/quizzes/jul-2025/quiz.ts`, `src/styles.css`, `src/pages/_layout.tsx`, `src/components/Stage.tsx`, `src/components/decor.tsx`, `src/components/EndScreen.tsx`, `src/pages/index.tsx`, `CLAUDE.md`.

## Decisions made (settled in the master plan; never re-open)

- **Fixed stage**: one `Stage` box 1920×1080, `transform: scale()` to fit, centred, letterboxed in `night`. Lay out in px/Tailwind sizes against 1920×1080; no `vw`/`vh` inside the stage. The stage is transformed, so `position: fixed` inside it is relative to the stage (open door, settings, snow, fireworks stay inside).
- **Door count stays dynamic**: keep `gridColumns`/`tickGroup`; assume neither 24 doors nor 6 columns.
- **Colours**: pack sets seven base colours; everything else is derived by `color-mix()` in `styles.css`. `:root` holds jul-2025's values as defaults (so the prerendered shell and the unknown-pack page are coloured). Components use only token utilities, never raw hex, never `green-*`/`red-*`/`amber-*`/`gray-*`.
- **Team colours**: Hold 1 = cranberry red, Hold 2 = gold; team ink: `team-1-ink` = paper, `team-2-ink` = ink (derived, not pack fields).
- **Fonts**: `font-display` = Mountains of Christmas (400/700), `font-body` = Nunito 400–900. DM Sans is dropped.
- **Motion**: ambient only here: `animate-twinkle`, `animate-glow` keyframes in `styles.css`.
- **End screen** is `EndScreen.tsx`; `index.tsx` renders it in place of header and grid once finished. pack-theme is absorbed here.
- **Pinned contracts** (exact; siblings code against them):

`src/types.ts`, `Quiz` gains required:
```ts
colors: { background: string; paper: string; ink: string; accent: string; highlight: string; team1: string; team2: string };
```
jul-2025 values: background `#0e2c22`, paper `#f6ecd9`, ink `#12372a`, accent `#d2393f`, highlight `#f2c14e`, team1 `#d2393f`, team2 `#f2c14e`.

Colour tokens in `styles.css` (usable as `bg-*`, `text-*`, `border-*`, …): `night` (background darker; letterbox), `felt` (background), `felt-deep` (background darker), `paper`, `paper-lit` (lighter), `paper-edge` (darker), `ink`, `ink-soft` (ink toward paper), `snow` (paper toward white), `mist` (snow toward felt), `accent`, `accent-deep`, `highlight`, `highlight-deep`, `team-1`, `team-1-deep`, `team-1-ink`, `team-2`, `team-2-deep`, `team-2-ink`. Also `--font-display`, `--font-body`, `animate-twinkle`, `animate-glow`.

`Stage.tsx`: `"use client"`; `export const Stage: FC<{ colors: Quiz["colors"]; children: ReactNode }>`.

`decor.tsx` exports (named):
```ts
Paper: FC<{ stitch?: "accent" | "team-1" | "team-2" | "highlight"; className?: string; children: ReactNode }>
KeyCap: FC<{ tone?: "on-light" | "on-dark"; children: ReactNode }>
PillButton: FC<ComponentProps<"button"> & { variant: "team-1" | "team-2" | "neutral" | "dark"; keyHint?: string }>
TeamPlaque: FC<{ team: 1 | 2; name: string; points: number; doors: number; consolation: number;
  size: "board" | "end"; onClick: () => void; children?: ReactNode }>
```
`TeamPlaque.children` is an overlay slot (end screen's crown).

`EndScreen.tsx`:
```ts
EndScreen: FC<{ teamNames: [string, string]; points: [number, number]; doors: [number, number];
  consolation: [number, number]; onConsolation: (team: 1 | 2) => void }>
```

## Architecture facts (verified on the base branch)

- `src/types.ts:21` `Quiz` has `title, teamNames, doorWord, shuffle, pointsPerQuestion, music`. `src/quizzes/jul-2025/quiz.ts` is a 15-line object literal; `LoadedQuiz = Quiz & { name; questions }` in `src/quizzes/index.ts` spreads the quiz, so `quiz.colors` reaches `index.tsx` without touching `quizzes/index.ts`.
- `src/styles.css` is two lines: `@import "tailwindcss"; @import "material-symbols";`. Tailwind 4.1.18, CSS-first (no `tailwind.config`).
- `_layout.tsx` (server component) wraps children in `<div className="font-['Nunito']">` and has two Google Fonts `<link>`s: one with DM Sans + Mountains of Christmas, one Nunito 400/700 with `precedence="font"`.
- `index.tsx` (352 lines, `"use client"`): `QuizBoard` returns a fragment: `{started && <Snowfall />}`, `{isFinished && <Fireworks autostart className="absolute inset-0" />}`, a `div.p-6.bg-green-950.h-screen` > `div.aspect-video.bg-green-700` containing `<header>` (title button + the `<dl>` with the two score buttons, which move/scale via `isFinished` classes) and `<main>` (grid, `opacity-25` when finished), then `QuestionScreen` and `SettingsMenu`. `HomePage` renders `<div className="bg-green-950 h-screen" />` while `packName === null`, and a `bg-white text-black` list page for an unknown pack.
- Team points: `teamNCards.length * quiz.pointsPerQuestion + teamNConsolationPoints`; score click: `ding(); setTeamNConsolationPoints(c => c + 5)`. `AnimatedNumber` (`src/components/AnimatedNumber.tsx`) is `{ value }`.
- `react-snowfall` canvas style is `position: absolute; width/height: 100%` (its `config.ts`), so it fills the nearest positioned ancestor; `Fireworks` is `absolute inset-0` and observes its container with a `ResizeObserver`. Both therefore need the stage root to be positioned; a transform makes it one.
- `QuestionScreen` root is `fixed … inset-0 z-40` with `p-20`; `SettingsMenu` is `fixed inset-0 z-50`. Both stay inside a transformed Stage with no change.
- Mockup sources: `.claude/initiatives/redesign-mockup/Main.dc.html` (board, plaques, door, felt background, fairy lights), `Door.dc.html` (pill buttons, key caps), `Finale.dc.html` (end plaques). Drawn at 1600×900: multiply px by 1.2.

## Implementation steps

1. **`src/types.ts`**: add the required `colors` object to `Quiz` exactly as pinned. Add one Danish `//` comment per field only if the hex example helps; none needed otherwise.
2. **`src/quizzes/jul-2025/quiz.ts`**: add `colors` with the jul-2025 values above.
3. **`src/styles.css`**:
   - `:root { --quiz-background: #0e2c22; … }` for the seven `--quiz-*` (`background paper ink accent highlight team1 team2`).
   - `@theme inline { … }` (must be **inline**, see Traps) defining every colour token in the table as `--color-<name>: color-mix(in oklab, var(--quiz-…) N%, black|white|…)`. Starting points: `night` = background 60% + black; `felt` = background; `felt-deep` = background 70% + black; `paper-lit` = paper 70% + white; `paper-edge` = paper 80% + black (tune warmer if grey); `ink-soft` = ink 70% + paper; `snow` = paper 70% + white; `mist` = snow 55% + background; `accent-deep`, `highlight-deep`, `team-N-deep` = base 72% + black; `team-1-ink` = paper; `team-2-ink` = ink; `team-1`/`team-2` = `--quiz-team1`/`--quiz-team2`. Tune percentages by eye against the mockup swatches (night `#081a14`, snow `#fbf3e2`, mist `#8fa596`, accent-deep `#8f1d24`, paper-edge `#cbb48c`) and make them track when `--quiz-*` change.
   - `--font-display: "Mountains of Christmas", serif; --font-body: "Nunito", sans-serif;`.
   - Shadow tokens built from `--quiz-*` directly (not from other theme vars): `--shadow-paper-edge` (`0 7px 0` paper-edge colour + `0 14px 26px rgb(0 0 0 / .4)`), and `--shadow-pill-team-1`, `--shadow-pill-team-2`, `--shadow-pill-dark` (`0 7px 0` in the matching deep colour; mockup: `#8f1d24`, `#b8871c`, `#071a13`).
   - `--animate-twinkle` (opacity 1 → .55 → 1 and a slight brightness dip, ~2.4s ease-in-out infinite) and `--animate-glow` (box-shadow ring + glow of `--quiz-highlight` pulsing, ~2s ease-in-out infinite alternate), each with its `@keyframes` inside `@theme`.
4. **`src/pages/_layout.tsx`**: replace both font links with one stylesheet link, `family=Mountains+of+Christmas:wght@400;700&family=Nunito:wght@400..900&display=swap`, keeping the two `preconnect` links and the `precedence="font"` attribute. Change the wrapper class to `font-body`. No DM Sans anywhere.
5. **`src/components/Stage.tsx`** (`"use client"`): outer `div` `fixed inset-0 overflow-hidden bg-night`, with the seven `--quiz-*` set as inline style from `colors` (outer, so `night` follows the pack too). Inner `div` is 1920×1080 (`w-[1920px] h-[1080px]`), absolutely centred (`left-1/2 top-1/2`, `transform-origin: center`, `translate(-50%,-50%) scale(s)`), `overflow-hidden`, `bg-felt font-body text-snow`, with the felt texture from `Main.dc.html` line 22 (radial glow + two 45°/-45° repeating-linear-gradients) as inline `backgroundImage` using `color-mix`/`rgb()` only. `s = Math.min(innerWidth/1920, innerHeight/1080)`, held in `useState(1)`, set in a `useEffect` that also adds/removes a `resize` listener. Children render inside the inner div.
6. **`src/components/decor.tsx`** (`"use client"` not required; pure presentational): implement the four primitives, scaling mockup px ×1.2, full class strings only (lookup objects keyed by variant, never template-built class names), using tokens only:
   - `Paper`: `relative bg-paper shadow-paper-edge`, a `rounded-[19px]`-style radius, an `aria-hidden` child `absolute inset-[10px]` with a 2px dashed border in the stitch colour (default `accent` at ~55% alpha; `team-1` = `team-1-deep`; `team-2` = `team-2-deep`; `highlight` = `highlight-deep`), then children. `className` is appended.
   - `KeyCap`: `inline-block rounded-[10px] border-2 px-3 py-1 text-[18px] font-extrabold`; `on-light` (default) = `border-ink-soft/40 text-ink-soft`, `on-dark` = `border-current/40` inheriting the button's text colour (use a token alpha such as `border-snow/45`).
   - `PillButton`: spread the rest of the button props, `cursor-pointer flex items-center justify-center gap-4 rounded-full px-9 py-5 text-[34px] font-black min-w-[276px]`; variants: `team-1` = `bg-team-1 text-team-1-ink shadow-pill-team-1`; `team-2` = `bg-team-2 text-team-2-ink shadow-pill-team-2`; `dark` = `bg-ink text-snow shadow-pill-dark`; `neutral` = `bg-ink/10 text-ink-soft text-[26px]` without shadow. `keyHint` renders a `KeyCap` (tone `on-dark` for team-1/dark, `on-light` otherwise) after the children (mockup puts the cap before the label for Hold 1 and after it for Hold 2; place it after children for all, wave 2 may reorder with its own markup).
   - `TeamPlaque`: a `<button type="button">` hung on two strings (`aria-hidden` 2px × 77px lines at `left-12`/`right-12`, `-top-[72px]`, `bg-paper-edge`), rotated -2° (team 1) / +2° (team 2), wrapping a `Paper` (stitch = the team). Layout from `Main.dc.html` lines 36–48 for `size="board"` (width 360, badge circle 70px with `font-display` team digit on `bg-team-N text-team-N-ink`, name uppercase 26px tracking-[0.08em] font-black in `text-team-N-deep`, points `font-display` 70px with `<AnimatedNumber>` and a small "point", meta line "`{doors}` låger · +`{consolation}` trøst" in `text-ink-soft`), team 2 mirrored (`flex-row-reverse text-right`). `size="end"` follows `Finale.dc.html` lines 40–50 (width 440, name 36px, points 158px, "point · N låger", larger radius/stitch). `children` rendered as an overlay inside the plaque's relative wrapper. Set an `aria-label` like the mockup's ("Hold 1: 640 point. Klik giver 5 trøstepoint"); `onClick` is passed straight to the button. The primitive shows `name` as given; never hardcode "Hold 1".
7. **`src/components/EndScreen.tsx`** (`"use client"`): `<Fireworks autostart className="absolute inset-0" />` plus the two scores, reproducing today's finished look as closely as the seam allows: centred in the stage, each team's name (uppercase, extrabold) and `AnimatedNumber` + "point", as `<button>`s calling `onConsolation(1|2)`, `text-snow` with a strong text shadow. Do **not** use `TeamPlaque` here; wave-2 `end-screen` replaces this file's body. `doors` and `consolation` are in the props type but not yet rendered.
8. **`src/pages/index.tsx`**:
   - Import `Stage`, `EndScreen`; remove the `Fireworks` import.
   - Wrap the fragment's contents of `QuizBoard` (snow, board, `QuestionScreen`, `SettingsMenu`) in `<Stage colors={quiz.colors}>`.
   - Board wrapper: replace `p-6 bg-green-950 h-screen overflow-hidden flex items-center justify-center` / `aspect-video bg-green-700 w-full rounded-lg p-6` with `h-full` equivalents (`p-6 bg-night h-full overflow-hidden flex items-center justify-center` and `aspect-video bg-felt w-full rounded-lg p-6`; keep 16:9 so the stage fills). One-for-one class swaps only: `bg-green-950`→`bg-night`, `bg-green-700`→`bg-felt`, `bg-green-800/60`→`bg-felt-deep/60`, `hover:bg-green-800`→`hover:bg-felt-deep`, `text-white`→`text-snow`. Keep title font as `font-display` instead of `font-['Mountains_of_Christmas',Serif]`.
   - When `isFinished`, render `<EndScreen … />` instead of the `<header>` and `<main>`; remove the `isFinished` branches of the `<dl>` classes and the `main` `opacity-25`. Pass `points=[team1Cards.length*quiz.pointsPerQuestion+team1ConsolationPoints, …]`, `doors=[team1Cards.length, team2Cards.length]`, `consolation=[…]`, and `onConsolation` = the existing `ding(); setTeamNConsolationPoints(c => c + 5)` logic, written once.
   - `HomePage`: placeholder `bg-green-950 h-screen` → `bg-night h-screen` (outside the stage; `vh` is fine here); unknown-pack page `bg-white text-black` → `bg-paper text-ink`, `text-blue-700` → `text-accent`.
   - Do not touch `gridColumns`, `tickGroup`, `isLoaded`, key handling, `useSound`, the effects, or the `QuestionCard`/`QuestionScreen` props.
9. **`CLAUDE.md`** (Danish, keep the existing style): update Stack (fonts, tokens), Arkitektur and a short new "Tema og scene" paragraph: `Stage` (1920×1080, skaleret, `fixed` er relativt til scenen, ingen `vw`/`vh`), `Quiz.colors` and the `--quiz-*`/token mechanism (`@theme inline`, brug kun token-klasser), `decor.tsx` primitives, `EndScreen`, the stale "tom grøn baggrund" wording, and that pack-theme is absorbed (no `snow`/`titleFont`).
10. Run `npm run check`; then verify as below.

## Traps

- **Do not use plain `@theme` for the derived colours.** Plain `@theme` emits `--color-felt: color-mix(… var(--quiz-background) …)` on `:root`, where it resolves once against the `:root` defaults; the `--quiz-*` overrides set on the Stage element never reach it and `colors.background` silently changes nothing. `@theme inline` keeps the `var(--quiz-*)` expression in each utility so it resolves on the element that uses it. Prove it: change `background` in `quiz.ts` and see the board recolour in `npm run dev`.
- **Do not build shadow/ring tokens from `var(--color-*)`.** With `@theme inline` those variables are not guaranteed to exist at runtime; write the `color-mix` on `var(--quiz-*)` directly in each shadow token.
- **Do not build class names dynamically** (`` `bg-${variant}` ``, `` `stitch-${x}` ``). Tailwind 4 scans source text and drops unknown classes silently. Use lookup objects with full class strings.
- **Do not read `window` during render in `Stage`.** The page is prerendered; the first client render must equal the server HTML. Start at scale 1 and set the real scale in an effect (`index.tsx` already follows this with `isLoaded`).
- **Do not use `vw`/`vh`/`h-screen` inside the stage** (only the pre-pack placeholder outside it keeps `h-screen`). Do not use `position: fixed` expecting the viewport: inside the transformed Stage it is stage-relative, which is the intent.
- **Do not wrap `Snowfall`/`Fireworks` outside `Stage`.** They size to their positioned ancestor; outside, they cover the letterbox and ignore the scale.
- **Do not hardcode "Hold 1"/"Hold 2" or `24`/`6` in `decor.tsx`, `EndScreen.tsx` or the board.** Names come from `quiz.teamNames`, counts from the questions.
- **Do not set optional props to `undefined`** (`exactOptionalPropertyTypes`): omit them (`stitch`, `tone`, `keyHint`, `className`, `children`).
- **Do not edit `src/pages.gen.ts`**, `QuestionCard.tsx`, `QuestionScreen.tsx`, `SettingsMenu.tsx`, `src/questionTypes/*` or any other non-Owns file, even to remove `green-*`/`vh` there. A missing token is a note for the PR body, not a new file.
- **Do not copy the mockup's raw hex into components.** Mockup colours are the target for the token percentages in `styles.css` only.
- **Do not remove the `isLoaded` save gate** or its comment in `index.tsx`, and do not alter the `key={packName}` remount.
- Comments must ADD value: only non-obvious why. Warranted spots: `@theme inline` (one Danish line in `styles.css` saying why inline is required) and the scale-1 start in `Stage.tsx`. Everything else needs none.

## Verification

No tests (visible-on-read logic; the repo has no test framework and none is added). Run `npm run check` (must pass). Then, with `npm run dev` and the pre-installed Chromium via a Playwright script kept **outside the repo** (e.g. in the scratchpad):

1. Screenshots at 1920×1080 and 1366×768 of the board: same composition, scaled; at an odd window (e.g. 1200×900) the stage is letterboxed in `night`.
2. Open a door (click), press `m` for settings: both stay inside the stage. Keyboard controls behave as before.
3. In `quiz.ts` change `colors.background` to another colour: board and letterbox recolour in dev. Revert it.
4. Reach the end screen (seed `localStorage` per `src/quizState.ts`, key `julequiz-state-v2:jul-2025`, or play through): fireworks and scores show inside the stage; clicking a score adds 5 and plays the ding.
5. `?quiz=nonexistent` shows the coloured list page; the first prerendered paint is `night`, not white.
6. `decor.tsx` is unused: for isolation, temporarily render each primitive on the board to compare against the mockup (`Paper`, `KeyCap`, `PillButton` all variants, `TeamPlaque` both sizes and teams) and **remove the temporary code** before finishing. `grep -rn "green-\|red-" src/pages src/components/Stage.tsx src/components/decor.tsx src/components/EndScreen.tsx` must be empty.

## Autonomous decisions

- Stage scale is a `resize` listener plus `useState(1)` set in an effect → rejected a CSS-only `min(100vw/1920, 100vh/1080)` scale (unitless division is not reliably supported) and a ResizeObserver (more code for no gain).
- Derived-colour percentages are given as starting values to tune by eye against the mockup → rejected pinning exact numbers, since the plan leaves them to `foundation` and the mockup is the judge.
- Shadow tokens (`shadow-paper-edge`, `shadow-pill-*`) are added to `styles.css` alongside the pinned colour tokens → rejected arbitrary `shadow-[…]` values in `decor.tsx` (cannot reference pack colours reliably) and per-component inline styles.
- `EndScreen` renders only fireworks plus the big scores, so the title and the dimmed grid no longer show at the end → rejected keeping them via an extra `title`/children prop on `EndScreen` (the pinned contract has none) and rejected rendering `EndScreen` beside header and grid (the plan says "in place of").
- `EndScreen` does not use `TeamPlaque` and ignores `doors`/`consolation` for now → rejected pre-building the winner/plaque layout, which is wave-2 `end-screen`'s job.
- The title button (start/stop music) is not reachable on the end screen → rejected extra UI for it; the finale music already plays.
- `PillButton` puts the `KeyCap` after the children for every variant → rejected per-variant ordering, which wave 2 can do in its own markup.
- Unknown-pack page restyled minimally with `bg-paper text-ink text-accent` and no `Stage` → rejected wrapping it in `Stage` (no pack, so no `colors`; `:root` defaults colour it).
- `Stage` sets `--quiz-*` on its outer letterbox element → rejected setting them on the inner box only (then `night` would ignore the pack).
- No temporary-primitive test code is committed → rejected a committed gallery/test page (not in Owns, no test framework).
