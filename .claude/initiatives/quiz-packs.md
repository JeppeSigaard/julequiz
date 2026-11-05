# Quiz-pakker og datadrevne spørgsmål

> Status: derived from git, not tracked here — see Status below.

## Goal

Make the quiz reusable outside Christmas. A quiz becomes a **pack**: one folder of question files
plus a `quiz.ts` holding the title, team names, door word, rules, music and theme. The pack on the
big screen is chosen with `?quiz=<pack>`, and every pack ships in the same build, so the quizmaster
can switch quizzes without rebuilding.

A question is written as **data** of a known type (standard, wordPuzzle, music, posterReveal,
video) and does not need hand-written JSX. A `custom` type keeps one-off games possible. The number
of doors follows the number of question files. Today's quiz moves, unchanged in content, into the
pack `jul-2025`.

## Out of scope

- JSON or other runtime-loaded question formats. Packs are TypeScript, checked by `npm run check`.
- A pack picker UI beyond the "unknown pack" list in Architecture decisions.
- Translating the UI. Fixed strings ("point", "(ingen)", "Spil lidt mere", "Vis svar" …) stay Danish.
  Only the door word ("Låge") and team names are per pack.
- Runtime loading of arbitrary Google fonts.
- Changing scoring: consolation points (+5 per click on a team name) and fireworks stay global.
- More than two teams.
- A test framework or tests. The project has none (CLAUDE.md), and none are added.
- Changing keyboard controls in `QuestionScreen`.
- New questions or a new pack beyond `jul-2025`.

## Architecture decisions

- **Authored vs rendered question.** Authors write a `QuestionSpec` (pinned below). One function,
  `toQuestion(spec)` in `src/questionTypes/index.tsx`, turns it into the existing rendered
  `Question` (`{ id, body, answer, setVolume?, skip? }` in `src/types.ts`), which the board and
  `QuestionScreen` keep consuming. *Why:* this keeps `index.tsx` and `QuestionScreen.tsx` out of
  the question-type tasks, so those tasks can run in parallel with the board task.
- **One renderer file per type** in `src/questionTypes/` (`Standard.tsx`, `WordPuzzle.tsx`,
  `Music.tsx`, `PosterReveal.tsx`, `Video.tsx`). `custom` passes `body` and `answer` through.
- **Standard types normalise the layout.** There is one shared layout per type, and the font size
  is picked from the text length, so authors never write Tailwind classes. Migrated doors may look
  slightly different from today; the user accepted this.
- **One `video` type.** It plays the clip, then fades the prompt in over it; the answer is a
  standard `Slide`. Doors 14 and 19 change slightly: 14's prompt appears after the clip instead of
  during it, and 19 loses its "Se godt efter" click-to-start. The user accepted this.
- **Door → type mapping.** The `question-types` and `interactive-types` tasks follow this; nothing
  else decides it.
  - standard: 1, 3, 4, 5, 10, 12, 16
  - wordPuzzle: 6, 9, 20
  - music: 13, 21, 23
  - posterReveal: 18, 22, 24
  - video: 11, 14, 15, 17, 19
  - custom: 2 (FoxChickenGrain), 7 (GuessThatCat), 8 (timed reveal)
- **Reusable games stay generic in `src/components/`** and take their content as props.
  `MusicBox` receives one track's data instead of an index into its internal `CONFIG`.
  `GuessThatCat` receives its image list. Only truly one-off code (door 8) lives in the pack's
  question file.
- **Pack layout.** `src/quizzes/<pack>/quiz.ts` default-exports a `Quiz`.
  `src/quizzes/<pack>/questions/NN-<slug>.tsx` each default-export one `QuestionSpec`. NN is
  two-digit, and filename order is the authored order. The pack name is the folder name, in
  kebab-case.
- **Discovery** uses `import.meta.glob(..., { eager: true })` in one module, `src/quizzes/index.ts`.
  It globs `./*/quiz.ts` and `./*/questions/*.tsx`. Eager loading puts every pack in the bundle;
  media are URLs, so the bundle stays small. *Why not lazy:* a lazy glob adds an async loading
  state for no gain at this size.
