# Forudindlæs alle medier ved start

> Status: in progress — claude/tender-tesla-33pbsv

## Goal

At quiz start (when `QuizBoard` mounts), download every image, video and audio file the pack's doors
and practice questions use — question side and answer side — plus the sound effects an open door
plays, into in-memory Blobs. Once a file is loaded, everything that shows or plays it uses its
`blob:` URL, so opening a door makes no network request at all. The footer shows the progress.
Today only the answer's media are preloaded, and only while that door is open (`MediaPreload`).

## Out of scope

- Background/finale music (`quiz.music.*`) and the board's `ding`/`wrong2` sounds in
  `src/pages/index.tsx`: `use-sound` already downloads them when `QuizBoard` mounts. Do not touch them.
- No retry, no error message for failed files, no blocking loading screen, no service worker, no
  HTTP-cache warming, no revoking of blob URLs.
- No changes to `asset()` in `src/asset.ts`, `Stage`, `decor.tsx`, or any quiz question file.

## Decisions made

- Mechanism → `fetch` each file, store `URL.createObjectURL(blob)` in a module-level map, and
  resolve URLs through it. ~200 MB RAM for jul-2025 is accepted.
- While loading → the board is usable immediately; the footer shows `Henter medier <done> af
  <total>`, then `Medier klar` once every file has settled. A door opened before its file is
  loaded uses the network URL, as today.
- Failed file (network error or non-2xx) → silently counted as settled and left unmapped, so its
  network URL is used. No message, no retry.
- Sound effects → yes: preload `efek.mp3`, `wrong2.mp3`, `swoosh2.mp3` (QuestionScreen),
  `vinyl-stop.mp3` (Music), `yoshi-tongue.mp3` (GuessThatCat) the same way.
- Order → sound effects, then practice questions, then questions in file order; 4 downloads at a
  time.
- `MediaPreload` (hidden elements while a door is open) is deleted; the start preload replaces it.

## Architecture facts (verified)

- `src/asset.ts` `asset(path)` prefixes the base path. It is imported by `src/pages/_layout.tsx`, a
  **server component**.
- `src/quizzes/index.ts` calls `toQuestion` at module evaluation (eager glob), so anything computed
  in `toQuestion` is fixed before any download starts. `LoadedQuiz` has `questions` (file order,
  before shuffling) and `practice`.
- `src/questionTypes/index.tsx`: `toQuestion` builds `preload` from **answer side only**, already
  passed through `asset()`, and passes `track={asset(spec.track)}` to `MusicBody`/`MusicAnswer`.
  The `switch` has no `default` on purpose.
- `src/types.ts`: `Question.preload: string[]` (required); custom spec has `preload?: string[]`.
- Media renderers calling `asset()` at render time: `SlideView` (`src/questionTypes/Standard.tsx`,
  video/image/audio), `VideoBody` (`Video.tsx`), `PosterBody`/`PosterAnswer` (`PosterReveal.tsx`).
  `GuessThatCat` calls `asset()` inside `getCatimgSrc`, used only in a state initializer and setter.
- `MusicBox` and `MusicAnswer` (`src/components/MusicBox.tsx`) play the track with
  `useSound(props.track, …)` (Howler, Web Audio, XHR). Howler picks the codec from the URL's file
  extension; a `blob:` URL has none, and without the `format` option Howler fails with "No codec
  support for selected audio sources" (`node_modules/howler/src/howler.core.js:673-700`).
  `use-sound`'s `HookOptions` is `T = any`, so `format` type-checks.
- `src/components/QuestionScreen.tsx:21-23` uses `useSound` for `efek`, `wrong2`, `swoosh2`, and
  line 77 mounts `<MediaPreload urls={props.question.preload} />`. Nothing else reads `preload`.
- `Music.tsx` plays `vinyl-stop.mp3` via `<audio src={vinylStop} autoPlay />`; `GuessThatCat.tsx`
  plays `yoshi-tongue.mp3` via `<audio>`. `yoshi-tongue.mp3` is 4014 bytes, so Vite may inline it as
  a `data:` URL.
- `15-trille.tsx` uses an audio path with a fragment: `…/Valdes Jul.mp3#t=00:00:50` (space in name).
- `src/components/board/Footer.tsx`: `<footer>` with `justify-between`, a left group (door count +
  bar) and the settings button.
- The app runs in StrictMode in dev (effects run twice; see the comment at `index.tsx:206`).

## Implementation steps

