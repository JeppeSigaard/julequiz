# Quiz state that survives refresh, plus a settings menu

> Status: in progress — quiz-state-settings

## Goal

Today every browser refresh reshuffles the 24 doors and wipes all points, so a
stray F5 during the party destroys the quiz. After this change the board order,
the doors each team has won, the doors nobody won and the bonus points are saved
in `localStorage` and restored on load. A settings overlay opens with the `m`
key. It is built as a shell that takes more items later, and its first item is a
"Nulstil quiz" button that clears the saved quiz and starts a fresh one.

## Out of scope

- Restoring `started` (snow, music, blinking doors) or the open door
  (`activeQuestionIndex`). Both always start as `false`/`null` after a load.
- Restoring anything inside an open door (word puzzle letters, fox/chicken game
  state, video position).
- Any settings item other than reset: no team names, volume or theme controls.
- Saving music state or trying to resume audio automatically.
- Tests, a test framework, or any new dependency.
- Refactoring the existing `index.tsx` logic beyond the steps below (e.g. the
  hard-coded `24`, the duplicate `timer`/`timerRef`, `QuestionScreen`'s
  hard-coded "Hold 1"/"Hold 2").

## Decisions made

- Storage → `localStorage`, one JSON value under the key `julequiz-state-v1`.
  It survives closing the browser; only the reset button clears it.
- What is saved → board order (as question ids), `team1Cards`, `team2Cards`,
  `noTeamCards`, `team1ConsolationPoints`, `team2ConsolationPoints`. Nothing else.
- After a load the board shows with doors and points restored, not started, no
  door open. The quizmaster clicks the title to start, exactly as today.
- Saved data that is unreadable or no longer matches `QUESTIONS` (wrong count,
  unknown id, wrong types) → ignored; a new shuffle starts as if nothing was saved.
- Hotkey → `m` (lowercase key value; also `M`), only while no door is open.
  While a door is open, `m` belongs to the door (the word puzzle uses it as a
  guess). `m` again or `Escape` closes the menu, as do a close button and a
  click on the backdrop. Ignore the key when Ctrl, Meta or Alt is held.
- Reset → two-step confirm inside the menu. First click on "Nulstil quiz"
  replaces it with "Ja, nulstil quizzen" and "Annuller". "Annuller" goes back.
  Closing the menu also cancels the pending confirm.
- After confirming → remove the saved value and call `window.location.reload()`.
  No in-place state reset.
- Extensibility → `SettingsMenu` is a presentational overlay shell that renders
  its `children`. Each future item is added as a child from `index.tsx`, where
  the quiz state lives. The reset item is its own small component.
- UI copy (Danish): menu heading "Indstillinger"; buttons "Nulstil quiz",
  "Ja, nulstil quizzen", "Annuller"; helper text under the first button:
  "Sletter point og lågernes rækkefølge og starter forfra."

## Architecture facts (verified)

- `src/pages/index.tsx` is the whole quiz as one `"use client"` component.
  State at lines 34–43; the mount effect that shuffles is at lines 124–126:
  `useEffect(() => { setQuestions(shuffleQuestions(QUESTIONS)); }, []);`.
- The page is `render: 'dynamic'` (`src/pages.gen.ts`), so `index.tsx` is
  server-rendered first and then hydrated. `window`/`localStorage` do not exist
  during the server render.
- Card arrays hold **grid positions** (index into the shuffled `questions`), not
  question ids. That is why the order must be saved with them.
- Every `Question` has a unique string `id` `"1"`–`"24"` (`src/questions/Question*.tsx`).
  In `index.tsx` the id is only overwritten on the copy passed to `QuestionCard`
  (`{ ...question, id: String(index + 1) }`), so `questions[i].id` is the original id.
- Window `keydown` listeners exist in `src/components/QuestionScreen.tsx:38-70`
  (Enter, Space, Escape, 1, 2, q, x; it calls `preventDefault` on every key) and
  `src/components/WordPuzzle.tsx:14-43` (every letter A–Z, Æ, Ø, Å). Both are only
  mounted while a door is open (`activeQuestion` truthy).
