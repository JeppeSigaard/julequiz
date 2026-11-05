# Redesign: lågegitteret (board)

> Status: in progress — redesign-board

Task `board` of the initiative `.claude/initiatives/redesign.md` (wave 2). Branch `redesign-board`, branched from and PR-targeting `claude/sweet-mendel-p0gtn1` (never `main`).

## Goal

Make the board look like the mockup `.claude/initiatives/redesign-mockup/Main.dc.html` (drawn at 1600×900; **multiply every px by 1.2** for the 1920×1080 stage): pine background with fairy-light garland, the title button with a swash, two `TeamPlaque`s on strings, an inset board panel, and doors in all states: closed paper, glowing, won with a team rosette, nobody, skip. A door that has just been won swings open with `motion`. Also a footer with progress and an `M` hint, snow colour, and a restyled unknown-pack page. Door number size follows door size, so any door count works.

## Out of scope

- The open door (`QuestionScreen.tsx`), the end screen (`EndScreen.tsx`), the settings overlay (`SettingsMenu.tsx`, `ResetQuizSetting.tsx`), `src/questionTypes/`, mini-games, `src/styles.css`, `src/components/decor.tsx`, `Stage.tsx`, `CLAUDE.md`. Sibling tasks own them and run in parallel. A missing token or primitive is built locally in an owned file and named in the PR body.
- Question content, keyboard handling (`m`, `Escape`), scoring, consolation (+5 per plaque click), `src/quizState.ts` format, `QuestionScreen` props.
- Per-pack snow/title-font/decoration switches (decorations are always Christmas; snow falls only while started, as today), any lightning round, new dependencies, tests, CI steps, committed screenshot scripts, fonts other than Mountains of Christmas and Nunito, sound changes.

## Owns (hard boundary)

`src/pages/index.tsx`, `src/components/QuestionCard.tsx`, `src/components/board/` (new). Nothing else may be edited.

## Settled decisions (from the master plan; never re-open)

- Everything renders inside `Stage` (1920×1080, `transform: scale`). Lay out in px against 1920×1080; **no `vw`/`vh`** (except the pre-pack placeholder `h-screen`, which is outside the stage). `position: fixed` inside the stage is stage-relative.
- Door count is dynamic: `gridColumns`/`tickGroup` stay; nothing may assume 24 doors or 6 columns. Door type size follows door size.
- Colours only through token utilities (`bg-paper`, `text-ink`, `shadow-paper-edge`, `bg-felt-deep`, `text-snow`, `text-mist`, `accent`, `highlight`, `team-1/-2(-deep/-ink)`, `night`, `paper-lit`, `paper-edge`, `ink-soft` …). **No raw hex; no Tailwind `green-*`/`red-*`/`amber-*`/`gray-*`.** Where a CSS expression needs a colour, use `var(--quiz-*)` (e.g. `var(--quiz-accent)`), never `var(--color-*)` (not guaranteed to exist with `@theme inline`).
- Fonts: `font-display` (title, door numbers, scores) and `font-body` (rest). Hold 1 = red, Hold 2 = gold; `team-1-ink`/`team-2-ink` for text on team fills.
- Motion: ambient plus door opening only. Fairy lights use `animate-twinkle`; a waiting door's blink (existing `tick`/`contrast`) becomes `animate-glow`; a won door swings open with `motion`. No swinging plaques, bouncing title or looping content animation.
- Hints are discreet: footer "x af N låger åbnet" and an `M` hint. Icons: inline SVG with `aria-hidden`; no emoji in the chrome.
- `index.tsx` renders `EndScreen` in place of header and grid once finished (already so). `src/pages/_layout.tsx` is a server component; `index.tsx` is prerendered, so no `window` during render.
- `exactOptionalPropertyTypes`: omit optional props, never pass `undefined`. UI text and comments in Danish, identifiers in English.
- Pinned contracts to use (already on the base branch, read the code): `Stage`, and from `src/components/decor.tsx` `KeyCap({tone?, children})` and `TeamPlaque({team, name, points, doors, consolation, size, onClick, children?})`. `Paper` also exists (`stitch`, `stitchSize`, `className`).

