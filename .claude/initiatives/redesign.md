# Redesign: filt-julekalender

> Status: derived from git, not tracked here — see Status below.

## Goal

Make the quiz look more detailed and nicer while staying quirky and Christmassy. The target is
a felt advent calendar on a dark pine background. Fairy lights hang across the top, and the team
scoreboards are stitched paper plaques on strings. The doors are cream paper with stitched
edges, slightly tilted. An opened door swings ajar and shows a red or gold rosette for the team
that won it. An open door is a paper card with a ribbon banner, a holly sprig and big buttons with
key caps. After the last door, an end screen crowns the winner under fireworks.

The visual target is the mockup canvas https://claude.ai/artifact/6L2D9DQwajovZiTABz1UGg (private
to the owner). Its sources are committed in `.claude/initiatives/redesign-mockup/`: `Main.dc.html`
(board), `Door.dc.html` (open door), `Finale.dc.html` (end screen). Read them for exact colours,
radii, shadows and type sizes. The mockup is drawn at **1600×900**; multiply its px values by
**1.2** for the 1920×1080 stage. The mockup is a target, not a contract: where it conflicts with
a decision below, the decision wins.

This initiative builds on **quiz-packs** (`.claude/initiatives/quiz-packs.md`) and **absorbs its
last task, `pack-theme`**, which is cancelled. Per-pack colours are delivered here instead.

## Out of scope

- Changing what any door asks or shows: question text, media, answers and the `QuestionSpec`
  union stay as they are. Only presentation changes.
- Keyboard controls (`Enter`/space reveal, `1`/`2`/`q`/`x` award, `Escape`, `m` settings), scoring,
  consolation points (+5 per click on a team), and the saved-state format in `src/quizState.ts`.
- pack-theme's `snow` and `titleFont` fields, and any per-pack decoration switch. Decorations are
  always Christmas, and snow always falls while the quiz is started.
- A lightning round. There is none; the screen after the last door is the **end screen**.
- New npm dependencies, a test framework, CI steps, or committed screenshot scripts.
- A pack picker beyond the existing unknown-pack list (it only gets restyled).
- Fonts other than Mountains of Christmas and Nunito.
- Sound effects and music choices.

## Architecture decisions

- **Integration base is `claude/sweet-mendel-p0gtn1`, not `main`.** It starts at the tip of
  quiz-packs' integration branch `claude/vibrant-euler-3tsdtn` (after pack-loading). Every task
  branches from it and its PR targets it. *Why:* every push to `main` deploys to GitHub Pages, so
  a half-finished redesign would go live. The user merges one finished PR to `main` at the end,
  and that PR carries quiz-packs with it.
- **pack-theme is absorbed.** Its colour work happens in `foundation`, with the token set pinned
  below instead of pack-theme's `page/board/door/...` set. *Why:* both initiatives would otherwise
  rewrite the same files twice.
- **Fixed 1920×1080 stage.** Everything renders inside one `Stage` component: a 1920×1080 box,
  scaled with `transform: scale()` to fit the window, centred, and letterboxed in the `night`
  colour. Lay out in plain px or Tailwind sizes against 1920×1080, and use no `vw`/`vh`. Because the
  stage is transformed, `position: fixed` inside it is relative to the stage. The open door, the
  settings menu, the snow and the fireworks therefore all stay inside the stage. Existing `vh`
  units in `src/questionTypes/` are replaced (door-content) with px.
- **Door count stays dynamic.** quiz-packs made the grid columns and blink pattern depend on the
  number of doors (`gridColumns`, `tickGroup` in `index.tsx`). Nothing in the redesign may assume
  24 doors or 6 columns; door type sizes follow the door's size, not a fixed px value.
- **Colours: a pack sets seven base colours, and everything else is derived.** `Quiz.colors`
  (pinned below) is set as `--quiz-*` custom properties on the stage root. `src/styles.css`
  defines Tailwind 4 theme tokens on top of them, with derived shades made by `color-mix()`. `:root`
  holds jul-2025's values as defaults, so the prerendered shell and the unknown-pack page are
  coloured too. Components use only the token utilities (`bg-paper`, `text-ink`,
  `shadow-paper-edge`…), never raw hex and never Tailwind's `green-*`/`red-*` palette.
