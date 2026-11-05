# Prøverunde: to prøvespørgsmål uden point

> Status: in progress — claude/determined-fermi-8fwbrx

## Goal

Before the real quiz, the quiz master shows the room how a door works with a two-question practice
round: a super easy question, then a super hard one. They open in the normal door card (reveal,
then 1/2/Q), but they are not behind a door, never award points, are never saved, and do not
count toward the end screen. They are plain text question/answer, so the real doors' mix of
question types stays a surprise. The quiz master starts the round with the `P` key on the board,
or with a button in the settings menu (`M`).

## Out of scope

- No hint for `P` in `Footer` or anywhere else on the board.
- No persistence: practice state is never written to `localStorage`, and `quizState.ts` is not
  touched.
- No new question type, no change to `toQuestion`, no change to `decor.tsx`, `SettingsMenu.tsx`,
  `ResetQuizSetting.tsx` or the board components.
- No practice questions for any pack other than `jul-2025`.
- No "doesn't count" banner or other new UI inside the door card beyond the ribbon text.

## Decisions made

- How the round starts → both: the `P` key (`p`/`P`) on the board, and a "Start prøverunde" button
  in the settings menu.
- When `P` works → only when no door is open, no practice question is open and settings are
  closed. It works before the title click and on the end screen too.
- Flow → the questions play in file order. Giving the answer to anyone (1, 2, Q/X or the
  buttons) moves straight to the next practice question; after the last one the round ends and
  the board is back. Closing (X button, or Escape before the answer is revealed) ends the whole
  round at once.
- Points → never. The 1/2/Q buttons still play their sounds, so the room sees what happens.
- Ribbon → "Prøve 1" and "Prøve 2" (`Prøve ${index + 1}`), instead of `${doorWord} ${n}`.
- Where they live → per pack, as `src/quizzes/<pack>/practice/*.tsx`, each a `QuestionSpec`
  default export, same as `questions/`. A pack without a `practice/` folder has no practice
  round: `P` does nothing and the settings button is not rendered.
- The questions (Danish text exactly as written):
  1. `01-juleaften.tsx`: question text "Hvilken dato er juleaften?", answer text "24. december".
  2. `02-klorofyl.tsx`: question text "Hvilket grundstof sidder i midten af klorofylmolekylet, der
     gør juletræets nåle grønne?", answer text "Magnesium", answer note "Ét Mg-atom i hvert
     klorofylmolekyle."

## Architecture facts (verified)

- `src/quizzes/index.ts` loads `./*/questions/*.tsx` with `import.meta.glob` (eager), groups specs
  by pack with a regex, sorts by filename id (that comment must survive) and builds
  `LoadedQuiz = Quiz & { name; questions: Question[] }` via `toQuestion(spec, id)`.
- `src/pages/index.tsx` `QuizBoard`: `activeQuestionIndex` (line 47) drives the open door;
  `pickQuestion` (72) applies `question.setVolume` to `bgsound`; `handleAnswer` (91) records cards;
  the page keydown effect (188–206) toggles settings on `m` only when `activeQuestionIndex === null`
  and closes them on Escape; `QuestionScreen` is rendered at 303–315; `SettingsMenu` with
  `ResetQuizSetting` as child at 316–320.
- `src/components/QuestionScreen.tsx` takes `questionIndex` and `doorWord` and uses them only in the
  dialog `aria-label` (line 93) and the ribbon `<h2>` (line 141). `index.tsx` is its only caller.
  It holds `hasAnswered` in local state and registers its own `window` keydown listener.
- `src/components/ResetQuizSetting.tsx` (non-confirming branch, lines 29–38) is the layout to copy
  for a settings entry: `flex flex-col gap-4 items-start`, a `PillButton variant="dark"`, and a
  `text-[22px] font-semibold text-ink-soft` description.
- `src/quizzes/jul-2025/questions/01-zwarte-piet.tsx` is the `standard` spec file to copy (drop the
  images). `Slide` has optional `text`/`note`/`image`/`video`/`audio`.

## Implementation steps

1. **Load practice specs.** In `src/quizzes/index.ts`:
   - Add a second eager glob `import.meta.glob<{ default: QuestionSpec }>("./*/practice/*.tsx",
     { eager: true })`. The pattern must be a string literal (Vite requirement).
   - Turn the existing grouping loop into a function that takes a glob result and returns
     `Map<string, Question[]>` (pack → questions sorted by id, built with `toQuestion`). Use the
     regex `^\.\/([^/]+)\/[^/]+\/([^/]+)\.tsx$` so it serves both globs. Keep the existing Danish
     comment about glob order on the sort.
   - Extend `LoadedQuiz` with `practice: Question[]`, and set `questions` and `practice` from the
     two maps (`?? []` when a pack has none).
2. **Add the two spec files** `src/quizzes/jul-2025/practice/01-juleaften.tsx` and
   `02-klorofyl.tsx`, `type: "standard"`, with exactly the texts under Decisions made (easy one
   has no note; no images).
3. **Replace the ribbon props of `QuestionScreen`.** Remove `questionIndex` and `doorWord`; add
   `title: string`, used for both the `aria-label` and the `<h2>` text. In `index.tsx` pass
   `title={`${quiz.doorWord} ${activeQuestionIndex! + 1}`}` for doors.