## Architecture facts (verified on the base branch)

- `src/pages/index.tsx` already wraps everything in `<Stage colors={quiz.colors}>` (line ~208) but still has the old layout inside: `p-6 bg-night … aspect-video bg-felt` wrappers (210-211), an inline header with plain-button scores using `AnimatedNumber` (222-261), the grid with inline `gridTemplateColumns` (262-283), and `QuestionCard` receiving `{...question, id: String(index+1)}`. `Stage` itself already supplies `bg-felt` and the knit texture, so the board must not repeat a background.
- `QuestionCard.tsx` (current props `number, question, onClick, active, contrast?`) uses `green-*`/`red-*` classes and plays `levelup.mp3` via `useSound`; it never reads `question`.
- Derived state in `QuizBoard`: `team1Cards`, `team2Cards`, `noTeamCards` (grid indices), `allAnswered`, `columns = gridColumns(questions.length)`, `isFinished`, `team1Points`/`team2Points`, `handleConsolation(team)`, `tick`, `started`, `quiz.teamNames`, `quiz.doorWord`, `quiz.title`. Consolation points are `team1ConsolationPoints`/`team2ConsolationPoints`.
- `TeamPlaque` (decor.tsx) draws its own two strings (`-top-[72px]`, 77px tall), tilt (-2°/+2°), width 360px at `size="board"`, and shows `"{doors} låger · +{consolation} trøst"`. It is a `<button>` whose `onClick` is yours.
- `motion` is a dependency; existing import style: `import * as motion from "motion/react-client"` (`QuestionScreen.tsx:5`).
- `react-snowfall` `Snowfall` accepts `color`, `radius`, `opacity`, `snowflakeCount`, `speed` (checked in `node_modules/react-snowfall/lib/Snowfall.d.ts`).
- `Finale.dc.html` has no garland, so the garland, title and panel live only in the not-finished branch.
- Mockup numbers (×1.2 for stage): content padding `70/48/22` → `pt-[84px] px-[58px] pb-[26px]`; gap 18 → 22; header height 178 → 214; panel radius 26 → 31, padding 22 → 26, grid gap 18 → 22; title 104 → 125px; eyebrow 15 → 18px, letter-spacing .32em, `text-highlight`; swash svg 420×26 → 504×31; door radius 16 → 19, stitch inset 8 → 10; footer text 15 → 18px; progress bar 220×8 → 264×10.

## Implementation steps

Work in `src/components/board/` for new pieces; each is a small `"use client"`-free component (plain `FC`, the parent is already client) with full static class strings.