- **Team colours: Hold 1 = cranberry red, Hold 2 = gold**, which differ in lightness and stay
  distinguishable on a washed-out projector. Each team has its own "ink" colour for text on its
  fill (light on red, dark on gold).
- **Fonts:** `font-display` = Mountains of Christmas (title, door numbers, scores, ribbons) and
  `font-body` = Nunito 400–900 (everything else). DM Sans is no longer loaded.
- **Shared decor primitives live in one file, `src/components/decor.tsx`** (pinned below), made in
  `foundation` and used by every wave-2 task. Screen-specific decoration (garland, holly, rosette,
  crown, fireworks layout) lives with its screen.
- **The end screen is its own component, `src/components/EndScreen.tsx`.** `index.tsx` renders it
  in place of the header and grid once the quiz is finished. The fireworks and the winner display
  live inside it. A tie shows "Uafgjort!" with no crown.
- **Door content is restyled through the renderers.** The "shared building blocks" are the
  quiz-packs renderers in `src/questionTypes/` (`SlideView` and friends). They own the content
  typography on the paper card, so the 21 data-driven doors change in one place. Only the three
  `custom` doors (02, 07, 08) and the mini-games are restyled by hand.
- **Motion: ambient plus door opening, nothing more.** The fairy lights twinkle with CSS keyframes
  defined in `styles.css`. A waiting door's blink (the existing `tick`/`contrast` mechanism) becomes
  a golden glow. A door that has just been won swings open with `motion`. The open-door card keeps
  its spring entrance. There are no swinging plaques, bouncing titles or looping content animations.
- **Quizmaster hints are shown discreetly:** key caps on the open-door buttons, and a quiet board
  footer with "x af N låger åbnet" and an `M` settings hint.
- **Icons:** the existing `material-symbols` font for UI icons (close, play). Decorative
  drawings are inline SVG with `aria-hidden`. No emoji in the chrome; emoji inside door content stay.
- **Verification is `npm run check` plus Playwright screenshots** of the task's screen at
  1920×1080 against `npm run dev`, using the pre-installed Chromium. The script lives outside the
  repo. Nothing is added to `package.json` or CI.

## Constraints inherited by every task

- Branch from `claude/sweet-mendel-p0gtn1`, and target it with the PR. Never commit to `main`.
- Only the task's Owns list may be edited. In particular, wave-2 tasks do not edit
  `src/styles.css`, `src/components/decor.tsx`, `src/pages/index.tsx` (except `board`) or
  `CLAUDE.md`. A missing token or primitive is built locally in the task's own file and named
  in the PR body. It is not added to a shared file.
- Use the token utilities and decor primitives pinned below. No raw hex in components, and no
  Tailwind `green-*`, `red-*`, `amber-*` or `gray-*` classes.
- Lay out against the 1920×1080 stage. Use no `vw`/`vh`, and nothing that assumes 24 doors.
- `QuestionScreen`'s props and keyboard handling stay as they are on the base branch.
- Every URL to a file in `public/` goes through `asset()`; imported module URLs never do.
- `exactOptionalPropertyTypes` is on: omit optional props instead of passing `undefined`.
- `src/pages/_layout.tsx` is a server component. State, sound and `window` live in `"use client"`
  modules. `index.tsx` is prerendered, so anything reading `window` runs after mount.
- UI text and comments in Danish, identifiers and filenames in English, and commit messages in
  Danish and imperative (CLAUDE.md).
- Done means `npm run check` passes **and** screenshots at 1920×1080 show the screen matching
  the mockup. A saved quiz survives reloads: reset it (`m` → "Nulstil quiz") or seed
  `localStorage` (key and shape in `src/quizState.ts`) to reach board states such as won doors or
  the end screen.

## Pinned contracts

`src/types.ts`: `Quiz` gains a required `colors` (jul-2025 values shown):

```ts
colors: {
  background: string; // "#0e2c22" filt/fyrretræ bag brættet
  paper: string;      // "#f6ecd9" låger, plader, kort
  ink: string;        // "#12372a" tekst på papir
  accent: string;     // "#d2393f" lågenumre, bånd, sting
  highlight: string;  // "#f2c14e" glød, titelsnirkel, kroner
  team1: string;      // "#d2393f"
  team2: string;      // "#f2c14e"
};
```

