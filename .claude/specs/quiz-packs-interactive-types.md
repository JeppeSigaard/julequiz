# Quiz packs: the wordPuzzle, music, posterReveal and video types

> Status: in progress — quiz-packs-interactive-types
> Branch: `quiz-packs-interactive-types`, base and PR target `claude/vibrant-euler-3tsdtn` (diff against `origin/claude/vibrant-euler-3tsdtn`; never `main`).
> Master plan: `.claude/initiatives/quiz-packs.md`. Depends on `dynamic-board` and `question-types` (both merged).

## Goal

Add four question types to the authored `QuestionSpec` union, each with its own renderer in `src/questionTypes/`, and migrate doors 6, 9, 11, 13-15 and 17-24 from `custom` to them. `MusicBox` stops owning track data and takes one track as props; the five music tracks move from `src/audio/` to `public/audio/`. After this only doors 2, 7 and 8 are `custom`. CLAUDE.md is brought up to date for this task and for `dynamic-board` and `question-types`.

## Out of scope

- Moving media or files other than the five music tracks (`pack-loading` owns that). Background and finale music stay imported from `src/audio/`.
- `GuessThatCat` props, `FoxChickenGrain` (doors 2, 7 stay custom), door 8 (stays custom).
- Colours, theme, `src/pages/index.tsx`, `src/quizState.ts`, `src/components/QuestionScreen.tsx`, `src/config.ts`, `src/asset.ts`, `src/env.d.ts`, `src/pages/_layout.tsx`, `src/pages.gen.ts`.
- Tests or a test framework (the project has none). New questions or packs. Changing keyboard controls.
- Translating UI strings; "Start", "Spil lidt mere", "Vis svar", "Afspiller..." stay as they are.

## Owns (hard boundary; edit nothing else)

`src/types.ts`, `src/questionTypes/`, `src/questions/`, `src/components/MusicBox.tsx`, `src/components/WordPuzzle.tsx`, `src/audio/`, `public/audio/`, `CLAUDE.md`.

## Settled architecture (from the master plan, never re-open)

- Authors write a `QuestionSpec`; `toQuestion(spec, id)` in `src/questionTypes/index.tsx` turns it into the rendered `Question` (`{ id, body, answer, setVolume?, skip? }`). `backgroundVolume` maps to `setVolume`.
- `Question.id` is persisted by `quizState.ts`; ids stay `"1"`-`"24"` (array position + 1 in `src/questions/index.ts`).
- Media URLs in spec data are public paths (`"/images/x.jpg"`). Renderers wrap every such URL with `asset()` from `src/asset.ts`; authors never call it. Never `asset()` an imported module URL (`import x from "…mp3"`): Vite already prefixed it.
- One renderer file per type in `src/questionTypes/`: `WordPuzzle.tsx`, `Music.tsx`, `PosterReveal.tsx`, `Video.tsx` (next to `Standard.tsx`). Shared layouts normalise per type; authors write no Tailwind. Migrated doors may look slightly different (user accepted).
- `video` plays the clip, then fades the prompt in over it; the answer is a standard `Slide`. Door 14's prompt appears after the clip, and door 19 loses "Se godt efter" (user accepted).
- Reusable games stay generic in `src/components/` and take content as props: `MusicBox` receives one track's data.
- Door mapping: wordPuzzle 6, 9, 20; music 13, 21, 23; posterReveal 18, 22, 24; video 11, 14, 15, 17, 19; custom 2, 7, 8.
- Constraints: `exactOptionalPropertyTypes` (omit optional fields, never set `undefined`); UI text and comments Danish, identifiers and filenames English; commit messages Danish and imperative; never commit to `main`; do not edit `src/pages.gen.ts`; `npm run check` must pass and the touched doors must be clicked through in `npm run dev`.

Pinned contract: add exactly these four members to `QuestionSpec` in `src/types.ts`, in this order between `standard` and `custom`:

```ts
| { type: "wordPuzzle"; hint: string; word: string }
| { type: "music"; track: string; song: string; artist: string; start: number; stop: number; answerStart: number }
| { type: "posterReveal"; prompt: string; cropped: string; full: string }
| { type: "video"; video: string; prompt: string; caption?: string; answer: Slide }
```

## Decisions made

