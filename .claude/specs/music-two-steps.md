# Musiklåge i to trin

> Status: in progress — claude/funny-archimedes-pjowmi

## Goal

A music door (`QuestionSpec` type `"music"`) takes three steps today: the first screen shows only
"MUSIKQUIZ!", the footer's "Vis svaret" button then swaps in the player (Start / Spil lidt mere /
Vis svar), and its inner "Vis svar" button finally shows song and artist. The footer label is
misleading on step one, because it does not show the answer. Make it two steps: the first screen
shows "MUSIKQUIZ!" with the player directly under it, and the footer's "Vis svaret" shows song and
artist, starts the answer clip, and brings up the team buttons in one go.

## Out of scope

- `src/components/QuestionScreen.tsx` — the footer, keyboard handling and reveal flow stay as is.
- `src/types.ts` — the `music` `QuestionSpec` fields stay unchanged; no question files change.
- Any other question type, `PillButton`/`decor.tsx`, styles, or new sound effects.
- A pause/stop button on the answer screen, volume controls, or progress bars.

## Decisions made

- Sound on the answer screen → **autoplay** the track from `answerStart` as soon as the answer shows.
- The hint mechanic stays: Start → "Afspiller..." → "Spil lidt mere" (clip 3× longer per replay).
  Only the player's own "Vis svar" button and its `"revealed"` state go away.
- The vinyl-stop sound effect on opening the door stays.
- Start is disabled until the track has loaded (correctness fix, see Traps).

## Architecture facts (verified)

- `src/questionTypes/index.tsx:33-48`: `case "music"` returns `body: <MusicBody />` and
  `answer: <MusicBox track={asset(spec.track)} song artist start stop answerStart />`.
- `src/questionTypes/Music.tsx`: `MusicBody` is a fragment with the 110px "MUSIKQUIZ!" `<p>` and
  `<audio src={vinylStop} autoPlay />`. No `"use client"`, no hooks.
- `src/components/MusicBox.tsx` (`"use client"`): state `"idle" | "playing" | "stopped" | "revealed"`,
  `useSound(props.track, { interrupt: true })`, `handlePlay`, `handleReveal`, an interval effect that
  stops at `currentStop` and bumps `hintCount`, and an unmount effect calling `stop()`.
- `src/components/QuestionScreen.tsx:143` renders `hasAnswered ? answer : body` inside
  `<main className="… flex-col items-center justify-center gap-[26px] …">`. Switching unmounts the
  body (its sound stops via the unmount cleanup) and mounts the answer. Escape on the answer goes
  back to the body, which remounts fresh in `"idle"`.
- `use-sound` 5.0.0 (`node_modules/use-sound/dist/use-sound.esm.js`): `sound` is `null` until Howler
  has loaded the file; `play()` and `stop()` are silent no-ops while `sound` is `null`. `play` and
  `stop` are `useCallback`s keyed on `sound`.

## Implementation steps

1. **`src/components/MusicBox.tsx` — trim the player.**
   - Props become `{ track: string; start: number; stop: number }` (drop `song`, `artist`, `answerStart`).
   - `State` becomes `"idle" | "playing" | "stopped"`. Delete `handleReveal` and the `revealed` JSX block.
   - In the `stopped` block, delete the `team-2` "Vis svar" `PillButton`, leaving the single
     "Spil lidt mere" button; remove its now single-child wrapper `<div className="flex gap-6">`.
   - On the idle Start `PillButton` add `disabled={!sound}` and
     `className="disabled:cursor-wait disabled:opacity-50"`.
   - Delete the "Seek to start position once sound is loaded (for first play)" effect and its
     comment: Start is disabled until `sound` exists, so `handlePlay` always seeks itself.
   - Remove the unused `useMemo` from the `react` import.
   - In the interval effect, also stop when the track has ended: change the condition to
     `if (currentTime >= currentStop || !sound.playing())`. Once the hint clip grows past the end of
     the mp3, Howler ends it and resets the position to 0, so `currentTime` never reaches
     `currentStop` and the player hangs on "Afspiller...".
   - Leave `handlePlay` and the unmount effect unchanged.
