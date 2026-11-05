# Quiz packs: spørgsmålstyperne standard og custom

> Status: merged — 6c1d250
> Branch: `quiz-packs-question-types`, base `claude/vibrant-euler-3tsdtn` (diff against `origin/claude/vibrant-euler-3tsdtn`; never `main`)

## Goal

Questions are authored as a `QuestionSpec` instead of a hand-built rendered `Question`. One function,
`toQuestion(spec, id)`, turns a spec into the existing `Question`, so the board and `QuestionScreen`
are untouched. Two spec types exist after this task: `standard` (shared layout, no Tailwind in the
door file) and `custom` (today's JSX passed through unchanged). Doors 1, 3, 4, 5, 10, 12, 16 become
`standard`; the other 17 become `custom`.

## Owns (hard boundary)

`src/types.ts`, `src/questionTypes/`, `src/questions/`. Nothing else may be edited. Sibling task
`dynamic-board` is running now and owns `src/pages/index.tsx`, `src/components/QuestionScreen.tsx`,
`src/config.ts`, `src/env.d.ts`. Do not edit CLAUDE.md, `src/components/`, `src/quizState.ts`, `public/`.
Do not rely on `import.meta.glob` or vite/client types.

## Out of scope

- The other four types (`wordPuzzle`, `music`, `posterReveal`, `video`): task `interactive-types`. Doors 6, 9, 11, 13, 14, 17-24 stay `custom` here, JSX unchanged. Do NOT add those union members.
- Moving files or media (`pack-loading`); `index.tsx`, `QuestionScreen.tsx`; CLAUDE.md; tests (project has none); changing scoring or keyboard controls; the `Quiz` type.

## Decisions made (settled by master plan)

- Authors write `QuestionSpec`; `toQuestion` in `src/questionTypes/index.tsx` produces `Question` (`{ id, body, answer, setVolume?, skip? }`, unchanged).
- `Question.id` is persisted in localStorage (`questionIds`). `toQuestion(spec, id)` takes the id from its caller; ids stay `"1"`-`"24"`.
- Media URLs in spec data are public paths (`"/images/x.jpg"`); the renderer wraps them with `asset()` from `src/asset.ts`. Authors never call `asset()` in `standard` doors. `custom` doors keep their existing `asset()` calls untouched.
- One renderer file per type in `src/questionTypes/`; `custom` passes `body` and `answer` through.
- Standard layout is normalised: one shared layout, font size picked from text length, no Tailwind classes in authored data. Migrated doors may look slightly different (accepted).
- Door → type: standard 1, 3, 4, 5, 10, 12, 16; custom everything else for now.
- Pinned contract in `src/types.ts` (add exactly these, keep `Question` as is):

```ts
export type Slide = { text?: string; note?: string; image?: string; video?: string; audio?: string };
type Common = { backgroundVolume?: number; skip?: boolean };
export type QuestionSpec = Common & (
  | { type: "standard"; question: Slide; answer: Slide }
  | { type: "custom"; body: ReactNode; answer: ReactNode }
);
```

  `backgroundVolume` maps to `Question.setVolume`. Only `standard` and `custom` members now; `interactive-types` appends the rest.
- Constraints: `exactOptionalPropertyTypes` (omit optional fields, never set `undefined`); UI text and comments Danish, identifiers English; never `asset()` an imported module URL; `npm run check` must pass; never commit to `main`; do not edit `src/pages.gen.ts`.

## Architecture facts (verified)

- `src/types.ts` today holds only `Question`. `src/questions/index.ts` imports `Question1..24` and exports `QUESTIONS` as an array in order; each file is `export const QuestionN: Question = { id: "N", ... }`.
- Consumers: `src/pages/index.tsx:37,133,142` and `src/quizState.ts:20-44` use `QUESTIONS` as `Question[]` with `.id`, `.setVolume`, `.skip`. Keep `QUESTIONS`'s type and export name.
- `src/asset.ts` exports `asset(path)`; prepends `import.meta.env.BASE_URL`.
- `setVolume` appears in doors 2 (0.5), 7 (0.7), 11 (0.1), 13 (0.05), 14 (0.05), 15 (0.1), 17 (0.3), 19 (0.4), 21 (0.05), 23 (0.05). No door uses `skip` today. Standard doors have none.
- Current standard-door content (copy text verbatim, Danish):
  - 1: q text "Hvad hedder denne hollandske figur?", image `/images/dutchchristmas.jpeg`; a text "Zwarte Piet", image `/images/dutch1.jpg`.
  - 3: q image `/images/tryksen-1982.jpg`, text `Hvad hedder "rammehistorien" med Jesper Klein i alle roller, som blev tilføjet til genudsendelsen af Jullerup Færgeby i 1982?`; a same image, text "Avisen".
  - 4: q image `/images/ukraine.webp`, text "Hvad pynter ukrainere juletræ med?", note "(også i fredstid)"; a image `/images/spider.png` only.
  - 5: q text "Danser man om juletræet i Belgien?"; a text "Nej", note "At danse om juletræet er en skandinavisk tradition, som mest dyrkes i Danmark."
  - 10: q text "Hvilken konserveret grøntsag skal tyske børn finde på juletræet for at få en gave?"; a image `/images/pickle.jpg`, text "En syltet agurk".
  - 12: q image `/images/butler.webp`, text `Hvad hedder den mystiske butler i "Juletestamentet" (1995)?`; a image `/images/butler2.webp`, text "Abrahamsen".
  - 16: q text "Hvem kunne ikke koge kartofler til Mortens Aften 2023?"; a text "Jeppe 🧔‍♂️".
- Door 5 bug: its answer JSX has a literal `,` between the two `<p>`s; the `standard` migration removes it by construction.
- Door 15 (`src/questions/Question15.tsx`) has `const Answer = () => {};` that is never used; delete it.
- `QuestionScreen` renders `question.body` / `question.answer` inside its own container; it centres content.

## Implementation steps

1. `src/types.ts`: add `Slide`, `Common`, `QuestionSpec` exactly as pinned above. Keep `Question` and the existing `ReactNode` import.
2. Create `src/questionTypes/Standard.tsx` (plain module, no `"use client"` needed, no hooks): export `SlideView({ slide }: { slide: Slide })`. Render, in order and each only if present: `video` (`<video src={asset(v)} autoPlay className="mx-auto w-250" />`), `image` (`<img src={asset(i)} className="mx-auto max-h-[60vh] max-w-250" />` — `mb-4` between blocks via a wrapping `<div className="grid gap-4 justify-items-center text-center">`), `audio` (`<audio src={asset(a)} autoPlay />`), `text` (`<p>` with size class from `textSize(text)`, `font-extrabold`), `note` (`<p className="text-3xl w-250 max-w-full">`). Add `textSize(text)`: length ≤ 30 → `text-8xl`; ≤ 80 → `text-5xl`; else `text-4xl`. The file holds only `SlideView` and `textSize`.
2b. Layout check against the old look: image above text (door 1 was text above image; the user accepted layout changes). Do not add a per-door override knob.
3. Create `src/questionTypes/index.tsx`: export `toQuestion(spec: QuestionSpec, id: string): Question`. Switch on `spec.type`: `standard` → `body: <SlideView slide={spec.question} />`, `answer: <SlideView slide={spec.answer} />`; `custom` → `body: spec.body`, `answer: spec.answer`. Build the result with `{ id, body, answer }` and add `setVolume: spec.backgroundVolume` and `skip: spec.skip` only when defined (conditional spread `...(spec.backgroundVolume !== undefined && { setVolume: spec.backgroundVolume })`). Make the switch exhaustive (no `default`), so `interactive-types` gets a compile error for the types it adds.
4. Migrate doors 1, 3, 4, 5, 10, 12, 16 in `src/questions/QuestionN.tsx`: file becomes `import { type QuestionSpec } from "../types"; export const QuestionN: QuestionSpec = { type: "standard", question: {...}, answer: {...} };` using the content table above. File extension stays `.tsx`, filenames and export names unchanged (the next task renames them). No `asset` import, no `id`.
5. Wrap every other door (2, 6, 7, 8, 9, 11, 13, 14, 15, 17-24): change the type annotation to `QuestionSpec`, delete the `id:` line, add `type: "custom",` first, rename `setVolume:` to `backgroundVolume:` (same value). Leave `body`/`answer` JSX, helper components and imports byte-for-byte otherwise. In door 15 also delete `const Answer = () => {};`.
6. `src/questions/index.ts`: keep the 24 imports; replace the array with `const SPECS: QuestionSpec[] = [Question1, ..., Question24];` and `export const QUESTIONS: Question[] = SPECS.map((spec, index) => toQuestion(spec, String(index + 1)));`. Import `toQuestion` from `../questionTypes` and the types from `../types`. The array order is the id source; do not reorder.

## Traps

- **Do not rename `setVolume` in `Question` or touch consumers.** `index.tsx` reads `question.setVolume`; only the spec field is `backgroundVolume`. Map it in `toQuestion` only.
- **Do not pass `undefined` for optional fields in `toQuestion`.** `exactOptionalPropertyTypes` rejects `setVolume: undefined`; omit via conditional spread.
- **Do not change ids.** `"1"`-`"24"` are persisted by `quizState.ts`; id comes from array position + 1, not from the spec. Reordering the array would silently remap ids.
- **Do not "tidy" custom doors.** Doors 6, 9, 11, 13-15 etc. share helper components and `asset()` calls; only the annotation, `id`, `type`, volume key (and door 15's dead `Answer`) change. Doors 2, 7, 8 stay custom permanently.
- **Do not wrap `asset()` around anything in `standard` data**, and do not leave `asset()` out of `SlideView`: a bare `/images/x` 404s under basePath `/julequiz/`.
- **Do not edit `src/components/*`** (not owned), even to reuse a class; and do not add `interactive-types` union members.
- Comments must ADD value: only non-obvious why/invariant. Candidate spots: the conditional spread in `toQuestion` (optional-property rule) and the exhaustive switch (why no `default`). Everything else needs no comment.

## Verification

No tests (project has none). Run `npm run check` (must pass). Then `npm run dev` at `http://localhost:3000/julequiz/`, reset the quiz (`m` → "Nulstil quiz") and open every door 1-24: each opens and reveals its answer (Enter). Specifically: doors 1, 3, 4, 5, 10, 12, 16 show text and images with the shared layout and no stray `,` in door 5's answer; door 4's answer shows only the spider image; doors 2, 7, 11, 13, 14, 15, 17, 19, 21, 23 still dim the background music; door 15 still plays and reveals. Reload mid-quiz: the saved board order still restores (ids unchanged).

## Autonomous decisions

- `Slide.video`/`audio` are rendered by `SlideView` (autoplay) → rejected: ignoring them, since the pinned type allows them and `video` type reuses `Slide` for answers.
- Font size from three text-length thresholds (30/80 chars) in `Standard.tsx` → rejected: a per-slide size knob or a lookup per door.
- Image above text, note last, in every standard slide → rejected: preserving each door's old order via a layout option.
- Door files keep names `QuestionN.tsx` and export names → rejected: renaming to `NN-slug` now (belongs to `pack-loading`).
- Ids derived as `String(index + 1)` in `index.ts` → rejected: an `id` field on the spec (contract has none).
- `toQuestion` switch exhaustive with no `default` → rejected: a fallback branch that would hide missing types in `interactive-types`.