1. **`board/Garland.tsx`** — `aria-hidden` absolute top-0 full-width. An inline SVG 1920×108 with the wavy wire path (port the `wireY(x) = 22 + 18·sin(x/1600·4π)` generator, scaled ×1.2 and expressed over 1920 width, as a pure function at module level; stroke `stroke-mist/30`, width 3.6) and bulbs every ~78px (`Math.floor(1920/78)` count, derived from width, not doors). Each bulb: small cap + rounded body, `animate-twinkle` with an `animationDelay` inline style of `(k % 4) * 0.6s`, colour cycling through four token colours via a lookup object of full classes (`text-accent`, `text-highlight`, `text-snow`, `text-mist`) with `bg-current` body and glow `shadow-[0_0_17px_5px_currentColor]`.
2. **`board/BoardHeader.tsx`** — props `{ title, doorCount, teamNames, points, doors, consolation, onConsolation, onTitleClick }`. Flex row `h-[214px] items-start justify-between`: `TeamPlaque team={1} size="board"` (wrap with `mt-[10px]`), centre column (eyebrow `"{doorCount} låger · 2 hold · 1 vinder"`, `<h1>` containing the title `<button>` with `font-display text-[125px] leading-none text-snow` and a two-part `[text-shadow:…]` (dark drop `0 6px 0` of `color-mix(in oklab, var(--quiz-background) 55%, black)` plus a faint `var(--quiz-highlight)` glow), then the swash SVG with `stroke-highlight`/`fill-highlight` and the star path from the mockup), `TeamPlaque team={2}`. Pass `children` none. `doorCount` = number of non-`skip` questions.
3. **`board/Footer.tsx`** — props `{ opened, total }`. Left: `"{opened} af {total} låger åbnet"` in `text-mist font-bold text-[18px]`, then a 264×10 rounded track `bg-snow/10` with a fill `style={{ width: `${total === 0 ? 0 : (opened / total) * 100}%` }}` and `bg-[repeating-linear-gradient(90deg,var(--quiz-accent)_0_12px,var(--quiz-paper)_12px_24px)]`. Right: `<KeyCap tone="on-dark">M</KeyCap>` then `indstillinger`.
4. **`QuestionCard.tsx`** — rewrite. New props (drop `question`): `number: number; doorWord: string; status: "closed" | "skip" | "nobody" | "team-1" | "team-2"; teamName?: string; glow?: boolean; onClick: () => void`. Keep the `levelup` sound and `handleClick`. Wrapper: `relative` div filling the grid cell with inline `transform: rotate(${(((number - 1) * 37) % 7 - 3) * 0.45}deg)` (degrees, as in the mockup: `0.45` per step, not scaled). The wrapper is the size container: add `[container-type:size]` and size every glyph in `cqmin` units so type scales with the door (see Traps). Rendering by `status`:
   - `closed`: `<button aria-label="{doorWord} {number}">` absolute inset-0, `bg-paper shadow-paper-edge rounded-[19px]`, dashed stitch `border-accent/40` inset 10px, brass knob (small circle `bg-highlight-deep`) right at 50%, centred number `font-display font-bold text-accent text-[59cqmin]` with a light text-shadow, a tiny doodle top-left (inline SVG, `aria-hidden`, four variants chosen by `number % 4`: star (the mockup's swash star path), snowflake (three crossing lines), asterisk, dot cluster; stroke/fill from `accent`, `highlight-deep`, `ink-soft`). `hover:` lighten (`hover:bg-paper-lit`) and `cursor-pointer`.
   - `glow` (only meaningful with `closed`): `bg-paper-lit animate-glow` instead of `shadow-paper-edge`; keep `transition-colors duration-500`.
   - `team-1` / `team-2` / `nobody`: non-interactive `<div aria-label="{doorWord} {number}: {teamName ?? "Ingen"}">` (no `onClick`, no button). Dark cavity `bg-night` with `shadow-[inset_0_6px_16px_rgb(0_0_0/0.7)]` and a faint `ring-1 ring-paper/10`; a `motion.div` flap (left 40%, `bg-paper-edge`, `origin-left`, rounded `rounded-l-[19px]`) animating `rotateY` from 0 to -62 with `transformPerspective: 500` (`initial`/`animate` props, a spring or 0.7s ease-out), shadow on its right edge; a rosette circle (size `~22cqmin`, `font-display` mark `1`/`2`/`–`) coloured `bg-team-1 text-team-1-ink` / `bg-team-2 text-team-2-ink` / `bg-felt text-mist`, with a soft glow ring; beside it a two-line label: `"{doorWord} {number}"` small uppercase `text-mist` and the `teamName` (or `Ingen`) bold `text-snow`/`text-mist`. Use lookup objects for the status classes.
   - `skip`: non-interactive, no doodle, `rounded-[19px] border-2 border-dashed border-mist/25 bg-night/30`, number in `text-mist/40`.
5. **`index.tsx`** — replace the layout inside `<Stage>`:
   - Remove the `p-6 bg-night … aspect-video bg-felt` wrappers. Keep `{started && <Snowfall … />}` first inside the stage, with `color="white"`, `radius={[1, 2.5]}`, `opacity={[0.15, 0.5]}`, `snowflakeCount={60}` (small faint flakes like the mockup).
   - If `isFinished`: render `EndScreen` exactly as now, no garland/panel. Else: `<Garland />` and a content column `absolute inset-0 flex flex-col gap-[22px] px-[58px] pt-[84px] pb-[26px]` containing `BoardHeader`, a `<main>` panel and `Footer`.
   - Panel: `relative flex-1 rounded-[31px] bg-night/50 p-[26px] shadow-[inset_0_2px_22px_rgb(0_0_0/0.45)]`, an `aria-hidden` absolute inset-[10px] dashed `border-highlight/20 rounded-[24px]` ring, and the grid `relative h-full grid gap-[22px]` with inline `gridTemplateColumns: repeat(columns, minmax(0, 1fr))` and `gridTemplateRows: repeat(Math.ceil(questions.length / columns), minmax(0, 1fr))`. Tune `bg-night/50` by eye against the mockup.
   - Per door compute `status`: `team1Cards.includes(i)` → `"team-1"`, `team2Cards` → `"team-2"`, `noTeamCards` → `"nobody"`, else `question.skip ? "skip" : "closed"`. `teamName` from `quiz.teamNames` for team statuses (omit otherwise). `glow` = the existing `tickGroup(index, columns) === (tick ? 1 : 0) && started && activeQuestionIndex === null && !question.skip`. Keep `key={question.id}` but stop passing `{...question, id: …}` (the card no longer takes `question`). `onClick={pickQuestion(index, question)}` only matters for `closed`.
   - Opened count for the footer: `allAnswered.length`; total: `questions.filter((q) => !q.skip).length`.
   - Plaque `doors` are `team1Cards.length`/`team2Cards.length`; `consolation` the two consolation states; `onClick` → `handleConsolation(team)`.
   - Unknown-pack page: `min-h-screen bg-night text-snow font-body p-10`, `<h1>` `font-display text-highlight text-6xl mb-4`, list links `text-highlight underline`. Keep the list and URLs unchanged. The `packName === null` placeholder stays (`bg-night h-screen`).
6. Run `npm run check`; then verify as below. Delete any temporary code.

## Traps

- **Do not use `vw`/`vh` or fixed `text-6xl` for the door number.** The door shape depends on the door count (24 doors: ~273×143px on the stage; 9 doors: much larger). Use container-query units: `[container-type:size]` on the door wrapper and `text-[59cqmin]`. `container-type: size` needs a definite size, so the wrapper must fill the grid cell (`relative h-full w-full`) and the grid must have explicit `gridTemplateRows` of `minmax(0, 1fr)`, otherwise cells collapse to 0 height. Check the number in a 9-door layout.
- **Do not build classes dynamically** (`` `bg-${status}` ``, `grid-cols-${n}`, `grid-rows-${n}`). Tailwind 4 scans source text and drops unknown classes silently. Use lookup objects with full strings and inline `gridTemplateColumns`/`gridTemplateRows`.
- **Do not hardcode 24 or 6** anywhere (header eyebrow, footer, progress, grid). Counts come from `questions`; skip doors are excluded from the "total" because they can never be opened.
- **Do not lay out the last-row remainder specially.** With 9 doors (`columns = 4`) the last row has one door, left-aligned by the grid; that is accepted and "clean" means no overflow or overlap.
- **Do not copy the mockup's hex values or the mockup's `#c99a2e`/`#4f8a6e` doodle colours** into classes; use tokens (a mockup colour is a target for token choice, not a literal).
- **Do not use `animate-glow` and `shadow-paper-edge` together expecting both.** The keyframes overwrite `box-shadow` while running, so the glowing door loses its bottom edge; accepted (the mockup glow also replaces the drop shadow). Do not change `styles.css` to fix it.
- **Do not make won/nobody/skip doors buttons.** They were `disabled` buttons before; a div avoids focusable dead controls. Only `closed` is a `<button>`, and `onClick` fires `play()` (the `levelup` sound) before the parent's handler, as today.
- **Do not wrap `Snowfall` outside `Stage`**: it would cover the letterbox. Keep it inside, before the board, so doors paint above flakes.
- **Do not remove the `isLoaded` save gate, the `key={packName}` remount, or the keydown effect** in `index.tsx`; do not touch `QuestionScreen` props. Do not `asset()` the imported `levelup`/`ding` modules.
- **Do not animate with `AnimatePresence` or extra state to detect "just won".** A won door mounts the swing on first render of the won state; this also plays on page load for restored doors (accepted: the board is restored in an effect after mount).
- **Do not edit `src/pages.gen.ts`, `decor.tsx`, `styles.css`, `CLAUDE.md`.** CLAUDE.md's remark that `index.tsx` overwrites each door's `id` with its grid position becomes stale for the card; leave it and mention it in the PR body.
- Comments only for non-obvious why (Danish, one line): the `[container-type:size]` door wrapper (type scales with door size, needs a definite size) and the glow/shadow override if kept. Everything else needs none.

## Verification

No tests (visual task; repo has no test framework and none is added). Run `npm run check` (must pass). Then, with `npm run dev` and the pre-installed Chromium via a Playwright script kept **outside the repo**, at 1920×1080 (http://localhost:3000/julequiz/):

1. Fresh board (reset via `m` → "Nulstil quiz", or clear `localStorage` key `julequiz-state-v2:jul-2025`), click the title to start (snow, glow blinking): compare with the mockup's garland, plaques, panel, closed doors, footer "0 af 24 låger åbnet".
2. Half-played board: seed `localStorage` `julequiz-state-v2:jul-2025` with `{questionIds: [...ids "1".."24" in order], team1Cards:[…], team2Cards:[…], noTeamCards:[…], team1ConsolationPoints: 40, team2ConsolationPoints: 15}` (shape in `src/quizState.ts`; indices must be < 24), wait ~1s for the swing: won doors show rosettes, "Ingen" door shows the dash, plaque totals and the footer count match. Compare with the mockup (12 of 24).
3. A pack copied with 9 questions (local only, **not committed**): lays out cleanly, door numbers scale up, no overflow. Remove it afterwards (`git status` shows only Owns files).
4. Click a plaque: +5 and the ding; click a closed door: the door opens as before; Escape/answer returns to a board where that door has swung open. `m` settings and the end screen (all doors answered) still work. `?quiz=nonexistent` shows the restyled list.
5. `grep -rnE "green-|red-|amber-|gray-|[0-9]vh|[0-9]vw|#[0-9a-fA-F]{3,6}" src/pages/index.tsx src/components/QuestionCard.tsx src/components/board` is empty.

## Autonomous decisions

- Door number size uses container-query units (`cqmin` on a `container-type: size` wrapper) → rejected measuring the door with `ResizeObserver`/JS (more code) and a fixed size per door count.
- The card no longer takes `question`; status and team name are explicit props → rejected keeping the unused `question` prop and the `{...question, id}` override just for compatibility.
- Won/nobody/skip doors are non-interactive `div`s → rejected keeping disabled `<button>`s.
- Garland bulbs cycle `accent`/`highlight`/`snow`/`mist` tokens, coloured via `currentColor` → rejected the mockup's four raw hexes (red/yellow/green/blue), which the no-raw-hex rule forbids.
- Door doodles are four tiny inline SVGs, not the mockup's `✶ ❄ ✷ ❅` text glyphs → rejected glyphs (may render as emoji/missing in the display font).
- Skip door has no mockup state, so it gets a dashed, dimmed, non-glowing outline with a muted number → rejected reusing the nobody look (would read as "played").
- The swing plays whenever a won door mounts, including on reload → rejected tracking "just won" with extra state/refs.
- Snow colour is `color="white"` with small faint flakes via `radius`/`opacity` → rejected reading the `snow` token (a canvas cannot resolve CSS variables) and a `getComputedStyle` effect.
- Header eyebrow says "2 hold · 1 vinder" literally (the quiz always has two teams) with the door count from `questions` → rejected adding a team-count field.
- Won-door labels use `text-snow` (team name) rather than the mockup's lighter red/gold → rejected adding a lightened team token (needs `styles.css`).
- Garland and board panel are not shown on the end screen (Finale has none) → rejected keeping them behind the fireworks.
- Partial last row is left-aligned → rejected centring it.
- Unknown-pack page is restyled with `night`/`snow`/`highlight` tokens and no `Stage` → rejected wrapping it in `Stage` (no pack colours exist there).

## Genuinely undecidable from the plan

- The plan does not say whether the garland/title should remain on the end screen; resolved as above from `Finale.dc.html`.
