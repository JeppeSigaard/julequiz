# Quiz packs: pack loading

> Status: merged — e3e2415

Branch `quiz-packs-pack-loading`, PR target `claude/vibrant-euler-3tsdtn` (NOT `main`: every push to `main` deploys to GitHub Pages). Diff against `origin/claude/vibrant-euler-3tsdtn`.

## Goal

Quizzes become packs discovered from `src/quizzes/<pack>/`. `?quiz=<pack>` picks one (default `jul-2025`); an unknown name shows a list of packs instead of the board. The 24 doors and all their media move into the `jul-2025` pack, and `shuffle`, `pointsPerQuestion`, `teamNames`, `doorWord`, `title` and `music` come from the pack. Saved state is kept per pack.

## Out of scope

- Snow, colours, title font (`pack-theme`; `Quiz` gets no `snow`/`titleFont`/`colors` yet; `<Snowfall>` stays as is).
- JSON/runtime-loaded questions; a pack picker beyond the unknown-pack list; UI translation (only door word and team names are per pack: "point", "(ingen)", "Vis svar" stay); a test framework; changing keyboard controls; new questions or packs; consolation points and fireworks stay global; more than two teams.
- Files outside Owns. Never edit `src/pages.gen.ts`. `src/pages/_layout.tsx` is NOT touched (favicon stays at `public/images/favicon.png`). `src/env.d.ts` is already `/// <reference types="vite/client" />`; leave it.

## Owns (hard boundary)

`src/types.ts`, `src/config.ts`, `src/quizzes/`, `src/questions/`, `src/questionTypes/`, `src/pages/index.tsx`, `src/components/QuestionScreen.tsx`, `src/components/GuessThatCat.tsx`, `src/components/MusicBox.tsx`, `src/components/ResetQuizSetting.tsx`, `src/quizState.ts`, `src/pages/_layout.tsx` (favicon path only, if it moves), `src/audio/`, `public/`, `CLAUDE.md`.

## Decisions made (settled by master plan; never re-open)

- Pack layout: `src/quizzes/<pack>/quiz.ts` default-exports a `Quiz`; `src/quizzes/<pack>/questions/NN-<slug>.tsx` each default-export one `QuestionSpec`; NN two-digit, filename order = authored order; pack name = folder name (kebab-case).
- Discovery: `import.meta.glob(..., { eager: true })` in one module `src/quizzes/index.ts`, globbing `./*/quiz.ts` and `./*/questions/*.tsx`. Not lazy.
- `Question.id` = question file basename without extension (`01-zwarte-piet`). Ids are persisted in `localStorage`; old saved states become invalid and `loadQuizState` returns `null` (quiz starts fresh). Accepted.
- Selection: `?quiz=<pack>`, else `DEFAULT_QUIZ` (`"jul-2025"`, in `src/config.ts`). Unknown name renders a plain list of packs as `?quiz=` links. No silent fallback.
- Saved state is per pack; `quizState.ts` takes the pack's questions as a parameter instead of importing `QUESTIONS`; reset clears only the current pack.
- Media per pack in `public/quizzes/<pack>/images|video|audio/`, referenced by absolute public URL (`/quizzes/jul-2025/images/…`), including the pack's background and finale music (moved out of `src/audio/`). Shared UI effects stay in `src/sfx/` as module imports.
- Every `public/` URL goes through `asset()` (`src/asset.ts`) exactly once: question data URLs are wrapped by the renderers (`SlideView`, `toQuestion`, etc.; already done), `Quiz.music` by `index.tsx`, `GuessThatCat` images by `GuessThatCat`. Never `asset()` an imported module (`../sfx/*.mp3`).
- Per-pack: `shuffle`, `pointsPerQuestion`, `music.background`, `music.finale`, plus `title`, `teamNames`, `doorWord`. `POINTS_PER_QUESTION` and `TEAM_NAMES` are removed from `config.ts`. `LIGHTNING_ROUND_POINTS` is already gone.
- Door count is derived (already true: `gridColumns`, `isFinished`); nothing may assume 24.
- `Quiz` type (pinned) — add to `src/types.ts` exactly these fields (the `snow`/`titleFont`/`colors` fields belong to `pack-theme`):
  `title: string; teamNames: [string, string]; doorWord: string; shuffle: boolean; pointsPerQuestion: number; music: { background: string; finale: string };`