2. **`src/components/MusicBox.tsx` — add `MusicAnswer`** in the same file, exported:
   - Props `{ track: string; song: string; artist: string; answerStart: number }`.
   - `const [play, { stop, sound }] = useSound(props.track, { interrupt: true });`
   - One effect: `if (!sound) return; play({ playbackRate: 1 }); sound.seek(props.answerStart);
     return () => stop();` with deps `[sound, play, stop, props.answerStart]`.
   - Render exactly the markup of the old `revealed` block (the `flex flex-col items-center gap-4
     text-center` div with the `font-display text-[96px] text-accent-deep` song and the
     `text-[43px] font-bold text-ink` artist). No buttons.
3. **`src/questionTypes/Music.tsx`** — `MusicBody` takes props `{ track: string; start: number;
   stop: number }` and renders, in order: the existing "MUSIKQUIZ!" `<p>`, the existing vinyl
   `<audio>`, then `<MusicBox track={props.track} start={props.start} stop={props.stop} />`.
   Type it like `MusicBox` (`FunctionComponent<…>` from `react`).
4. **`src/questionTypes/index.tsx`** — in `case "music"`:
   - `body: <MusicBody track={asset(spec.track)} start={spec.start} stop={spec.stop} />`
   - `answer: <MusicAnswer track={asset(spec.track)} song={spec.song} artist={spec.artist} answerStart={spec.answerStart} />`
   - Change the import to `import { MusicAnswer } from "../components/MusicBox";` (`MusicBox` is no
     longer used here).
5. Run `npm run check`. Commit in Danish, imperative (e.g. "Vis afspilleren på musiklågens første
   skærm og svaret i ét trin").

## Traps

- **Do not autoplay the answer with `play()` directly in the component body or in a mount-only
  effect (`[]` deps).** `sound` is `null` until the mp3 has loaded, and `play()` is then a silent
  no-op, so the answer would show without sound. Key the effect on `sound` as in step 2.
- **Do not `seek` before `play`.** The hook is created with `interrupt: true`, so `play()` calls
  `sound.stop()` first, which resets the position; a seek beforehand is lost and the clip starts
  at 0. Keep the order of the old `handleReveal`: `play(...)` then `sound.seek(...)`.
- **Do not leave Start clickable before load.** The player now mounts the moment the door opens, so
  a fast click lands while `sound` is `null`: `play()` does nothing, state becomes `"playing"`, and
  the interval never reaches `currentStop`, so it hangs on "Afspiller..." forever. `disabled={!sound}`
  is the fix; do not add a retry or a queued play instead.
- **Do not `asset()` the vinyl import, and do not `asset()` the track twice.** `asset()` runs once,
  in `toQuestion`; `MusicBody`/`MusicBox`/`MusicAnswer` receive an already-prefixed URL. Module
  sound imports (`vinylStop`) never go through `asset()`.
- **Do not call hooks in `toQuestion`.** It runs at pack load; hooks belong in the components.
- **Do not touch `QuestionScreen.tsx`** to relabel or hide "Vis svaret": with this change the label
  is accurate for music doors, and the footer is shared by every question type.
- **Do not build Tailwind classes dynamically or use palette classes** (`gray-`, `red-`…); only the
  literal token classes already in the file.
- Comments: none are needed in this change (the "Seek to start position…" comment goes with its
  effect). Do not add comments describing what the code does.

## Verification

No tests (the repo has none, and this is a small UI change). `npm run check` must pass. Then in
`npm run dev`, open http://localhost:3000/julequiz/?quiz=jul-2025 and a music door (13, 21 or 23):

- Door opens: vinyl-stop plays; "MUSIKQUIZ!" with a Start button under it; footer shows "Vis svaret".
  Start is briefly dimmed until the track loads.
- Start → "Afspiller..." → clip stops → "Spil lidt mere" (only that button) → plays 3× longer.
  Pressing it until the clip outgrows the song ends on "Spil lidt mere", not a stuck "Afspiller...".
- "Vis svaret" (click or Enter), also mid-clip: the clip stops, song and artist show, the track plays
  from `answerStart`, and the three team buttons appear. 1/2/Q award as before.
- Escape on the answer: sound stops, the first screen returns with Start.
- Closing the door at any step leaves no sound playing.