Team ink colours are not pack fields. They are derived: `team-1-ink` = paper, and `team-2-ink` =
ink.

Tailwind colour tokens defined in `src/styles.css` (usable as `bg-*`, `text-*`, `border-*`
and so on). Derived values are `color-mix(in oklab, …)`, and `foundation` picks the exact
percentages to match the mockup:

| Token | Source |
| --- | --- |
| `night` | background, darkened (letterbox, deepest shade) |
| `felt` | background |
| `felt-deep` | background, darker (inset board panel) |
| `paper`, `paper-lit`, `paper-edge` | paper; lighter (glowing door); darker (bottom edge shadow) |
| `ink`, `ink-soft` | ink; ink mixed toward paper (secondary text on paper) |
| `snow`, `mist` | paper toward white (text on dark); snow toward felt (secondary on dark) |
| `accent`, `accent-deep` | accent; darker (ribbon folds, button shadow) |
| `highlight`, `highlight-deep` | highlight; darker |
| `team-1`, `team-1-deep`, `team-1-ink` | team1; darker; paper |
| `team-2`, `team-2-deep`, `team-2-ink` | team2; darker; ink |

Also: `--font-display`, `--font-body`, and the animations `animate-twinkle` (fairy lights) and
`animate-glow` (waiting door).

`src/components/Stage.tsx`: `"use client"`, `export const Stage: FC<{ colors: Quiz["colors"];
children: ReactNode }>`. It renders the scaled 1920×1080 box, with `--quiz-*` set from `colors`.

`src/components/decor.tsx` exports:

```ts
// Papirflade med indvendig stiplet søm og mørkere underkant.
Paper: FC<{ stitch?: "accent" | "team-1" | "team-2" | "highlight"; className?: string; children: ReactNode }>
// Lille tastetegn, fx "Enter", "1", "Q", "M".
KeyCap: FC<{ tone?: "on-light" | "on-dark"; children: ReactNode }>
// Stor rund knap; keyHint vises som KeyCap.
PillButton: FC<ComponentProps<"button"> & { variant: "team-1" | "team-2" | "neutral" | "dark"; keyHint?: string }>
// Holdets plade: navn, animeret point, antal låger og trøstepoint. Klik = +5 (kalderens onClick).
TeamPlaque: FC<{ team: 1 | 2; name: string; points: number; doors: number; consolation: number;
  size: "board" | "end"; onClick: () => void; children?: ReactNode }>
```

`children` on `TeamPlaque` is an overlay slot (e.g. the end screen's crown).

`src/components/EndScreen.tsx`:

```ts
EndScreen: FC<{ teamNames: [string, string]; points: [number, number]; doors: [number, number];
  consolation: [number, number]; onConsolation: (team: 1 | 2) => void }>
```

## Task graph

### foundation

- **Branch**: `redesign-foundation`
- **Depends on**: nothing
- **Goal**: The theme, the stage, the decor primitives and the end-screen seam exist, and the quiz
  runs inside them.
- **Scope**: add `Quiz.colors`, with jul-2025's values in its `quiz.ts`. In `src/styles.css`, add
  the `--quiz-*` defaults on `:root`, the pinned tokens, the fonts and the keyframes. In
  `_layout.tsx`, load Mountains of Christmas 400/700 and Nunito 400–900, drop DM Sans, and use
  `font-body`. Add `Stage.tsx` and `decor.tsx` as pinned. In `index.tsx`, wrap the board,
  overlays, snow and fireworks in `Stage`, and swap its `green-*`/`red-*` classes for tokens
  one-for-one. Move the finished-state view (scores plus fireworks) out of `index.tsx` into an
  `EndScreen.tsx` that keeps today's look and behaviour. Update CLAUDE.md (stage, tokens, colours,
  decor, end screen, pack-theme absorbed).
- **Out of scope**: the new look of any screen (wave 2). `decor.tsx` primitives are knowingly inert
  until wave 2 uses them, and their look follows the mockup, judged in isolation.