## Architecture facts (verified against the worktree)

- Currently `src/questions/Question1..24.tsx` each `export const QuestionN: QuestionSpec = {...}`; `src/questions/index.ts` imports them, maps `toQuestion(spec, String(index+1))` to `QUESTIONS`. `toQuestion(spec, id)` is in `src/questionTypes/index.tsx` and needs no change.
- `src/pages/index.tsx` (client): imports `POINTS_PER_QUESTION, TEAM_NAMES` from config and `QUESTIONS`; imports `bgmusic`/`lightningRoundMusic` from `../audio/…` (lines 17-18) into `useSound`; `useState(QUESTIONS)`; mount effect calls `loadQuizState()`/shuffle then `setIsLoaded(true)`; save effect gated by `isLoaded` (comment must stay); h1 text `den store julequiz`; team names/points use the constants; `QuestionCard` gets `question={{ ...question, id: String(index + 1) }}` and `key={question.id}`; `<ResetQuizSetting />` in `SettingsMenu`; `<QuestionScreen question questionIndex onClose onAnswer>`.
- `src/components/QuestionScreen.tsx`: imports `TEAM_NAMES` (line 5), prints `Låge {props.questionIndex + 1}` (line 87) and `{TEAM_NAMES[0]}`/`[1]` (lines 116, 128).
- `src/quizState.ts`: `STORAGE_KEY = "julequiz-state-v1"`; `isCardArray`, `loadQuizState()` and validation use `QUESTIONS.length` and `QUESTIONS.map(q => q.id)`; `saveQuizState(state)`, `clearQuizState()`; all wrap storage in try/catch. `ResetQuizSetting` calls `clearQuizState()` then `window.location.reload()`.
- `src/components/GuessThatCat.tsx`: module-level `IMG_SOURCES` (9 `asset("/images/…-hero*.png")`) and `getCatimgSrc()`; props `from, to, className`. Used only by door 7 (`<GuessThatCat from={4000} to={6000} className="w-125 mx-auto" />`).
- `MusicBox.tsx` already takes one track as props and gets `asset(spec.track)` from `toQuestion`; it needs no change. `QuestionCard` needs no change.
- Door types: custom = 2, 7, 8 (files hold JSX, door 2 imports `../components/FoxChickenGrain`, door 7 `../components/GuessThatCat`, door 8 has a local `Answer`). All door files import `../types` (and some `../components/…`).
- Door data URLs use `/images/…`, `/video/…`, `/audio/…` (door 15: `"/audio/Valdes Jul.mp3#t=00:00:50"`; 13/21/23 `track`).
- `waku.config.ts` has basePath `/julequiz/`; page is statically prerendered (`dist/public`).
- Unreferenced by code: `public/images/spider.jpeg`, `public/audio/snowman.mp3`, `public/audio/jingle-bell-rock.mp3`, `src/audio/wintry-bossa-177917.mp3`, and `src/audio/Valdes Jul.mp3` (byte-identical to `public/audio/Valdes Jul.mp3`, md5 63b72ea1…, and nothing imports it).

## Implementation steps

Run every shell command as `cd /home/user/julequiz/.claude/worktrees/quiz-packs-pack-loading && …`.

### 1. Move media (`git mv` only; keep basenames)

