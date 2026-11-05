# Forudindlæs svarets medier

> Status: in progress — claude/great-galileo-zogw7j

## Goal

When the quizmaster opens a door, the question side is shown first; the answer side (Enter / "Vis
svaret") often holds a large image or video (answer videos in `jul-2025` are 15–27 MB). Today those
only start downloading when the answer is revealed, so the audience stares at an empty frame. While
a door is open, the answer's images, videos and audio must download in the background, so the
answer shows them immediately.

## Out of scope

- Preloading anything for doors that are not open (no board-level or whole-pack preload).
- Preloading the question side's own media (it is already on screen).
- Fetching media into Blobs / object URLs, service workers, `<link rel="preload">`, or React's
  `preload()` from `react-dom`.
- Any change to how renderers (`Standard.tsx`, `Video.tsx`, `PosterReveal.tsx`, `MusicBox.tsx`,
  `GuessThatCat.tsx`) display media, and any visual change to `QuestionScreen`.
- Adding `preload` to custom doors other than `07-gabby-kat.tsx`.

## Decisions made

- Video mechanism → a hidden, muted `<video preload="auto">` per answer video, which fills the
  browser's HTTP cache so the answer's own `<video>` starts from cache. No Blob fetching.
- Scope → answer images, videos **and audio**: `standard` and `video` answers' `slide.image`,
  `slide.video`, `slide.audio`; `posterReveal`'s `cropped` and `full` (both are on the answer side:
  the crop first, the full poster after a click); `music`'s `track`.
- Custom doors → `custom` specs get an optional `preload?: string[]` of plain `/quizzes/<navn>/…`
  paths; fill it in `src/quizzes/jul-2025/questions/07-gabby-kat.tsx` with the same nine image paths
  passed to `GuessThatCat`.
- Data shape → `Question` gets a required `preload: string[]` of URLs that have already been through
  `asset()`. The preload component decides element type by file extension.
- Lifetime → the hidden elements are mounted for the whole time the door is open (question side
  **and** answer side) and disappear when the door closes, so the browser keeps the buffered data
  while the answer plays.

## Architecture facts (verified)

- `Question` is defined in `src/types.ts:3-9` and constructed **only** in `toQuestion`
  (`src/questionTypes/index.tsx:10-75`); `src/quizzes/index.ts:37` calls it. So a new required
  field breaks no other construction site.
- `QuestionSpec` (`src/types.ts:15-24`) is `Common & (union)`; the `custom` member is
  `{ type: "custom"; body: ReactNode; answer: ReactNode }` (line 23). `Slide` is line 11 with
  optional `text`, `note`, `image`, `video`, `audio`.
- `toQuestion` builds `common` with conditional spreads because of `exactOptionalPropertyTypes`
  (lines 12-15). The `music` case already calls `asset(spec.track)` (line 39): `toQuestion` is where
  spec paths become URLs for non-custom types; renderers like `SlideView` call `asset()` themselves.
- `asset(path)` is in `src/asset.ts`: prefixes `import.meta.env.BASE_URL` (`/julequiz/`). Calling it
  twice on the same path double-prefixes — run each path through it exactly once.
- `QuestionScreen` (`src/components/QuestionScreen.tsx`) returns a fragment (line 73) with the blur
  `div` and the `motion.div`; `hasAnswered` toggles between `question.body` and `question.answer`
  (line 155). It is mounted only while a door is open (`src/pages/index.tsx:303-315`,
  `activeQuestion && …`) and unmounts on close.
- Media extensions in the repo today: video `.mp4`, `.mov`; audio `.mp3`; images `.jpg`, `.jpeg`,
  `.png`, `.webp`.

## Implementation steps

1. `src/types.ts`: add `preload: string[];` to `Question` (after `answer`). Add `preload?: string[]`
   to the `custom` member of the `QuestionSpec` union only:
   `{ type: "custom"; body: ReactNode; answer: ReactNode; preload?: string[] }`.
2. `src/questionTypes/index.tsx`:
   - Add a local helper `const slideMedia = (slide: Slide) => [slide.image, slide.video, slide.audio].filter((p) => p !== undefined);`
     (import `type Slide` from `../types`). If TypeScript does not narrow to `string[]`, use a type
     predicate `(p): p is string => p !== undefined`.
   - In every `case`, add `preload` to the returned object, mapping paths through `asset`:
     - `standard`: `preload: slideMedia(spec.answer).map(asset)`
     - `wordPuzzle`: `preload: []`
     - `music`: `preload: [asset(spec.track)]`
     - `posterReveal`: `preload: [spec.cropped, spec.full].map(asset)`
     - `video`: `preload: slideMedia(spec.answer).map(asset)`
     - `custom`: `preload: (spec.preload ?? []).map(asset)`
   - Keep `...common` last in each object, as today.