- `MusicBox` props are `{ track: string; song: string; artist: string; start: number; stop: number; answerStart: number }`, where `track` is an already-`asset()`-wrapped URL (the `Music` renderer wraps it). The `index` prop, `CONFIG`, track imports and the random-track fallback are deleted.
- Music renderer body is today's "MUSIKQUIZ!" (`text-7xl`) plus `<audio src={vinylStop} autoPlay />` (`../sfx/vinyl-stop.mp3` module import); answer is `<MusicBox …/>`.
- WordPuzzle renderer body is the hint (`text-4xl mb-10`) above `<WordPuzzle word onCorrectGuess onIncorrectGuess className="text-7xl text-green-900"/>` with the `ding.mp3` / `wrong2.mp3` sfx as in door 6 today; answer is `<p className="font-bold text-9xl">{word}</p>`.
- PosterReveal renderer body is `<p className="text-7xl">{prompt}</p>`; answer is the existing click-to-reveal (cropped `w-150` button, then full `w-125`), with `alt={prompt}`.
- Video renderer body: the clip autoplays, no controls, fixed box `h-[55vh] max-w-250 object-contain`; when `onEnded` fires the clip dims to `opacity-25` and `prompt` fades in centred over it (`absolute`, `text-5xl font-bold`, `transition-opacity`); `caption` renders below as `<p className="text-3xl">`. Answer is `<SlideView slide={spec.answer} />` (imported from `./Standard`).
- Music track files are renamed to kebab-case when moved: `christmas-lights.mp3`, `driving-home-for-christmas.mp3`, `jingle-bell-rock.mp3`, `last-christmas.mp3`, `snowman.mp3`. All five move, including the two no door uses.

## Architecture facts (verified against current code)

- `src/types.ts` today has `Question`, `Slide`, `Common`, and `QuestionSpec` = `Common & (standard | custom)`.
- `src/questionTypes/index.tsx`: `toQuestion` builds `common` (conditional spreads for `setVolume`, `skip`) then an exhaustive `switch (spec.type)` with no `default`, so a new member is a compile error until handled. `SlideView` and `textSize` are exported from `src/questionTypes/Standard.tsx` (video/image/audio via `asset()`, `w-250` video).
- `toQuestion` runs at module load inside `src/questions/index.ts` (`SPECS.map(...)`), not during render: hooks must live in components that `toQuestion` returns as JSX.
- Each door file `src/questions/QuestionN.tsx` exports `QuestionN: QuestionSpec`. Doors 6, 9, 20 are `Body` (hint + `WordPuzzle` + sfx) with a bold-word answer. Doors 13, 21, 23 use `<MusicBox index={3|1|0} />` with `backgroundVolume: 0.05`. Doors 18, 22, 24 are `Answer` click-to-reveal posters. Doors 11, 14, 15, 17, 19 are video custom doors.
- `MusicBox` `CONFIG` order: 0 Christmas Lights / Coldplay (start 7.7, stop 8, answerStart 132.5); 1 Driving Home for Christmas / Chris Rea (0, 0.5, 22.3); 2 Jingle Bell Rock / Bobby Helms (1.2, 1.5, 7.3); 3 Last Christmas / Wham! (0.2, 0.45, 17.5); 4 Snowman / Sia (0.5, 2, 48.6). Door 13 uses index 3, door 21 index 1, door 23 index 0.
- Tracks currently in `src/audio/`: the five above plus `Valdes Jul.mp3`, `lightning-round.mp3`, `waiting-music-116216.mp3`, `wintry-bossa-177917.mp3`. `public/audio/` holds only `Valdes Jul.mp3` (door 15 plays `/audio/Valdes Jul.mp3#t=00:00:50`). Only `MusicBox` imports the five tracks.
- `QuestionScreen` renders `answer` or `body` in a centred `flex-col` `<main>`; `WordPuzzle` and `MusicBox` listen to or use sound directly; `MusicBox` and `useSound` take a URL string.
- CLAUDE.md lines now false (verified): the `index.tsx` bullet says ids are overwritten by grid position (only the `QuestionCard` prop is; `Question.id` is persisted by `quizState.ts`); the points bullet says "alle 24 låger … hårdkodet" and mentions `LIGHTNING_ROUND_POINTS` (finish is derived from non-`skip` doors; the constant is gone from `src/config.ts`); the Spørgsmål section describes `Question` in `QuestionN.tsx` rather than `QuestionSpec` and `toQuestion`; Medier says music tracks are imported from `src/audio/` and `src/env.d.ts` declares `*.mp3` (now `/// <reference types="vite/client" />`).

## Implementation steps