```
mkdir -p public/quizzes/jul-2025/{images,video,audio} src/quizzes/jul-2025/questions
```
- `public/images/<f>` → `public/quizzes/jul-2025/images/<f>` for every f except `favicon.png`: babybox-hero.png, butler.webp, butler2.webp, cakey-hero2.png, carlita-hero.png, catrat-hero3.png, djcatnip-hero2.png, dutch1.jpg, dutchchristmas.jpeg, kittyfairy-hero.png, mercat-hero3.png, pandy-hero2.png, pickle.jpg, pillowcat-hero.png, poster-1-crop.webp, poster-1.webp, poster-2-crop.jpg, poster-2.jpg, poster-3-crop.jpeg, poster-3.jpeg, spider.jpeg (unused), spider.png, tryksen-1982.jpg, tunnel.png, ukraine.webp.
- `public/video/<f>` → `public/quizzes/jul-2025/video/<f>`: bertala-2.mp4, bertela.mp4 (unused), bertelq-2.mp4, bertelq.mp4 (unused), letgo.mp4, letgoansw.mp4, nothing-short.mp4, nothing.mp4, trille.mov, viersaasode.mp4. (Of these, `bertela.mp4` and `bertelq.mp4` are also unreferenced; move them anyway.)
- `public/audio/<f>` → `public/quizzes/jul-2025/audio/<f>`: `Valdes Jul.mp3`, christmas-lights.mp3, driving-home-for-christmas.mp3, last-christmas.mp3, plus unused jingle-bell-rock.mp3 and snowman.mp3.
- `src/audio/waiting-music-116216.mp3`, `src/audio/lightning-round.mp3` → `public/quizzes/jul-2025/audio/` (background / finale). Unused `src/audio/wintry-bossa-177917.mp3` → same folder.
- `git rm "src/audio/Valdes Jul.mp3"` (identical duplicate; its destination name collides with the public one). `src/audio/` is then empty and disappears; `public/images/` keeps only `favicon.png`; `public/video/` and `public/audio/` vanish.
- `public/robots.txt` stays.

### 2. Move doors

`git mv src/questions/QuestionN.tsx src/quizzes/jul-2025/questions/<new>` with (N → new): 1 01-zwarte-piet, 2 02-fox-chicken-grain, 3 03-jullerup-faergeby, 4 04-ukraine-pynt, 5 05-juletrae-belgien, 6 06-mistelten, 7 07-gabby-kat, 8 08-husnisse, 9 09-pyntegran, 10 10-syltet-agurk, 11 11-bertel, 12 12-juletestamentet, 13 13-last-christmas, 14 14-vi-er-saa-soede, 15 15-trille, 16 16-kartofler, 17 17-pakken, 18 18-plakat-1, 19 19-letgo, 20 20-braendte-mandler, 21 21-driving-home, 22 22-plakat-2, 23 23-christmas-lights, 24 24-plakat-3 (all `.tsx`). Then `git rm src/questions/index.ts`.

In each moved file: change `export const QuestionN: QuestionSpec = {` to `const question: QuestionSpec = {` and append `export default question;` after the closing `};`. Fix relative imports (`../types` → `../../../types`, `../components/X` → `../../../components/X`). Door 7: pass the images, as public paths, to `GuessThatCat`: `images={[...]}` with the 9 URLs `/quizzes/jul-2025/images/{babybox-hero,cakey-hero2,carlita-hero,catrat-hero3,djcatnip-hero2,kittyfairy-hero,mercat-hero3,pandy-hero2,pillowcat-hero}.png` (the same 9 as the old `IMG_SOURCES`, same order). Change nothing else in the doors.

Rewrite media URLs in the doors: `sed -i 's#"/images/#"/quizzes/jul-2025/images/#g; s#"/video/#"/quizzes/jul-2025/video/#g; s#"/audio/#"/quizzes/jul-2025/audio/#g' src/quizzes/jul-2025/questions/*.tsx`. Afterwards `grep -rnE '"/(images|video|audio)/' src` must print only the `_layout.tsx` favicon line (`asset("/images/favicon.png")`), which is correct.

### 3. Types and config

- `src/types.ts`: add the `Quiz` type above (no other change).
- `src/config.ts`: replace the whole content with `export const DEFAULT_QUIZ = "jul-2025";`.

### 4. `src/quizzes/jul-2025/quiz.ts`