- **Pack selection.** `?quiz=<pack>` picks the pack. With no parameter, `DEFAULT_QUIZ` from
  `src/config.ts` (`"jul-2025"`) is used. An unknown name renders a plain list of the available
  packs as `?quiz=` links instead of the board. There is no silent fallback: a typo must be
  visible on quiz night.
- **Media live per pack** in `public/quizzes/<pack>/images|video|audio/`, referenced by absolute
  URL (`/quizzes/jul-2025/images/…`). This includes music tracks and the pack's background and
  finale music, which move out of `src/audio/`. Shared UI sound effects stay in `src/sfx/` as module
  imports.
- **Per-pack rules** (decided by the planner; the user had no preference): `shuffle`,
  `pointsPerQuestion`, `snow`, `music.background`, `music.finale`. Consolation points and
  fireworks stay global. `LIGHTNING_ROUND_POINTS` is deleted; it was never read.
- **Theme colours** are hex strings in `quiz.ts`. The page sets them as CSS custom properties on
  its root element, and components use Tailwind arbitrary values such as `bg-(--color-board)`.
  Authors need no Tailwind knowledge.
- **Title font** comes from a fixed list that is already loaded in `src/pages/_layout.tsx`:
  `"Mountains of Christmas" | "Nunito" | "DM Sans"`. No new font loading.
- **Door count is derived.** "Finished" means every door that is not `skip` has been answered; the
  blink pattern and grid columns are computed from the count. Nothing may assume 24.
- **`env.d.ts`.** `src/env.d.ts` becomes exactly `/// <reference types="vite/client" />`. *Why:*
  today it references the absent `react-scripts` types, so `import.meta.glob` does not typecheck.
  Vite's client types also declare `*.mp3` as `string`. This was verified during planning.

## Constraints inherited by every task

- `npm run check` must pass before a task is called done. It only proves typecheck and build, so
  every task also opens the quiz in `npm run dev` and clicks through the doors it touched.
- UI text and comments are Danish; identifiers and filenames are English; commit messages are
  Danish and imperative (CLAUDE.md).
- Never commit to `main`.
- `src/pages.gen.ts` is generated; never edit it.
- `src/pages/_layout.tsx` is a server component. Anything with state, sound, `window` or
  `URLSearchParams` lives in a `"use client"` module.
- `tsconfig` has `exactOptionalPropertyTypes`, so an optional field must be omitted, not set to
  `undefined`.
- `index.tsx` is statically prerendered. Read `window.location`, and run the shuffle, only after
  mount (in an effect, as the shuffle already is), or hydration mismatches.
- Only the task's Owns list may be edited; siblings own the rest.
- Each task updates the CLAUDE.md lines its change makes false, except where its Owns list
  excludes CLAUDE.md.

## Pinned contracts

`src/types.ts` (added by `question-types`; the rendered `Question` type stays as it is):

```ts
export type Slide = { text?: string; note?: string; image?: string; video?: string; audio?: string };
type Common = { backgroundVolume?: number; skip?: boolean };
export type QuestionSpec = Common & (
  | { type: "standard"; question: Slide; answer: Slide }
  | { type: "wordPuzzle"; hint: string; word: string }
  | { type: "music"; track: string; song: string; artist: string; start: number; stop: number; answerStart: number }
  | { type: "posterReveal"; prompt: string; cropped: string; full: string }
  | { type: "video"; video: string; prompt: string; caption?: string; answer: Slide }
  | { type: "custom"; body: ReactNode; answer: ReactNode }
);
```

`backgroundVolume` maps to the rendered `Question.setVolume`. The `question-types` task adds only
the `standard` and `custom` members. `interactive-types` adds the other four exactly as written
here.

`src/quizzes/<pack>/quiz.ts` default export (type `Quiz` in `src/types.ts`):