4. **Practice state in `QuizBoard`** (`src/pages/index.tsx`):
   - `const [practiceIndex, setPracticeIndex] = useState<number | null>(null);`
   - `startPractice(index: number)`: if `quiz.practice[index]` is undefined → `endPractice()` and
     return; else `setPracticeIndex(index)` and `bgsound?.volume(question.setVolume ?? 1)`, so a
     lowered volume from the previous practice question never carries over and 0 is honoured.
   - `endPractice()`: `setPracticeIndex(null)` and `bgsound?.volume(1)`.
   - Render, right after the door's `QuestionScreen` block:
     `practiceQuestion && <QuestionScreen key={practiceQuestion.id} question={practiceQuestion}
     title={`Prøve ${practiceIndex! + 1}`} teamNames={quiz.teamNames}
     onAnswer={() => startPractice(practiceIndex! + 1)} onClose={endPractice} />`, where
     `practiceQuestion = practiceIndex !== null ? quiz.practice[practiceIndex] : undefined`.
     `onAnswer` ignores the team argument: nothing touches the card arrays or consolation points.
5. **Keyboard.** In the page keydown effect: change the `m` condition to also require
   `practiceIndex === null`. Add: on `p`/`P`, when `activeQuestionIndex === null &&
   practiceIndex === null && !settingsOpen`, call `startPractice(0)`. Add `practiceIndex` and
   `bgsound` to the effect's dependency array (the handler reads `bgsound` via `startPractice`).
   Also add `practiceIndex === null &&` to the door `glow` condition, so doors stop pulsing behind
   a practice card as they do behind a real door.
6. **Settings entry.** New `src/components/PracticeSetting.tsx` (`"use client"`), props
   `{ count: number; onStart: () => void }`, copying the `ResetQuizSetting` layout: `PillButton
   variant="dark"` "Start prøverunde", description "`{count}` prøvespørgsmål, der ikke giver
   point. Genvej: P." (so jul-2025 reads "2 prøvespørgsmål, …"); `index.tsx` passes
   `count={quiz.practice.length}`. In
   `index.tsx`, render it inside `SettingsMenu` before `ResetQuizSetting`, only when
   `quiz.practice.length > 0`, with `onStart={() => { setSettingsOpen(false); startPractice(0); }}`.
7. **CLAUDE.md.** In the `QuestionScreen` bullet, add that `p` starts the practice round (and that
   the settings menu has "Start prøverunde"); in "Quiz-pakker", add that
   `src/quizzes/<navn>/practice/*.tsx` holds the pack's practice questions (same `QuestionSpec`
   form, file order, no points, not saved). Danish, matching the surrounding style.

## Traps

- **Do not reuse `QuestionScreen` without `key={practiceQuestion.id}`.** Going from question 1 to
  2 keeps the same element type in the same spot, so React would keep the instance: `hasAnswered`
  would stay `true` and question 2 would open on its answer. The key forces a remount (which also
  replays the spring-open, which is wanted).
- **Do not route practice through `activeQuestionIndex` or `handleAnswer`.** Those indices are grid
  positions; any practice answer written into `team1Cards`/`team2Cards`/`noTeamCards` would award
  points, mark a real door and be saved by the save effect. Keep practice in its own state.
- **Do not add practice questions to `quiz.questions` with `skip: true`.** That would add a door
  to the grid, the saved `questionIds` and the shuffle. They belong only in `quiz.practice`.
- **Do not let `P` or `M` fire while a door or practice card is open.** `QuestionScreen` and the
  page handler both listen on `window`, so its `stopPropagation()` does not stop the page handler;
  the word puzzle takes letters as guesses. The gating in step 5 is the only protection.
- **Do not persist `practiceIndex`** or add it to the save effect's dependencies.
- **Do not pass `title` as `undefined` or keep `doorWord` "for compatibility".** `index.tsx` is the
  only caller; `exactOptionalPropertyTypes` is on.
- **Do not use raw hex, palette classes, `vw`/`vh` or `asset()`** in the new files; the practice
  specs have no media.
- Comments must ADD value: only a non-obvious why. The one spot that warrants a short Danish
  comment is the `key` on the practice `QuestionScreen` (remount so `hasAnswered` resets).
  Everything else needs none.

## Verification

No tests exist and none are added. Run `npm run check`; it must pass. Then run `npm run dev`
and check in a browser at http://localhost:3000/julequiz/ (Playwright is available):

1. On the board with nothing open, press `P`: card "Prøve 1" with "Hvilken dato er juleaften?".
   Enter reveals "24. december". Press `1`: sound plays, card "Prøve 2" opens on the question,
   not the answer. Enter reveals "Magnesium" with the note. Press `2`: the board is back, both
   plaques still show 0 points and the footer still shows 0 opened doors.
2. Press `P`, then Escape: the round ends at once (board back, no "Prøve 2").
3. Press `P`, reveal, Escape: back to the question; Escape again: round ends.
4. Press `M`, click "Start prøverunde": settings close and "Prøve 1" opens. While a practice card
   is open, `M` does not open settings.
5. Open a real door: ribbon still reads "Låge <n>"; pressing `P` there does nothing; answering
   still awards points as before.
6. Reload after a practice round: nothing changed in the saved state (scores, door order).