- Overlay styling to match: `QuestionScreen.tsx` uses
  `fixed ... inset ... z-40`, `bg-green-200 rounded-2xl shadow-2xl`, the
  `material-symbols-outlined` `close` icon, and the
  `font-['Mountains_of_Christmas',Serif]` heading font.
- Comments and commit messages are in Danish; identifiers and filenames English.
  `npm run check` (tsc + waku build) must pass. React Compiler is enabled, so do
  not add `useMemo`/`useCallback` by hand.

## Implementation steps

1. **Create `src/quizState.ts`** (no `"use client"` needed; it exports plain functions):
   - `export type SavedQuizState = { questionIds: string[]; team1Cards: number[]; team2Cards: number[]; noTeamCards: number[]; team1ConsolationPoints: number; team2ConsolationPoints: number; }`
   - `const STORAGE_KEY = "julequiz-state-v1";`
   - `export function loadQuizState(): SavedQuizState | null` — `localStorage.getItem`,
     `JSON.parse` inside `try/catch` (return `null` on any throw). Return `null`
     unless: `questionIds` is an array of strings with length `QUESTIONS.length`,
     every id exists among `QUESTIONS` ids and there are no duplicates; the three
     card arrays are arrays of integers in `0 … QUESTIONS.length - 1`; both point
     values are numbers. Import `QUESTIONS` from `./questions`.
   - `export function saveQuizState(state: SavedQuizState): void` — `setItem` with
     `JSON.stringify`, wrapped in `try/catch` that ignores errors (private mode/quota).
   - `export function clearQuizState(): void` — `removeItem`, same `try/catch`.

2. **Create `src/components/SettingsMenu.tsx`** (`"use client"`):
   props `{ onClose: () => void; children: ReactNode }`. Render a `fixed inset-0
   z-50` backdrop (`bg-black/50`) that calls `onClose` on click, centring a panel
   (`bg-green-200 rounded-2xl shadow-2xl p-10`, width around `max-w-xl w-full`)
   whose click does `stopPropagation`. Panel: heading "Indstillinger" in the
   Mountains of Christmas font, a close button top-right with the
   `material-symbols-outlined` `close` icon calling `onClose`, then `children`
   in a `flex flex-col gap-6` list. No key handling in this component (see step 4).
   Use `motion` for an entry animation only if you copy `QuestionScreen`'s exact
   pattern; otherwise none.

3. **Create `src/components/ResetQuizSetting.tsx`** (`"use client"`): local state
   `confirming` (boolean, starts `false`). Not confirming: a button "Nulstil quiz"
   and the helper text from Decisions. Confirming: "Ja, nulstil quizzen" (styled
   red, e.g. `bg-red-500 text-white`) and "Annuller". Confirm calls
   `clearQuizState()` then `window.location.reload()`. Because the component
   unmounts when the menu closes, closing cancels the confirm with no extra code.

4. **Edit `src/pages/index.tsx`**:
   a. Add state `const [isLoaded, setIsLoaded] = useState(false);` and
      `const [settingsOpen, setSettingsOpen] = useState(false);` next to the
      other state.
   b. Replace the shuffle effect (lines 124–126) with a load effect: call
      `loadQuizState()`. If it returns state, map `questionIds` to questions by
      looking each id up in `QUESTIONS`, then set `questions`, the three card
      arrays and both point values from it. Otherwise
      `setQuestions(shuffleQuestions(QUESTIONS))`. In both cases finish with
      `setIsLoaded(true)`. Dependency array `[]`.
   c. Add a save effect directly after it: `if (!isLoaded) return;` then
      `saveQuizState({ questionIds: questions.map((q) => q.id), team1Cards,
      team2Cards, noTeamCards, team1ConsolationPoints, team2ConsolationPoints })`.
      Dependencies: those six values plus `isLoaded`.
   d. Add a `keydown` effect on `window` (add/remove like `QuestionScreen.tsx:65-70`),
      dependencies `[activeQuestionIndex, settingsOpen]`:
      - return early if `event.ctrlKey || event.metaKey || event.altKey`;
      - `m`/`M` and `activeQuestionIndex === null` → `setSettingsOpen((open) => !open)`;
      - `Escape` and `settingsOpen` → `setSettingsOpen(false)`.
      Do not call `preventDefault`/`stopPropagation` for any other key.
   e. Render, after the `QuestionScreen` block:
      `{settingsOpen && (<SettingsMenu onClose={() => setSettingsOpen(false)}><ResetQuizSetting /></SettingsMenu>)}`.