```ts
export type Quiz = {
  title: string;            // "den store julequiz"
  teamNames: [string, string];
  doorWord: string;         // "Låge"
  shuffle: boolean;
  pointsPerQuestion: number;
  music: { background: string; finale: string }; // URLs
  // added by pack-theme:
  snow: boolean;
  titleFont: "Mountains of Christmas" | "Nunito" | "DM Sans";
  colors: { page: string; board: string; door: string; doorHighlight: string; doorDone: string; screen: string; text: string };
};
```

`pack-loading` adds every field above the comment. `pack-theme` adds the rest.

## Task graph

### dynamic-board

- **Branch**: `quiz-packs-dynamic-board`
- **Depends on**: nothing
- **Goal**: The board and question screen work for any number of doors and use `TEAM_NAMES`.
- **Scope**: replace `allAnswered.length === 24` with a derived "every non-skip door answered";
  compute the blink pattern and grid columns from the count; make `QuestionScreen` team buttons
  use `TEAM_NAMES`; delete `LIGHTNING_ROUND_POINTS`; rewrite `src/env.d.ts` to the vite/client
  reference.
- **Out of scope**: question types (`question-types`); quiz packs and `quiz.ts` (`pack-loading`);
  colours (`pack-theme`); CLAUDE.md (updated by `interactive-types`).
- **Owns**: `src/pages/index.tsx`, `src/components/QuestionScreen.tsx`, `src/config.ts`,
  `src/env.d.ts`
- **Done when**: `npm run check` passes and the 24-door quiz plays as before. A temporary
  local deletion of a door from `QUESTIONS` (not committed) still reaches the finale.

### question-types

- **Branch**: `quiz-packs-question-types`
- **Depends on**: nothing
- **Goal**: Questions are authored as `QuestionSpec`; `standard` and `custom` exist.
- **Scope**: add `Slide` and `QuestionSpec` (standard and custom members) to `src/types.ts`; add
  `src/questionTypes/index.tsx` with `toQuestion` and `src/questionTypes/Standard.tsx`; migrate
  doors 1, 3, 4, 5, 10, 12, 16 to `standard`; wrap every other door's current JSX unchanged as
  `custom`; `src/questions/index.ts` maps the specs through `toQuestion`, so `QUESTIONS` keeps its
  type. Fix the stray rendered `,` in doors 5, 15 and 19, and remove door 15's unused `Answer`.
- **Out of scope**: the other four types (`interactive-types`); moving files or media
  (`pack-loading`); `index.tsx` and `QuestionScreen.tsx` (`dynamic-board`); CLAUDE.md.
- **Owns**: `src/types.ts`, `src/questionTypes/`, `src/questions/`
- **Done when**: `npm run check` passes; every door opens and reveals; standard doors use the
  shared layout.

### interactive-types

- **Branch**: `quiz-packs-interactive-types`
- **Depends on**: dynamic-board, question-types
- **Goal**: The `wordPuzzle`, `music`, `posterReveal` and `video` types exist, and their doors use
  them.
- **Scope**: add the four union members and renderer files; refactor `MusicBox` to take one
  track's data as props (its `CONFIG` disappears and the track data moves into doors 13, 21, 23);
  migrate the doors per the mapping. Tracks are still `import`ed from `src/audio/` here, because
  an import is a string URL. Update CLAUDE.md for everything `dynamic-board`, `question-types` and
  this task changed.
- **Out of scope**: moving media and files (`pack-loading`); `GuessThatCat` props
  (`pack-loading`); colours.
- **Owns**: `src/types.ts`, `src/questionTypes/`, `src/questions/`, `src/components/MusicBox.tsx`,
  `src/components/WordPuzzle.tsx`, `CLAUDE.md`
- **Done when**: `npm run check` passes; doors 6, 9, 11, 13–15, 17–24 play through to the answer
  in the browser; only doors 2, 7 and 8 remain `custom`.

### pack-loading