- **Owns**: `src/types.ts`, `src/quizzes/jul-2025/quiz.ts`, `src/styles.css`,
  `src/pages/_layout.tsx`, `src/components/Stage.tsx`, `src/components/decor.tsx`,
  `src/components/EndScreen.tsx`, `src/pages/index.tsx`, `CLAUDE.md`
- **Done when**: `npm run check` passes. The quiz plays end to end as before, now letterboxed:
  screenshots at 1920×1080 and 1366×768 show the same composition scaled. The open door and
  settings menu stay inside the stage. Changing `colors.background` in `quiz.ts` recolours the
  board in `npm run dev`.

### board

- **Branch**: `redesign-board`
- **Depends on**: foundation
- **Goal**: The board looks like `Main.dc.html`.
- **Scope**: the pine background with its knit texture, the fairy-light garland
  (`animate-twinkle`), the title button with its swash, two `TeamPlaque`s on strings, and the inset
  board panel. Doors in all states: closed paper, glowing (`contrast` → `animate-glow`), won with a
  team rosette, nobody, and skip. A won door swings open with `motion`. Also the footer with
  progress and the `M` hint, snow colour, and restyling the unknown-pack page. Number size scales
  with door size, so it works for any door count.
- **Out of scope**: the open door (`door-frame`), the end screen (`end-screen`), and the settings
  overlay (`settings`).
- **Owns**: `src/pages/index.tsx`, `src/components/QuestionCard.tsx`, `src/components/board/` (new)
- **Done when**: `npm run check` passes. Screenshots of a fresh started board and a half-played
  board (seeded state) match the mockup. A pack copied with 9 questions lays out cleanly (local
  only, not committed).

### door-frame

- **Branch**: `redesign-door-frame`
- **Depends on**: foundation
- **Goal**: The open door looks like `Door.dc.html`.
- **Scope**: in `QuestionScreen.tsx`, the dimmed board behind the card, the paper card with
  stitching, the ribbon banner with `{doorWord} {n}`, the holly sprig, and the close button. Also
  the "Vis svaret" `PillButton` with the `Enter` key cap, and the three award buttons with key caps
  `1`, `Q` and `2` using the team names. Keep the spring entrance. The card's content area is a
  fixed box that the door content is centred in.
- **Out of scope**: what is inside the content area (`door-content`, `minigames`); keyboard
  behaviour (unchanged).
- **Owns**: `src/components/QuestionScreen.tsx`
- **Done when**: `npm run check` passes. Screenshots of one standard door, before and after reveal,
  match the mockup. The keyboard flow works exactly as on the base branch.

### door-content

- **Branch**: `redesign-door-content`
- **Depends on**: foundation
- **Goal**: Every data-driven door reads well and looks consistent on the paper card.
- **Scope**: restyle `SlideView` (text sizes, notes, and framed images/videos with a paper-edge
  shadow and a slight tilt), the word-puzzle, music, poster-reveal and video renderers, and the
  inline posterReveal body in `src/questionTypes/index.tsx`. Replace `vh` units with px, and
  colours with tokens. Pass `WordPuzzle` a token colour instead of `text-green-900`.
- **Out of scope**: `src/components/WordPuzzle.tsx`, `MusicBox.tsx` and the other games
  (`minigames`); the custom doors 02/07/08 (`minigames`); the card frame (`door-frame`).
- **Owns**: `src/questionTypes/`
- **Done when**: `npm run check` passes, and screenshots of a standard, a wordPuzzle, a music, a
  posterReveal and a video door (question and answer) look consistent and nothing overflows the
  card.

### end-screen

- **Branch**: `redesign-end-screen`
- **Depends on**: foundation
- **Goal**: The end screen looks like `Finale.dc.html`.
- **Scope**: the night sky with fireworks (`@fireworks-js/react`, already a dependency), snowy hills,
  "Alle N låger er åbnet", "{name} vinder!" or "Uafgjort!", and two `TeamPlaque`s at `size="end"`
  with the winner larger and crowned. Clicks still give +5. Ends with "Glædelig jul!".
- **Out of scope**: when the end screen appears and its music (`index.tsx`, board).
- **Owns**: `src/components/EndScreen.tsx`
- **Done when**: `npm run check` passes. Screenshots of a seeded finished quiz with a winner and with
  a tie match the mockup. A plaque click raises that team's points by 5.

