# Redesign: minigames

> Status: merged — 7f7a793
> Branch: `redesign-minigames` (base `claude/sweet-mendel-p0gtn1`, PR targets it, never `main`)

## Goal

Mini-games and the three custom doors fit the new cream paper card (content area ~1200px wide, text `text-ink`) instead of the old white-on-dark look. Felt banks, river and boat in tokens, word-puzzle letters as paper tiles, music buttons as `PillButton`s, custom doors 02, 07, 08 typed to `SlideView`'s scale. Presentation only.

## Out of scope

Game rules and behaviour; component props (unchanged); the renderers in `src/questionTypes/` (sibling `door-content`, unmerged, owns them, incl. the `className="text-7xl text-green-900"` it passes to `WordPuzzle`); `QuestionScreen`, `index.tsx`, `styles.css`, `decor.tsx`, `CLAUDE.md`; new deps, tests, CI; sound/music; fonts other than Mountains of Christmas (`font-display`) and Nunito (`font-body`).

## Owns (hard boundary; edit nothing else)

`src/components/FoxChickenGrain.tsx`, `src/components/WordPuzzle.tsx`, `src/components/GuessThatCat.tsx`, `src/components/MusicBox.tsx`, `src/quizzes/jul-2025/questions/02-fox-chicken-grain.tsx`, `07-gabby-kat.tsx`, `08-husnisse.tsx` (same dir).

## Settled constraints (from the master plan)