Default export `const quiz: Quiz` with `title: "den store julequiz"`, `teamNames: ["Hold 1", "Hold 2"]`, `doorWord: "Låge"`, `shuffle: true`, `pointsPerQuestion: 100`, `music: { background: "/quizzes/jul-2025/audio/waiting-music-116216.mp3", finale: "/quizzes/jul-2025/audio/lightning-round.mp3" }`. Import `type Quiz` from `../../types`.

### 5. `src/quizzes/index.ts`

- `import.meta.glob<{ default: Quiz }>("./*/quiz.ts", { eager: true })` and `import.meta.glob<{ default: QuestionSpec }>("./*/questions/*.tsx", { eager: true })`.
- Derive the pack name and question id from each path with a regex such as `/^\.\/([^/]+)\/questions\/([^/]+)\.tsx$/` (and `/^\.\/([^/]+)\/quiz\.ts$/`); the id is group 2.
- Sort the question entries by id with a plain comparison (`a < b ? -1 : 1`, not `localeCompare`) so order is the filename order.
- Export `type LoadedQuiz = Quiz & { name: string; questions: Question[] }` and `export const QUIZZES: Map<string, LoadedQuiz>` built from every pack that has a `quiz.ts`; `questions` = that pack's sorted entries mapped through `toQuestion(spec, id)` (import from `../questionTypes`). Packs sorted by name.
- A Map (not a plain object) so `?quiz=constructor` is unknown rather than a prototype hit.

### 6. `src/quizState.ts`

- `loadQuizState(pack: string, questions: Question[])`, `saveQuizState(pack, state)`, `clearQuizState(pack)`; replace `QUESTIONS` with the `questions` parameter in `isCardArray` (give it the length as an argument) and the id checks. Remove the `./questions` import; `import type { Question } from "./types"`.
- Key: `` `julequiz-state-v2:${pack}` `` (function `storageKey(pack)`). Keep the `questionIds` comment and the try/catch wrappers; no top-level storage access.

### 7. `src/components/ResetQuizSetting.tsx`

Add prop `pack: string` (`FunctionComponent<{ pack: string }>`), call `clearQuizState(props.pack)`. The Danish text stays.

### 8. `src/components/QuestionScreen.tsx`

Remove the `TEAM_NAMES` import; add props `doorWord: string` and `teamNames: [string, string]`; use `{props.doorWord} {props.questionIndex + 1}` and `props.teamNames[0]`/`[1]`.

### 9. `src/components/GuessThatCat.tsx`

Delete `IMG_SOURCES`; add prop `images: string[]` (public paths). `getCatimgSrc(images)` picks a random entry and returns `asset(path)` (return `undefined` when the entry is missing, since `noUncheckedIndexedAccess`); both call sites pass `props.images`. `mmlemSFX` stays an import and is not wrapped.

### 10. `src/pages/index.tsx`

- Remove imports of `../config` constants, `../questions`, `../audio/*`. Import `DEFAULT_QUIZ` from `../config`, `QUIZZES, type LoadedQuiz` from `../quizzes`, `asset` from `../asset`.
- Rename the existing component to `QuizBoard` taking `{ quiz: LoadedQuiz }`; keep all its hooks and logic. Changes inside it:
  - `useState<Question[]>(quiz.questions)`; `useSound(asset(quiz.music.background), { loop: true })` and `useSound(asset(quiz.music.finale), { loop: true })`.
  - mount effect: `loadQuizState(quiz.name, quiz.questions)`; restore via `quiz.questions.find(...)`; else `setQuestions(quiz.shuffle ? shuffleQuestions(quiz.questions) : quiz.questions)`. Keep the `isLoaded` gate and its comment; `saveQuizState(quiz.name, {...})`.
  - h1 text `{quiz.title}`; team names `quiz.teamNames[0]`/`[1]`; points `* quiz.pointsPerQuestion`.
  - `<ResetQuizSetting pack={quiz.name} />`; `<QuestionScreen … doorWord={quiz.doorWord} teamNames={quiz.teamNames} />`.