### settings

- **Branch**: `redesign-settings`
- **Depends on**: foundation
- **Goal**: The `m` settings menu matches the new look.
- **Scope**: `SettingsMenu` as a `Paper` card with a ribbon heading "Indstillinger" over the dimmed
  stage, and `ResetQuizSetting` buttons as `PillButton`s (confirm in team-1 red, cancel neutral).
- **Out of scope**: new settings items.
- **Owns**: `src/components/SettingsMenu.tsx`, `src/components/ResetQuizSetting.tsx`
- **Done when**: `npm run check` passes, screenshots of the menu and its confirm state look
  consistent with the door card, and reset still works.

### minigames

- **Branch**: `redesign-minigames`
- **Depends on**: foundation
- **Goal**: The mini-games and custom doors fit the paper card.
- **Scope**: restyle `FoxChickenGrain` (felt banks, river and boat in tokens), `WordPuzzle` letters
  as paper tiles, `GuessThatCat`, and the `MusicBox` buttons as `PillButton`s. Restyle the custom
  doors `02-fox-chicken-grain`, `07-gabby-kat` and `08-husnisse` with tokens and sizes matching
  `SlideView`'s scale. Component props stay as they are.
- **Out of scope**: game rules and behaviour; the renderers that call these games (`door-content`).
- **Owns**: `src/components/FoxChickenGrain.tsx`, `src/components/WordPuzzle.tsx`,
  `src/components/GuessThatCat.tsx`, `src/components/MusicBox.tsx`,
  `src/quizzes/jul-2025/questions/02-fox-chicken-grain.tsx`,
  `src/quizzes/jul-2025/questions/07-gabby-kat.tsx`,
  `src/quizzes/jul-2025/questions/08-husnisse.tsx`
- **Done when**: `npm run check` passes, and doors 02, 06 (word puzzle), 07, 08 and 13 (music) play
  through in the browser with screenshots consistent with the card.

### polish

- **Branch**: `redesign-polish`
- **Depends on**: board, door-frame, door-content, end-screen, settings, minigames
- **Goal**: The assembled redesign is coherent and documented.
- **Scope**: run the Integration check below, and fix the cross-screen inconsistencies it finds,
  limited to `src/styles.css` and `src/components/decor.tsx` (shared values). List anything else as
  a follow-up instead of fixing it. Update CLAUDE.md for everything wave 2 changed.
- **Out of scope**: new features, and screen-specific rewrites.
- **Owns**: `src/styles.css`, `src/components/decor.tsx`, `CLAUDE.md`
- **Done when**: `npm run check` passes and the Integration check passes.

## Waves

A wave starts only once every task in the previous wave has merged into `claude/sweet-mendel-p0gtn1`.

- **Wave 1**: foundation
- **Wave 2**: board, door-frame, door-content, end-screen, settings, minigames
- **Wave 3**: polish

## Integration check

In `npm run build && npm start` (the static build), at 1920×1080 and once at 1366×768:

- A fresh board: garland twinkles, doors glow in turn once the title is clicked, and snow falls.
- Open every door type (standard, wordPuzzle, music, posterReveal, video, and custom 02/07/08).
  Reveal and award to Hold 1, Hold 2 and nobody. The won door swings open with the right rosette,
  and points animate on the plaque.
- Background music dims for doors with `backgroundVolume` and restores on close.
- `m` opens settings over the board, and reset clears the pack.
- Finish the quiz (seed state): the end screen crowns the leader, a tie shows "Uafgjort!", and
  plaque clicks add 5.
- A local copy of the pack with three questions and changed `colors` (not committed) recolours
  every screen, and its board lays out for three doors.
- `/julequiz/?quiz=nope` shows the restyled pack list.
- Browser console: no hydration warnings and no 404s.

## Status

Not tracked in this file — derive it:

- merged: `gh pr list --state merged --search "redesign-"`
- open: `gh pr list --state open --search "redesign-"`
- PRs target `claude/sweet-mendel-p0gtn1`, not `main`.
- started but unmerged: `git branch -a --list "*redesign-*"`