1. **Create `src/mediaCache.ts`** (no `"use client"` needed; it is only imported by client code):
   - `const blobUrls = new Map<string, string>()` keyed by full URL **without** fragment, and
     `const loads = new Map<string, Promise<void>>()`.
   - `withoutFragment(url)`: the part before the first `#`.
   - `load(url)`: return the existing promise from `loads`, or create one:
     `fetch(url)` → if `res.ok`, `blobUrls.set(url, URL.createObjectURL(await res.blob()))`; any
     rejection is caught and swallowed. Store it in `loads`.
   - `export const preloadMedia = async (urls: string[], onProgress: (done: number, total: number)
     => void)`: drop URLs starting with `data:`, map through `withoutFragment`, dedupe keeping first
     order; call `onProgress(0, total)`; run 4 workers that `shift()` from the shared queue, `await
     load(url)`, then `onProgress(++done, total)`.
   - `export const cachedUrl = (url: string): string`: look up `withoutFragment(url)`; if mapped,
     return the blob URL **plus the original fragment** (`blob + url.slice(base.length)`), else
     `url` unchanged.
   - `export const useCachedUrl = (url: string) => useState(() => cachedUrl(url))[0]`.
   - `useAsset` with overloads `(path: string): string` and `(path: string | undefined): string |
     undefined`, returning `useState(() => path === undefined ? undefined :
     cachedUrl(asset(path)))[0]`.
   - `export const fileExtension = (path: string): string`: lower-cased extension of the path with
     `?query` and `#fragment` removed (`"mp3"` for `…/Valdes Jul.mp3#t=…`).
2. **`src/types.ts`**: no shape change. `Question.preload` now means: plain paths (`/quizzes/…`, not
   through `asset()`) of every media file the door uses on either side.
3. **`src/questionTypes/index.tsx`**: build `preload` as plain paths, no `.map(asset)`:
   standard `[...slideMedia(spec.question), ...slideMedia(spec.answer)]`; wordPuzzle `[]`; music
   `[spec.track]`; posterReveal `[spec.cropped, spec.full]`; video `[spec.video,
   ...slideMedia(spec.answer)]`; custom `spec.preload ?? []`. Pass `track={spec.track}` (plain) to
   `MusicBody` and `MusicAnswer`. Remove the now unused `asset` import.
4. **Renderers resolve once per mount** with `useAsset` (all hook calls at the top, before any
   early return or JSX branch):
   - `Standard.tsx` `SlideView`: `const video = useAsset(slide.video)`, same for `image` and
     `audio`; use them as `src`. Keep the existing `!== undefined` conditions on `slide.*`.
   - `Video.tsx` `VideoBody`: `src={useAsset(video)}` value taken at the top.
   - `PosterReveal.tsx`: `PosterBody` resolves `cropped` at the top (before the `revealed`
     branch); `PosterAnswer` becomes a block-bodied component resolving `full`.
   - `MusicBox.tsx`: in both `MusicBox` and `MusicAnswer`, `const src = useAsset(props.track)` and
     `useSound(src, { format: [fileExtension(props.track)], …existing options })`.
   - `Music.tsx` `MusicBody`: `const vinyl = useCachedUrl(vinylStop)` → `<audio src={vinyl}>`.
     `MusicBody` becomes block-bodied.
   - `GuessThatCat.tsx`: `getCatimgSrc` returns `cachedUrl(asset(path))`; add `const mmlem =
     useCachedUrl(mmlemSFX)` with the other hooks, before `if (!visible) return`.
   - Remove `asset` imports that become unused.
5. **`QuestionScreen.tsx`**: resolve each sfx with `useCachedUrl` and call `useSound(url, { format:
   ["mp3"] })`. Delete the `<MediaPreload …/>` line and its import. Delete
   `src/components/MediaPreload.tsx`.
6. **`src/pages/index.tsx` (`QuizBoard`)**: import `efek.mp3`, `swoosh2.mp3`, `vinyl-stop.mp3`,
   `yoshi-tongue.mp3` (and reuse the existing `wrongSFX` import of `wrong2.mp3`). Add `const [media,
   setMedia] = useState({ done: 0, total: 0 })` and a mount-only effect:
   `let active = true;` build `urls` = the five sfx URLs (as imported, no `asset()`), then
   `[...quiz.practice, ...quiz.questions].flatMap((q) => q.preload.map(asset))`; `void
   preloadMedia(urls, (done, total) => { if (active) setMedia({ done, total }); })`; cleanup sets
   `active = false`. Pass `media={media}` to `Footer`.