- **Branch**: `quiz-packs-pack-loading`
- **Depends on**: interactive-types
- **Goal**: Quizzes are packs discovered from `src/quizzes/` and selected with `?quiz=`.
- **Scope**: add `Quiz` (fields above the comment) to `src/types.ts`; `git mv` the doors to
  `src/quizzes/jul-2025/questions/NN-<slug>.tsx` with default exports; add `jul-2025/quiz.ts`;
  add `src/quizzes/index.ts` with the eager glob; add `DEFAULT_QUIZ` to `src/config.ts` and remove
  `POINTS_PER_QUESTION` and `TEAM_NAMES` from it, since they now come from the pack; resolve the
  pack in `index.tsx` after mount; render the unknown-pack list; apply `shuffle`,
  `pointsPerQuestion`, `teamNames`, `doorWord`, `title` and `music`; move every pack media file
  (`public/images`, `public/video`, `public/audio`, `src/audio`) to `public/quizzes/jul-2025/`
  and update URLs; give `GuessThatCat` an `images` prop. The favicon stays in `public/images/`.
  Delete `src/questions/`. Update CLAUDE.md.
- **Out of scope**: snow, colours, title font (`pack-theme`).
- **Owns**: `src/types.ts`, `src/config.ts`, `src/quizzes/`, `src/questions/`, `src/questionTypes/`,
  `src/pages/index.tsx`, `src/components/QuestionScreen.tsx`, `src/components/GuessThatCat.tsx`,
  `src/components/MusicBox.tsx`, `src/audio/`, `public/`, `CLAUDE.md`
- **Done when**: `npm run check` passes; `/`, `/?quiz=jul-2025` and `/?quiz=nope` behave as
  decided; a copied pack folder with three questions shows three doors and finishes; all jul-2025
  media still load.

### pack-theme

- **Branch**: `quiz-packs-pack-theme`
- **Depends on**: pack-loading
- **Goal**: Each pack controls snow, title font and colours.
- **Scope**: add `snow`, `titleFont` and `colors` to `Quiz` and to `jul-2025/quiz.ts`, with
  today's green and red as hex; set CSS custom properties on the page root; replace the hardcoded
  green and red classes in the board, `QuestionCard`, `QuestionScreen` and the door renderers with
  `(--color-*)` values; apply `titleFont` to the title and door heading. Update CLAUDE.md.
- **Out of scope**: any font not already loaded in `_layout.tsx`; colours inside the
  `FoxChickenGrain`, `MusicBox` buttons and `WordPuzzle` internals.
- **Owns**: `src/types.ts`, `src/quizzes/*/quiz.ts`, `src/pages/index.tsx`,
  `src/components/QuestionCard.tsx`, `src/components/QuestionScreen.tsx`, `src/questionTypes/`,
  `CLAUDE.md`
- **Done when**: `npm run check` passes; jul-2025 looks as it did after `pack-loading`; changing
  one hex in `quiz.ts` changes the board live in `npm run dev`; `snow: false` hides the snow.

## Waves

- **Wave 1**: dynamic-board, question-types
- **Wave 2**: interactive-types
- **Wave 3**: pack-loading
- **Wave 4**: pack-theme

## Integration check

After wave 4, in `npm run build && npm start` (the static build, not just dev):

- `/` plays jul-2025 end to end: open each door, reveal it, award it, and see the finale with
  fireworks and finale music once the last door is answered.
- `/?quiz=nope` lists the packs; each link loads its pack.
- Copy `src/quizzes/jul-2025` to `src/quizzes/test-pack`, keep three questions, change the title,
  team names, door word and a colour, and set `shuffle: false`, `snow: false`. Rebuild and confirm
  three doors in file order, the new text and colour, no snow, and that the finale triggers after
  three answers. Delete the test pack afterwards.
- Background music dims for doors with `backgroundVolume` and restores on close.
- Browser console: no hydration warnings, no 404s for media.

## Status

Not tracked in this file — derive it:

- merged: `gh pr list --state merged --search "quiz-packs-"`
- open: `gh pr list --state open --search "quiz-packs-"`
- started but unmerged: `git branch -a --list "*quiz-packs-*"`