1. `src/types.ts`: add the four pinned members to `QuestionSpec` (see above).
2. `src/components/MusicBox.tsx`: delete the five `import trackN` lines and `CONFIG`; type the props as in Decisions; replace every `selectedTrack.X` with `props.X` and remove the `selectedTrack` state. Leave the state machine, timing and JSX untouched. Add nothing else.
3. Create `src/questionTypes/WordPuzzle.tsx`, `Music.tsx`, `PosterReveal.tsx`, `Video.tsx`. Each exports the small client components it needs (hooks, state) and the file may be `"use client"`-free like `Standard.tsx` since it is only imported from client modules. Copy from: door 6 (`WordPuzzleBody`), door 23 + `MusicBox` (`MusicBody`), door 24 `Answer` (`PosterAnswer`), door 17 `Body` + door 11 overlay (`VideoBody`). Name components so they do not clash with `src/components/WordPuzzle.tsx` (use `WordPuzzleQuestion`, not `WordPuzzle`).
4. `src/questionTypes/index.tsx`: add the four `case`s to the switch. Music: `answer: <MusicBox track={asset(spec.track)} song artist start stop answerStart />`. Keep `...common` on each.
5. Move the tracks: `git mv` each of the five files from `src/audio/` to `public/audio/` with the kebab-case names above.
6. Migrate the doors, keeping `backgroundVolume`/`skip` values; delete now-dead imports and helper components in each file:
   - 6: hint `"Romantik!"`, word `"MISTELTEN"`. 9: `"Av, det stikker!"`, `"PYNTEGRAN"`. 20: `"Mums!"`, `"BRÆNDTE MANDLER"`.
   - 13: `/audio/last-christmas.mp3`, song `"Last Christmas"`, artist `"Wham!"`, 0.2 / 0.45 / 17.5. 21: `/audio/driving-home-for-christmas.mp3`, `"Driving Home for Christmas"`, `"Chris Rea"`, 0 / 0.5 / 22.3. 23: `/audio/christmas-lights.mp3`, `"Christmas Lights"`, `"Coldplay"`, 7.7 / 8 / 132.5. All three keep `backgroundVolume: 0.05`.
   - 18: prompt `"Gæt en julefilm"`, cropped `/images/poster-1-crop.webp`, full `/images/poster-1.webp`. 22: `/images/poster-2-crop.jpg`, `/images/poster-2.jpg`. 24: `/images/poster-3-crop.jpeg`, `/images/poster-3.jpeg`.
   - 11 (vol 0.1): video `/video/bertelq-2.mp4`, prompt `"Hvor skal Bertel hen?"`, caption `"Bertel Haarder har ikke tid til at svare på kritiske spørgsmål om fedmeoperationer (20. december 2010)."`, answer `{ video: "/video/bertala-2.mp4" }`.
   - 14 (vol 0.05): video `/video/viersaasode.mp4`, prompt `"Hvad hedder julekalenderen fra 1997, hvor nizzerne ikke kan sove for al larmen?"`, answer `{ image: "/images/tunnel.png" }`.
   - 15 (vol 0.1): video `/video/trille.mov`, prompt `"Hvad synger trille?"`, caption `"Hjemmevideo"`, answer `{ text: "Valdes Jul", note: "Christopher", audio: "/audio/Valdes Jul.mp3#t=00:00:50" }`.
   - 17 (vol 0.3): video `/video/nothing-short.mp4`, prompt `"Hvad er der i pakken?"`, answer `{ video: "/video/nothing.mp4", text: "Ingenting (en kat)" }`.
   - 19 (vol 0.4): video `/video/letgo.mp4`, prompt `"Hvor mange personer er der i videoen?"`, answer `{ video: "/video/letgoansw.mp4", text: "7" }`.
7. `CLAUDE.md` (Danish): fix exactly the lines listed under Architecture facts. Rewrite the `index.tsx` bullet (ids persisted, not just React keys), the points bullet (finish = every non-`skip` låge besvaret; board columns and blink derived from antal; no lynrunde-konstant), the Spørgsmål section (`QuestionSpec` in `src/types.ts`, one `src/questions/QuestionN.tsx` each, `toQuestion` in `src/questionTypes/index.tsx`, six types `standard`/`wordPuzzle`/`music`/`posterReveal`/`video`/`custom`, one renderer file per type, ids `"1"`-`"24"` by position, only doors 2, 7, 8 are `custom`; `MusicBox` takes one track as props) and Medier (music tracks and all media in `public/` via `asset()`; `src/audio/` only holds baggrunds- og afslutningsmusik, imported as modules; Vites typer erklærer `*.mp3`). Keep it short; change no other line.

## Traps