5. Run `npm run check`; fix until it passes. Commit in Danish, e.g.
   "Gem quizzens tilstand ved genindlæsning og tilføj indstillingsmenu".

## Traps

- **Do not read `localStorage` in a `useState` initializer or during render.**
  The page is server-rendered (`render: 'dynamic'`): `localStorage` is undefined
  on the server, and even guarded with `typeof window`, the client's first render
  would differ from the server HTML and break hydration. Read it only inside the
  mount `useEffect` (step 4b), which replaces the existing shuffle effect.
- **Do not save without the `isLoaded` gate.** The save effect also runs on the
  first commit, with the initial unshuffled `QUESTIONS` and empty arrays. Without
  the gate it overwrites the saved quiz with defaults — and in React StrictMode's
  double-mount the second load then reads those defaults, so the quiz is lost
  with no error. The gate is the one place that deserves a short Danish comment
  explaining this.
- **Do not save or restore card arrays without the board order.** They are grid
  positions; restored against a new shuffle they silently mark the wrong doors
  as won. Always restore `questions` from `questionIds` in the same effect.
- **Do not store question objects or indices into `QUESTIONS`.** `body`/`answer`
  are JSX and do not serialize; indices break silently if `questions/index.ts` is
  reordered. Store `q.id` and map back through `QUESTIONS`.
- **Do not open the menu on `m` while a door is open, and do not copy
  `QuestionScreen`'s blanket `preventDefault()`.** The word puzzle treats `m` as
  a guess, and swallowing keys in the page-level handler would break door
  shortcuts and the browser's own keys.
- **Do not reset by setting state back to defaults.** The decision is clear +
  reload: it is the only way that is guaranteed to stop both music tracks,
  fireworks and timers. Do not call any setter before the reload either — a state
  change would trigger the save effect and write the old quiz back.
- **Do not add `"use client"`-only APIs to `quizState.ts` at module top level**
  (no `localStorage` access outside the functions). The module is imported by a
  server-rendered component.
- Comments must ADD value: only a non-obvious constraint, invariant, why, or
  corner case — never what the code does. The `isLoaded` gate (above) and, in
  `quizState.ts`, a one-liner that the cards are grid positions so `questionIds`
  must stay in sync are the only spots that warrant one. Everything else needs none.

## Verification

No new tests: there is no test setup, and the logic is small and visible on
read. Run `npm run check` and paste its output. Then, if possible, run
`npm run dev` and exercise in a browser (Playwright is preinstalled):

1. Fresh load (empty storage) → board is shuffled; storage key appears.
2. Give a door to Hold 1, one to "ingen", click Hold 2's name twice (+10) →
   refresh → same order, same doors greyed, points 100 / 10, not started, no door open.
3. Refresh again without changes → still identical (no reshuffle).
4. `m` on the board → menu opens; `m` → closes; `Escape` → closes; backdrop
   click → closes; close button → closes.
5. Open a door with a word puzzle, press `m` → no menu (guess handled by puzzle).
6. Menu → "Nulstil quiz" → "Annuller" → back to one button; close and reopen →
   one button. "Nulstil quiz" → "Ja, nulstil quizzen" → page reloads with a new
   shuffle and 0 / 0 points.
7. Put `"garbage"` in `julequiz-state-v1` → refresh → fresh shuffle, no crash.