- New default export `HomePage`: `const [packName, setPackName] = useState<string | null>(null)`; an effect with `[]` sets it to `new URLSearchParams(window.location.search).get("quiz") ?? DEFAULT_QUIZ`. Render:
  - `packName === null` (prerender and first client render): `<div className="bg-green-950 h-screen" />`, the board's page background, so nothing depends on the URL.
  - `QUIZZES.get(packName)` undefined: a plain unknown-pack page (Danish): heading "Ukendt quiz: {packName}", text "Vælg en quiz:", and a `<ul>` with one `<a href={`?quiz=${name}`}>{name}</a>` per `[...QUIZZES.keys()]`. Plain Tailwind on a light background; no styling work beyond readable.
  - else `<QuizBoard key={packName} quiz={quiz} />`.
- Components with hooks must not be conditional: that is why `QuizBoard` is a separate component mounted only once the pack is known.

### 11. `CLAUDE.md`

Update what is now false, in Danish: "24 låger" in Projektet → "låger" per pack; the `index.tsx` bullet (pack resolved after mount from `?quiz=`, unknown name lists packs, state keyed per pack); the points bullet (`POINTS_PER_QUESTION`/`TEAM_NAMES` now from the pack's `quiz.ts`; `QuestionScreen` takes `doorWord`/`teamNames` as props); the Spørgsmål section (`src/quizzes/<pack>/questions/NN-<slug>.tsx`, default export, id = filnavn, `quiz.ts`, glob in `src/quizzes/index.ts`, copy a pack folder to make a new quiz; `GuessThatCat` takes `images`); the Medier section (`public/quizzes/<pack>/images|video|audio/`, incl. baggrunds- og afslutningsmusik; favicon stays in `public/images/`; `src/audio/` is gone, `src/sfx/` stays). Remove the sentence that `src/audio/` holds background music.

## Traps

- **Do not read `window.location` or `localStorage` during render or in a `useState` initializer.** The page is prerendered; the first client render must equal the server HTML or hydration breaks. Read both only in effects; the placeholder `div` for `packName === null` is what keeps the HTML URL-independent.
- **Do not call `useSound` (or any hook) in `HomePage` with pack data, or conditionally.** The URLs are unknown before the pack resolves and hooks cannot be conditional; hence `QuizBoard` mounts only after resolution. Keep `key={packName}`.
- **Do not remove the `isLoaded` gate on the save effect.** Without it the first commit overwrites the saved quiz with defaults (and StrictMode's second mount then loads the defaults).
- **Do not `asset()` imported modules (`../sfx/*.mp3`), and do not `asset()` a URL twice.** Vite already prefixes module URLs; `/julequiz/julequiz/…` 404s. `Quiz.music` is `asset()`ed in `index.tsx` only; door-data URLs are `asset()`ed in the renderers only; `GuessThatCat` wraps its own images, so door 7 passes bare public paths.
- **Do not leave any `import … from "../audio/…"`.** The folder is gone and the build breaks. Check `grep -rn "src/audio\|\.\./audio" src` is empty.
- **Do not use `localeCompare` or object-key order for question order.** Glob key order is not a contract; sort by filename explicitly, otherwise `10-` could precede `02-`.
- **Do not use `cp`/`rm` for media or doors.** Use `git mv` so history follows. The one exception is the duplicate `src/audio/Valdes Jul.mp3` (`git rm`).
- **Do not rename media files.** Door 15's `"…/Valdes Jul.mp3#t=00:00:50"` keeps the space and fragment; renaming loses the audio.
- **Do not use `undefined` for optional props** (`exactOptionalPropertyTypes`); omit instead.
- **Do not store pack state under the old key `julequiz-state-v1` or share one key.** A shared key lets pack A's reset or save clobber pack B; the validation also rejects foreign ids and silently wipes the other pack.
- **Do not edit `src/components/QuestionCard.tsx`, `SettingsMenu.tsx`, `WordPuzzle.tsx`, `FoxChickenGrain.tsx`** (outside Owns); `QuestionCard` keeps getting `id: String(index + 1)`.
- **Do not edit `src/pages.gen.ts`**; Waku regenerates it.
- Comments must ADD value: only a non-obvious constraint, invariant, why, or corner case; never what the code does. Spots that warrant one (Danish, one line each): the `packName === null` placeholder (page prerenders without the URL) and, in `src/quizzes/index.ts`, why questions are sorted explicitly. Keep the existing `isLoaded` and `questionIds` comments. Everything else needs none.

## Verification

No tests (project has none; none are added). Run:

1. `npm run check` must pass.
2. After the build, `grep -c "den store julequiz" dist/public/index.html` must be `0` (prerender does not depend on the pack).
3. `npm run dev`, then at `http://localhost:3000/julequiz/`:
   - `/julequiz/` and `/julequiz/?quiz=jul-2025`: same board with 24 doors, title "den store julequiz", team names "Hold 1"/"Hold 2", doors titled "Låge N". Press `m` > "Nulstil quiz" first for a fresh board. Open at least doors 1 (image), 7 (cat appears with random jul-2025 image), 13 (music plays), 15 (video, then answer audio) and 19 (video); background music starts on clicking the title, and the finale music plays when every door is answered.
   - `/julequiz/?quiz=nope` and `?quiz=`: the list with a `jul-2025` link (works, no board).
   - Reload mid-quiz: state restored. In devtools, the key is `julequiz-state-v2:jul-2025`; reset removes only that key.
   - Temporary pack: `cp -r src/quizzes/jul-2025 src/quizzes/tmp-three`, delete all but three files in its `questions/`, open `?quiz=tmp-three`: three doors, finishing them triggers fireworks and finale music; the list at `?quiz=nope` shows both packs. Delete `src/quizzes/tmp-three` and its saved key before finishing; `git status` must show nothing for it.
4. Network tab: no 404 for any `/julequiz/quizzes/jul-2025/…` file and none for `/julequiz/images/favicon.png`.
5. `git status`: the media and doors show as renames (`R`), `src/audio/`, `src/questions/` gone. Do not commit; the caller does.

## Autonomous decisions

- Pack-not-yet-resolved render: an empty `bg-green-950` div, rejecting a "Loading" text or rendering the default pack during prerender (which would make the HTML URL-dependent).
- Resolved board lives in a new inner component `QuizBoard` in `index.tsx`, rejecting a new file or conditional hooks.
- Unknown-pack page is inline in `index.tsx`, rejecting a new component file.
- `QUIZZES` is a `Map`, rejecting a plain object (prototype keys like `constructor`).
- Storage key `julequiz-state-v2:<pack>`, rejecting a reused `v1` prefix; the orphaned v1 entry is left alone, rejecting a migration or cleanup.
- Door files use `const question: QuestionSpec` + `export default question;`, rejecting `export default {…} satisfies QuestionSpec` (larger diff in custom doors).
- Slugs are ASCII (`faergeby`, `braendte`, `soede`), rejecting Danish letters in filenames (CLAUDE.md: filenames are English).
- Duplicate `src/audio/Valdes Jul.mp3` is `git rm`ed rather than moved: it is byte-identical to the public copy and would collide; the other unused media (`spider.jpeg`, `snowman.mp3`, `jingle-bell-rock.mp3`, `bertela.mp4`, `bertelq.mp4`, `wintry-bossa-177917.mp3`) are moved, not deleted.
- Media basenames are kept unchanged, rejecting tidy renames (door 15 depends on the space in `Valdes Jul.mp3`).
- `MusicBox.tsx`, `src/questionTypes/` and `_layout.tsx` are not changed: they already match (`track` is `asset()`ed in `toQuestion`; favicon stays).
- `Quiz.title` is applied only to the h1 button text, rejecting `document.title` (layout is a server component and is not in this task's scope).
- Packs without questions are not guarded against, rejecting extra validation the task did not ask for.