3. Create `src/components/MediaPreload.tsx`, without a `"use client"` directive (no hooks; it is only
   rendered from the client `QuestionScreen`). Export
   `MediaPreload: FunctionComponent<{ urls: string[] }>` that returns `null` when `urls` is empty,
   otherwise:
   ```tsx
   <div hidden aria-hidden="true">
     {urls.map((url) =>
       /\.(mp4|mov|webm|m4v)$/i.test(url) ? <video key={url} src={url} preload="auto" muted />
       : /\.(mp3|wav|ogg|m4a|aac)$/i.test(url) ? <audio key={url} src={url} preload="auto" />
       : <img key={url} src={url} alt="" />
     )}
   </div>
   ```
   Deduplicate first (`[...new Set(urls)]`) so duplicate keys cannot occur. Hoist the two regexes
   to module constants with names (`VIDEO_EXT`, `AUDIO_EXT`).
4. `src/components/QuestionScreen.tsx`: render `<MediaPreload urls={props.question.preload} />` as
   the first child of the returned fragment (before the blur `div`), unconditionally — not inside
   the `hasAnswered` branch.
5. `src/quizzes/jul-2025/questions/07-gabby-kat.tsx`: hoist the nine image paths into a
   `const images = [...]`, pass `images={images}` to `GuessThatCat`, and add `preload: images` to
   the spec.
6. `CLAUDE.md`, section "Quiz-pakker", paragraph starting "`QuestionSpec.type` er …": add one Danish
   sentence after the `backgroundVolume`/`skip` sentence, e.g.: "Svarets billeder, video og lyd
   (`Question.preload`, udledt i `toQuestion`) forudindlæses skjult af `MediaPreload`, mens lågen er
   åben; en `custom`-låge angiver dem selv med `preload`." Keep lines ≤ 100 chars like the rest.
7. Run `npm run check`; it must pass. Commit in Danish (imperative, short subject).

## Traps

- **Do not render `question.answer` hidden on the question side to "preload" it.** Answer
  components autoplay video/audio and start timers on mount (`GuessThatCat`, `08-husnisse.tsx`'s
  `Answer`, `MusicBox`), so they would play and count down unseen. Preload only raw URLs via
  `MediaPreload`.
- **Do not add `autoPlay` to the hidden `<video>`/`<audio>`, and keep the video `muted`.** It would
  play sound behind the question. `preload="auto"` alone downloads.
- **Do not use `loading="lazy"` on the hidden `<img>`.** Lazy images inside a `hidden`
  (display:none) parent are never fetched; the default eager loading fetches them.
- **Do not unmount `MediaPreload` when the answer is revealed** (e.g. by putting it inside the
  `hasAnswered ? … : …` branch). Removing the hidden video aborts its download mid-way and drops
  the buffered data the answer video would reuse.
- **Do not call `asset()` in `MediaPreload` or pass plain paths into `Question.preload`.** Paths go
  through `asset()` exactly once, in `toQuestion`; a second call yields `/julequiz/julequiz/…` (404
  on GitHub Pages), a missing call yields `/quizzes/…` (404 under the base path).
- **Do not set `preload: undefined` or make `Question.preload` optional.** `exactOptionalPropertyTypes`
  rejects `undefined` for optional fields; a required field with `[]` keeps every case explicit.
- **Do not add a `default` to the `toQuestion` switch** (it is deliberately exhaustive).
- Comments must ADD value. One comment is warranted in `MediaPreload.tsx`, above the component: why
  it exists and why it stays mounted on the answer side (the hidden elements fill the HTTP cache so
  the answer's own elements start from it; unmounting aborts the download). Comments are in Danish.
  Nothing else needs a comment.

## Verification

No tests (the repo has none; this is a small derivation plus markup). `npm run check` must pass.

Manual check in `npm run dev` (http://localhost:3000/julequiz/?quiz=jul-2025), DevTools Network tab
with "Disable cache" **off**:

- Open door 17 (video, answer `nothing.mp4`): on the question side, a request for `nothing.mp4`
  starts without revealing. Wait, press Enter: the answer video plays immediately.
- Open door 01 (standard): `dutch1.jpg` is requested on the question side; on reveal it appears with
  no load delay.
- Open door 18 (posterReveal): both `poster-1-crop.webp` and `poster-1.webp` load on the question
  side; clicking the crop on the answer side shows the full poster instantly.
- Open door 13 (music): the track mp3 is requested on the question side; the MusicBox still only
  plays after clicking.
- Open door 07 (Gabby): the nine cat images load on the question side.
- Open door 06 (wordPuzzle): no hidden preload `div` is rendered (empty list → `null`).
- No sound is heard from hidden elements on any question side; closing a door (Escape) removes the
  hidden elements (check Elements panel).