7. **`Footer.tsx`**: add prop `media: { done: number; total: number }`. Between the left group and
   the settings button render a `<span>` (inherits the footer's text style): nothing when `total
   === 0`; `Henter medier {done} af {total}` while `done < total`; `Medier klar` otherwise.
8. **`CLAUDE.md`**: replace the sentence "Svarets billeder, video og lyd (`Question.preload`, udledt
   i `toQuestion`) forudindlæses skjult af `MediaPreload`, mens lågen er åben; en `custom`-låge
   angiver dem selv med `preload`." with: "Alle lågers og prøvespørgsmåls billeder, video og lyd
   (`Question.preload`: rå stier fra begge sider, udledt i `toQuestion`; en `custom`-låge angiver
   selv alle sine medier med `preload`) og lågens lydeffekter hentes som blobs ved start af
   `preloadMedia` i `src/mediaCache.ts`, mens footeren viser fremskridtet. Renderere opløser stier
   med `useAsset` (lydeffekter med `useCachedUrl`) én gang pr. montering, og `useSound` skal have
   `format`, fordi en `blob:`-URL ingen filendelse har." In the Medier section change "kører den
   gennem `asset()` fra `src/asset.ts` præcis én gang" to "kører den gennem `useAsset()` fra
   `src/mediaCache.ts`, som kalder `asset()` fra `src/asset.ts` præcis én gang", and "Kun
   håndskrevet JSX i en `custom`-låge kalder selv `asset()`" to "Kun håndskrevne komponenter til en
   `custom`-låge kalder selv `cachedUrl(asset(…))`".

## Traps

- **Do not call `asset()`/`cachedUrl()` directly in render for a `src`.** `VideoBody` re-renders
  when its clip ends (`ended` state); if the blob finished meanwhile, `src` flips from the network
  URL to the blob URL and the video reloads and autoplays again. Resolve once per mount with
  `useAsset`/`useCachedUrl` (`useState` initializer).
- **Do not make `asset()` consult the cache, and do not put hooks in `src/asset.ts`.** It is
  imported by the server component `_layout.tsx` (no `useState` in the server React build), and
  `toQuestion` calls happen at import time, before any blob exists.
- **Do not omit `format` on any `useSound` that may receive a blob URL** (MusicBox, MusicAnswer,
  QuestionScreen). Howler infers the codec from the extension; a `blob:` URL has none and the sound
  silently never loads (the music "Start" button stays disabled). Do not add `format` to the
  `useSound` calls in `src/pages/index.tsx`; they are out of scope.
- **Do not key the map with the fragment or drop it on lookup.** `Valdes Jul.mp3#t=00:00:50` must
  fetch once without `#t=…` and resolve to `blob:…#t=00:00:50` so playback still starts at 0:50.
- **Do not pass `asset()`-resolved URLs in `Question.preload`.** `index.tsx` applies `asset()` once
  when building the URL list; a second call gives `/julequiz/julequiz/…` (404).
- **Do not set `preload: undefined` or make `Question.preload` optional** (`exactOptionalPropertyTypes`),
  and do not add a `default` to the `toQuestion` switch.
- **Do not gate rendering on the progress** (no loading screen, no disabled doors). The board must
  stay usable while loading; the progress state lives only in `QuizBoard` and goes to `Footer`.
- **Do not use raw hex or palette classes** in the footer; the span inherits `text-mist`.
- Comments must add value, in Danish. Warranted: one above `useAsset`/`useCachedUrl` (why the URL
  is frozen per mount), one at the `format` option in `MusicBox.tsx` (blob URLs have no extension),
  and one on the `blobUrls` map (keyed without fragment). Nothing else needs a comment.

## Verification

No tests (the repo has none). `npm run check` must pass.

Then `npm run build && npm start` (http://localhost:8080/julequiz/?quiz=jul-2025) and drive it with
the preinstalled Playwright Chromium (`require('playwright')`, launch arg
`--autoplay-policy=no-user-gesture-required`; script in a scratch dir, not the repo):

1. Load the page; the footer shows `Henter medier … af …`, then `Medier klar` (wait up to 120 s).
2. After `Medier klar`, start recording requests. Open every door in turn: click the card, wait
   1.5 s, press Enter, wait 1.5 s, press Escape twice. Then press `p` and open both practice
   questions (Enter, then `1`). Expect **zero** requests whose URL contains `/quizzes/` or ends in
   `.mp3`/`.mp4`/`.mov`. Print any offending URLs.
3. On the door whose answer has `Valdes Jul.mp3` (find it by the answer text "Valdes Jul"), after
   Enter check the `<audio>` `src` starts with `blob:` and ends with `#t=00:00:50`, and that its
   `currentTime` is ≥ 50 once `loadedmetadata` fired.
4. On a music door, check the Start button becomes enabled (Howler loaded the blob) and console has
   no "No codec support" error. Also report any console errors seen during the run.

Headless Chromium may not decode H.264, so video playback itself is not asserted. Report the
script's output verbatim.