- **Do not call hooks in `toQuestion` or any renderer function.** `toQuestion` runs once at module load (`src/questions/index.ts`), so `useSound`/`useState` there throws or leaks. Put hooks in components returned as JSX, as door 6's `Body` does.
- **Do not `asset()` the `vinyl-stop.mp3`, `ding.mp3` or `wrong2.mp3` imports.** They are Vite module URLs, already prefixed; wrapping doubles `/julequiz/`. Do `asset()` the spec's `track`, `video`, `cropped`, `full` and answer-slide URLs (`SlideView` already does for slides).
- **Do not leave the track names with spaces or leave files in `src/audio/`.** A leftover `import … from "../audio/…"` of a moved file breaks the build; `grep -rn "audio/" src` must show only `index.tsx` (background, finale) afterwards. Do not move `lightning-round.mp3`, `waiting-music-116216.mp3`, `wintry-bossa-177917.mp3` or `Valdes Jul.mp3` (`pack-loading` owns them).
- **Do not set `caption: undefined` or pass `undefined` optional values.** `exactOptionalPropertyTypes` rejects it; omit the key (doors 14, 17, 19 have no caption) and guard with `spec.caption !== undefined`.
- **Do not change `src/components/WordPuzzle.tsx` behaviour.** Its keydown listener and shake animation are shared; doors 6, 9 and 20 need only the new renderer. (It is in Owns only for `className`/prop typing if the build demands it; change nothing otherwise.)
- **Do not use dynamic Tailwind classes** (`` `text-${n}xl` ``): Tailwind 4 scans source text, unknown classes are not generated. Write full class names.
- **Do not reorder or renumber `SPECS` in `src/questions/index.ts`**, and do not touch ids: positions are persisted ids. Door files keep their names and exports.
- **Do not keep the old custom `Answer`/`Body` code "just in case".** Delete dead helpers, but do not touch doors 2, 7, 8.
- **Do not edit files outside Owns** (`index.tsx`, `QuestionScreen.tsx`, `config.ts`, `quizState.ts`), even to reuse a class or fix a stale comment.
- Comments must ADD value: only a non-obvious constraint, invariant or why. Everything in this change needs none, except possibly one Danish line in `Video.tsx` that the prompt is hidden until `onEnded` (it never appears if the clip is skipped by showing the answer). Do not comment what code does.

## Verification

No tests (project rule). Run `npm run check`; it must pass. Then `npm run dev` (http://localhost:3000/julequiz/), reset the quiz (`m` → "Nulstil quiz") and open each migrated door, pressing Enter/space to reach the answer:

- 6, 9, 20: hint shows, correct letters ding and appear, wrong letters shake with the wrong sound; answer shows the word.
- 13, 21, 23: "MUSIKQUIZ!" with vinyl-stop sound; answer view: Start plays the snippet from `start`, stops at the right time, "Spil lidt mere" lengthens it, "Vis svar" plays from `answerStart` and shows song and artist. Check the network tab: tracks load from `/julequiz/audio/…` with 200 (not 404, not doubled base). Background music is dimmed.
- 18, 22, 24: prompt, then the cropped poster; clicking it shows the full poster.
- 11, 14, 15, 17, 19: clip autoplays with background dimmed, prompt fades in over the dimmed clip after it ends, caption below where set, answer view plays the answer clip/image/audio and shows its text (door 17's "Ingenting (en kat)" and door 19's "7" now appear immediately; accepted). Door 15's portrait clip must fit the screen height.
- Doors 2, 7, 8 still work as before. Finishing all doors still triggers the finale.

Also confirm `git status` shows only Owns paths.

## Autonomous decisions

- `MusicBox.track` receives an already-wrapped URL and the `Music` renderer calls `asset()` → rejected: `MusicBox` calling `asset()` itself (the master plan says renderers wrap).
- Music files renamed to kebab-case on move → rejected: keeping names with spaces (risk of unencoded-URL failures in `use-sound`/Howler; `Valdes Jul.mp3` is only played through `<audio>`).
- All five tracks moved, though doors use three → rejected: moving only the used ones (the task says the five).
- Video box sized `h-[55vh] max-w-250 object-contain` instead of per-door widths → rejected: a `width` field on the type (not in the pinned contract); door 15 is portrait.
- Video overlay prompt fixed `text-5xl` → rejected: `textSize(prompt)` (8xl would overflow the clip for short prompts).
- Door 15's "Hjemmevideo" label kept as `caption` → rejected: dropping it.
- Door 17's answer text is a plain `Slide` text shown immediately → rejected: a delayed-reveal option on `Slide`.
- PosterReveal `alt={prompt}` → rejected: keeping the literal "Film".
- Renderer files carry no `"use client"` (like `Standard.tsx`) → rejected: adding the directive, because they are only imported from client modules.