- Stage is a fixed 1920x1080 box, scaled by transform. Lay out in plain px / Tailwind sizes. No `vw`/`vh`. Nothing may assume 24 doors.
- Colours only via token utilities: `felt`, `felt-deep`, `paper`, `paper-lit`, `paper-edge`, `ink`, `ink-soft`, `snow`, `mist`, `accent(-deep)`, `highlight(-deep)`, `team-1/2(-deep|-ink)`. No raw hex, no `green-*`, `red-*`, `amber-*`, `gray-*`, `blue-*`, `black/white` palette classes (opacity of tokens like `bg-ink/10` is fine; `bg-black/80` overlay -> `bg-felt-deep/90`).
- Fonts: `font-display` for titles/answers, `font-body` otherwise. Material-symbols for UI icons; emoji inside door content stay.
- Shared primitives: `PillButton` (`src/components/decor.tsx:44`, props `variant: "team-1"|"team-2"|"neutral"|"dark"`, `keyHint?`; it is a `<button>` with `min-w-[276px]`, `px-9 py-5`, `text-[34px]`, `shadow-pill-*`) and `Paper`. Missing tokens or primitives are built locally and named in the PR body, never added to shared files.
- Motion: no new looping animations (existing `animate-bounce` in door 02's answer and `animate-pulse` on the music "playing" icon stay; shake in WordPuzzle stays).
- `exactOptionalPropertyTypes`: omit optional props, never pass `undefined`. Every `public/` URL through `asset()`; imported modules (`mmlemSFX`) never. UI text and comments Danish, identifiers English; commits Danish imperative.
- Mockup px x 1.2 for the stage. Card: `QuestionScreen.tsx:94` is 1656x912; `<main>` content area is `w-[1200px]` centred, `gap-[26px]` (line 148).

## Architecture facts (verified)

- `FoxChickenGrain.tsx` (253 lines): self-contained, no props. Board is `relative w-80 h-96` (320x384) with a top bank (`bg-green-600`, 30%), river (`bg-blue-500`), bottom bank. Boat is `absolute top-0|bottom-0` inside the river, sliding via `transition-all duration-700`. Item buttons `text-5xl`, boat `text-6xl`, cargo `text-4xl`. Game-over overlay `bg-black/80` with `text-red-500`. Message pill `bg-black/50 text-white text-sm`.
- Door 02 renders two games side by side in `flex gap-10` under an `h2 text-6xl mb-10 font-extrabold`; answer is three bouncing emoji at `text-8xl`.
- `WordPuzzle.tsx`: props `word`, `className?`, `onCorrectGuess?`, `onIncorrectGuess?`. `className` goes onto every letter cell (default `"text-6xl text-white"`) and the wrong-letter overlay (default `"text-6xl"`). Each cell: `<span>` letter (opacity toggled) plus an absolutely positioned `_` (`absolute top-3`) whose containing block is the outer `relative` row, not the cell. Row `flex gap-6 justify-center items-end`, spaces are `w-8`. Shake uses an inline `<style>` keyframes plus inline `animation`. Used only via `src/questionTypes/WordPuzzle.tsx` (door 06 renders through it).
- `GuessThatCat.tsx`: props `images`, `from`, `to`, `className?`. Before the delay it shows `<p className="text-3xl">borte, borte, borte...</p>`; after, an `<img className={className}>` plus an autoplaying `<audio>`. Door 07 passes `className="w-125 mx-auto"` (500px).
- `MusicBox.tsx`: props `track,song,artist,start,stop,answerStart`. Four states: idle (green Start pill), playing (grey "Afspiller..." div with pulsing `graphic_eq` icon), stopped (green "Spil lidt mere" + amber "Vis svar" side by side), revealed (`text-7xl font-bold` song, `text-4xl` artist). Door 13 reaches it through `src/questionTypes/Music.tsx` -> `MusicBox`.
- Door 08: `Answer` shows "Gerda" (`text-6xl`), after 2 s "Og hun er lige bag jer!" (`text-6xl font-extrabold`), after 4 s "jk" (`text-4xl`). Body `text-6xl`. The timeouts are never cleaned up; leave as is.
- Door 07 body is `text-6xl`; door 02 body has an `h2`.
- `SlideView` scale to match (door-content, not yet on the base branch): big text ~96px / 58px / 43px tiers, notes 41px, `text-ink`, answer words `font-display text-accent-deep`.

## Implementation steps

Read the mockup `.claude/initiatives/redesign-mockup/Door.dc.html` first for the paper/felt look; use the token mapping below, not its hex values.

1. **`FoxChickenGrain.tsx`** (do not touch state logic, handlers, `setTimeout`, messages):
   - Enlarge the board for the 1200px content area: two games side by side must fit (each ~`w-[520px] h-[560px]`; keep the 30% / 40% / 30% split). Replace `w-80 h-96` accordingly, `rounded-[24px]`, `overflow-hidden`, plus a `border-4 border-dashed border-paper/50`-style stitch is optional; keep it simple: `shadow-paper-edge`-like depth is not needed.
   - Banks: `bg-green-600` -> `bg-felt` with an inner top/bottom edge (`border-felt-deep`), river `bg-blue-500` -> `bg-mist/40` over `bg-felt-deep` (e.g. `bg-felt-deep` with a `bg-mist/20` wave stripe); pick what reads as water on a paper card. Items: `text-5xl` -> `text-[72px]`, hover `hover:bg-snow/20`; boat `text-6xl` -> `text-[88px]`, cargo `text-[56px]`.
   - Game-over overlay `bg-felt-deep/90`; message text `text-highlight font-display text-[43px]`, sub-text `text-snow font-body text-[26px]`. Message pill in the river: `bg-felt-deep/80 text-snow text-[26px] font-bold px-5 py-2 rounded-xl`.
   - The icon-name `title` attributes and `"Click to sail"` stay as they are (not visible UI).
2. **`WordPuzzle.tsx`**: replace the loose letter + `_` with paper tiles. Each non-space char becomes a tile `relative flex items-center justify-center rounded-[14px] size-[1.5em]` where `em` follows `className`'s font size (default now `"text-6xl"`; keep the prop and the `props.className ?? ...` pattern). Unrevealed tile: `bg-paper-lit shadow-[0_5px_0_color-mix(in_oklab,var(--quiz-paper)_80%,black)] ` with the letter `opacity-0`; revealed tile letter `opacity-100 text-ink font-display`-free: use `font-body font-black text-ink` set on the inner span so a colour in `className` (door-content passes `text-green-900` today, its own change will follow) cannot override it. Remove the absolute `_` and the `top-3` hack. Row: `gap-4 items-center` (spaces `w-8` stay). Wrong-letter overlay: `bg-accent text-paper` replacing `bg-red-700 text-white`. Keep the shake keyframes, key handling and the effect byte for byte.
   - The tiles must fit a 1200px row for the longest word in `src/quizzes/*/` packs: check door 06's word at the size door-content passes (`text-7xl` = 72px => 108px tiles + 16px gap). If the word would overflow 1200px, use `flex-wrap` on the row rather than shrinking text.
3. **`GuessThatCat.tsx`**: wait text -> `font-display text-[58px] text-ink-soft` (keep the string). Image: wrap in a paper polaroid: `<div className="rotate-2 bg-paper-lit p-4 pb-8 shadow-paper-edge rounded-[8px]">` around the `<img>`, with `className` still applied to the `<img>` (door 07's `w-125`). Keep `alt`, `<audio>`, the effect, the `visible && ` guard.
4. **`MusicBox.tsx`**: import `PillButton` from `./decor`. Idle: `<PillButton variant="team-1">` with the `play_arrow` icon + "Start" (icon `text-[44px]`). Playing: a non-interactive `div` styled like a neutral pill (`bg-ink/10 text-ink-soft text-[26px] font-black rounded-full px-9 py-5 flex items-center gap-4`), keep `animate-pulse` on the icon; do not use a `PillButton` (it would be a focusable dead button). Stopped: "Spil lidt mere" `variant="team-1"`, "Vis svar" `variant="team-2"` (red/gold are team colours but the only high-contrast pair; no `keyHint`, since the keys here do nothing). Revealed: song `font-display text-[96px] text-accent-deep leading-none`, artist `text-[43px] font-bold text-ink`. Do not touch the sound logic or effects.
5. **Door 02**: `h2` -> `font-display text-[58px] text-ink mb-8` (drop `font-extrabold`), games row `gap-[60px]`. Answer: `text-8xl` -> `text-[160px]` with the same three bounce classes unchanged.
6. **Door 07**: body `text-6xl` -> `font-body text-[58px] font-bold text-ink`. Answer `GuessThatCat` props unchanged except `className`: `w-125 mx-auto` -> `w-[500px] mx-auto` is the same size; keep `w-125` if it compiles (Tailwind 4 supports it), otherwise change nothing.
7. **Door 08**: body `text-[58px] font-bold text-ink`; "Gerda" `font-display text-[96px] text-accent-deep`; second line `text-[58px] font-black text-ink`; "jk" `text-[43px] text-ink-soft`. Leave the timers.
8. Run `npm run check`.

## Traps

- **Do not build Tailwind classes dynamically** (no `` `text-[${n}px]` ``); the scanner drops them silently. Use full literal strings or lookup objects.
- **Do not pass a `className` text colour trick through `WordPuzzle`.** `className` lands on the same element as the default `text-white`; whichever Tailwind emits last wins, not DOM order. Colour the letter on the inner span instead (step 2).
- **Do not make the playing state a `PillButton`**; it is a real `<button>` and would show a dead focusable control. Also do not add `keyHint`s: `MusicBox` has no key handlers and `QuestionScreen` owns the keys (1/2/q/x/Enter/Escape). Do not add key handlers here.
- **Do not use `bg-green-*`, `bg-blue-*`, `text-red-*`, `bg-black/*`, `text-white`** (all exist in the current files and are the very thing to replace). Grep the owned files for them before finishing: `grep -nE "(green|red|blue|amber|gray)-[0-9]|bg-black|text-white|bg-white" <owned files>` must be empty.
- **Do not use `vw`/`vh`/`h-screen`**, and do not size to 24 doors.
- **Do not edit `src/questionTypes/WordPuzzle.tsx` or `Music.tsx`** to adjust sizes or classes; those belong to `door-content`. Keep `WordPuzzle`'s default and prop contract so its call (`className="text-7xl text-green-900"`) still works whichever version lands first.
- **Do not change `GuessThatCat`'s `mmlemSFX` import to `asset()`**: imported module URLs never go through `asset()`; the `images` strings still do (already done by `getCatimgSrc`).
- **Do not use `animate-glow`/new keyframes**; no new loops (plan constraint). Do not remove the existing `shake`.
- **`exactOptionalPropertyTypes`**: do not write `className={props.className}` into a component prop that takes `className?: string` (e.g. `PillButton`); omit it or pass a string.
- Comments only for a non-obvious why. One is warranted: on `WordPuzzle`, that the letter colour is set on the inner span so `className` cannot override it. Everything else needs none; leave the existing Danish/English comments in `FoxChickenGrain` as they are.

## Verification

No tests (presentation only, no branching logic added). `npm run check` must pass. Then, with `npm run dev` (http://localhost:3000/julequiz/) and the pre-installed Chromium via a Playwright script kept outside the repo (nothing added to `package.json`/CI), at 1920x1080 open and screenshot doors 02, 06, 07, 08 and 13 (reset via `m` -> "Nulstil quiz", or seed `localStorage`, key and shape in `src/quizState.ts`). Check:

- 02: both boards fit inside the 1200px content area and the card without scroll; click an animal, sail, trigger a loss (fox + chicken alone) -> overlay readable; solve it -> win message; answer emoji bounce.
- 06: tiles appear for every letter, press a right letter -> tile reveals, wrong letter -> accent overlay + shake; the whole word fits the card (wraps, never overflows).
- 07: "borte, borte, borte..." then a polaroid cat after 4-6 s with sound.
- 08: question, then "Gerda", then the two follow-up lines at 2 s and 4 s.
- 13: Start -> playing pill -> "Spil lidt mere" / "Vis svar" -> revealed song and artist; text stays inside the card.
- Compare against the card in `QuestionScreen` and the mockup `Door.dc.html`; no white/green/blue defaults remain.

## Autonomous decisions

- Door 02 board size: enlarged to ~520x560 each to fit the 1200px area; rejected keeping the old 320x384 (looks tiny on the 1920px stage).
- Word-puzzle tiles: letter colour set on the inner span; rejected editing `src/questionTypes/WordPuzzle.tsx` (owned by `door-content`).
- Word-puzzle overflow: `flex-wrap`; rejected shrinking the font (the renderer controls it).
- MusicBox playing state: non-interactive neutral-pill `div`; rejected a `PillButton` (dead focusable button).
- MusicBox pills: `team-1` for play, `team-2` for reveal, no `keyHint`; rejected `dark`/`neutral` variants (less contrast) and key hints (no handlers).
- GuessThatCat: polaroid wrapper around the image; rejected a bare image (no tie to the paper look).
- Door text sizes: 58px question, 96px answer word, 43px follow-ups, copied from the stated `SlideView` tiers; rejected waiting for the merged `door-content` code.
- Water/bank tokens: `felt`/`felt-deep`/`mist`; rejected adding new tokens to `styles.css`.
- Overlay `bg-felt-deep/90` instead of `bg-black/80` (no black palette classes).
- Spec is a single branch; no user questions were asked (unattended).
