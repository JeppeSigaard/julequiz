# Door content restyle

> Status: in progress — redesign-door-content

## Goal

Restyle what the data-driven doors show on the paper card, in one place: the renderers in `src/questionTypes/`. Standard, wordPuzzle, music, posterReveal and video doors get the mockup's content typography (display-font answers, soft notes, framed tilted images and videos with a paper-edge shadow), use px and colour tokens instead of `vh` and `green-*`, and never overflow the card. Only presentation changes. Base branch is `claude/sweet-mendel-p0gtn1`, and the PR targets it, never `main`. Visual target: the answer state of `.claude/initiatives/redesign-mockup/Door.dc.html`, drawn at 1600x900, so multiply its px by 1.2.

## Out of scope

- What any door asks or shows: text, media, answers and the `QuestionSpec` union in `src/types.ts` stay as they are.
- `src/components/WordPuzzle.tsx`, `MusicBox.tsx`, `FoxChickenGrain.tsx`, `GuessThatCat.tsx` (minigames), and custom doors 02/07/08.
- The card frame: `QuestionScreen.tsx`, `QuestionCard.tsx`, header ribbon, buttons, key caps, and any "Spørgsmål"/"Svar" labels (door-frame). Do not render those labels in the renderers either.
- `src/styles.css`, `src/components/decor.tsx`, `src/pages/index.tsx`, `CLAUDE.md`, `src/pages.gen.ts`, `src/types.ts`.
- Keyboard handling, scoring, saved state, sound and music choices, new dependencies, tests, CI, committed screenshot scripts, fonts other than Mountains of Christmas and Nunito.

## Owns (hard boundary)

`src/questionTypes/` only: `Standard.tsx`, `WordPuzzle.tsx`, `Music.tsx`, `PosterReveal.tsx`, `Video.tsx`, `index.tsx`. A missing token or primitive is built locally in these files and named in the PR body, never added to a shared file.

## Decisions made (settled by the master plan)

- Fixed 1920x1080 `Stage`: lay out in plain px or Tailwind sizes, no `vw`/`vh`. The replaced `vh` units are `max-h-[60vh]` in `Standard.tsx` and `h-[55vh]` in `Video.tsx`.
- Door count is dynamic: assume no 24 doors or 6 columns. Door type sizes follow the door's content (as `textSize` does), not the door number.
- Colours only through token utilities from `src/styles.css`: `paper`, `paper-lit`, `paper-edge`, `ink`, `ink-soft`, `accent`, `accent-deep`, `highlight`, `felt` and so on, plus `font-display` (Mountains of Christmas) and `font-body` (Nunito). No raw hex, no Tailwind `green-*`, `red-*`, `amber-*`, `gray-*`.
- Door content is restyled through the renderers, so the 21 data-driven doors change in one place.
- Motion is ambient only: add no looping or entrance animations to content.
- Every URL to a file in `public/` goes through `asset()`; imported module URLs (`vinylStop`, SFX) never do.
- `exactOptionalPropertyTypes`: omit optional props rather than passing `undefined` (see the `caption` spread in `index.tsx`).
- UI text and comments in Danish, identifiers in English. Commit messages in Danish, imperative. Never commit on `main`.
- Done means `npm run check` passes and 1920x1080 screenshots show consistency.

## Architecture facts (verified)

- `toQuestion` in `src/questionTypes/index.tsx` is a `switch` over `spec.type` without a default; it builds `body`/`answer` per type. Standard and video answers both use `SlideView`. posterReveal's `body` is an inline `<p className="text-7xl">{spec.prompt}</p>` in that file.
- `Standard.tsx` exports `textSize(text)`: `text-8xl` (<=30 chars), `text-5xl` (<=80), `text-4xl`. Nothing outside `Standard.tsx` imports it (grep confirmed). `SlideView` renders, in order: video (`w-250`), image (`max-h-[60vh] max-w-250`), audio (hidden, autoplay), text (`font-extrabold max-w-250`), note (`text-3xl w-250`). `w-250`/`max-w-250` = 1000px.
- `Video.tsx` `VideoBody`: video `h-[55vh] max-w-250 object-contain`, fades to `opacity-25` on end, with the prompt absolutely centred over it at `text-5xl font-bold`; optional `caption` at `text-3xl`.
- `WordPuzzle.tsx` (questionTypes): hint `text-4xl mb-10`, `<WordPuzzle className="text-7xl text-green-900">`, answer `font-bold text-9xl`. The `WordPuzzle` component takes `className` and applies it to its own flex container (`src/components/WordPuzzle.tsx`), so passing a token colour class there is the supported route; do not edit that component.
- `Music.tsx` `MusicBody`: `<p className="text-7xl">MUSIKQUIZ!</p>` plus an autoplay `<audio src={vinylStop}>`. The answer is `MusicBox` (minigames, not touched).
- `PosterReveal.tsx` `PosterAnswer`: a clickable cropped `w-150` image that swaps for the full `w-125` image on click (state `reveal`).
- Card frame (door-frame sibling, in flight): the content area is a fixed, centred box inside the stage. Budget for content: width up to 1200px (the mockup's 1000px x 1.2), height about 560px. Wider or taller content must scale down, not scroll.
- Mockup answer typography at 1.2x: label 22px; question text 64 -> ~77px, weight 800, line-height 1.15; answer word in Mountains of Christmas 130 -> ~156px, weight 700, line-height 0.9, red (use `text-accent-deep`); note 34 -> ~41px, line-height 1.35, colour `text-ink-soft`. Gap between question/answer/note blocks 22 -> ~26px.
- Tokens exist in `src/styles.css` (`--color-ink-soft`, `--color-paper-edge`, `--shadow-*` for pills, `--font-display`). There is no image-frame shadow token: build it locally with Tailwind arbitrary values using token colours, for example `shadow-[0_8px_0_var(--color-paper-edge)]`. Check in `npm run dev` that this resolves; `@theme inline` may not define `--color-paper-edge` at runtime, in which case use `shadow-[0_8px_0_color-mix(in_oklab,var(--quiz-paper)_80%,black)]` (as the existing shadow tokens do).

## Implementation steps

1. `Standard.tsx`: keep `textSize` exported with the same length tiers, but return `text-[96px]`, `text-[58px]`, `text-[43px]` (the current 8xl/5xl/4xl sizes in px). Text classes: `font-body font-extrabold leading-tight text-ink max-w-300`. Notes: `text-[41px] leading-snug text-ink-soft max-w-300` (replacing `w-250`).
2. `Standard.tsx` media: image becomes `max-h-[480px] max-w-[1000px] rounded-lg object-contain` with a slight tilt (`-rotate-1`), a thin `border-8 border-paper-lit` paper frame and a paper-edge shadow. Video the same frame but no tilt (it plays; keep it straight) and `max-h-[480px]`. Replace `w-250` on the video with `max-w-[1000px] max-h-[480px]`. Audio unchanged.
3. When a slide has media plus text, keep the grid `gap-4` -> `gap-6`; when it has only text, no extra padding. Do not add labels.
4. `Video.tsx`: replace `h-[55vh]` with `h-[480px]`, same frame as step 2 (keep `object-contain`, `max-w-[1000px]`, fade on end and `onEnded` logic untouched). Prompt overlay: `font-display text-[77px]` weight bold, `text-ink`, `leading-tight`, centred with `px-10`. Caption: `text-[41px] text-ink-soft`.
5. `WordPuzzle.tsx` (questionTypes): hint `text-[41px] text-ink-soft mb-10`; pass `className="text-7xl text-ink"` (token colour replaces `text-green-900`); answer `font-display font-bold text-[156px] leading-[0.9] text-accent-deep`. For long words, no change of text: the answer must fit 1200px, so use the `Standard.tsx` approach of a smaller tier: `word.length <= 12 ? "text-[156px]" : "text-[110px]"` via a lookup in the file.
6. `Music.tsx`: `MUSIKQUIZ!` becomes `font-display text-[110px] font-bold text-accent-deep leading-none`. Keep the audio element and its import.
7. `PosterReveal.tsx`: both images get the step 2 frame (tilt only on the cropped one; the full poster sits straight) and a height cap so neither exceeds 520px: replace `w-150`/`w-125` with `max-h-[520px] w-auto`. Keep the button, `cursor-pointer`, `alt` and the `reveal` state.
8. `index.tsx`: the posterReveal `body` becomes `<p className="font-display text-[110px] font-bold leading-none text-ink max-w-300 text-center">{spec.prompt}</p>`. Touch nothing else in this file.
9. Run `npm run check` until it passes. Then screenshot (see Verification).

## Traps

- **Do not edit `src/components/WordPuzzle.tsx`, `MusicBox.tsx` or the card frame to make content fit.** Siblings own them and run in parallel; edits conflict at merge. Fit by shrinking content in the renderers; report any frame problem in the PR body.
- **Do not build class names dynamically** (`` `text-[${n}px]` ``, `` `bg-${x}` ``). Tailwind 4 scans source text and drops unknown classes silently. Use lookup objects with full class strings (the existing `textSize` is the pattern).
- **Do not use `vw`/`vh`/`h-screen`.** Inside the transformed `Stage`, viewport units still refer to the real window, so content would scale wrongly. Use px.
- **Do not use raw hex or Tailwind `green-*`/`red-*`.** Colours are token utilities only; the pack sets them. Verify tokens in `src/styles.css` before using one (names are in Decisions).
- **Do not put the `rotate` on the element that holds the `<video>` controls or autoplay logic in a way that changes layout size.** Rotation does not affect layout, so a tilted frame can poke 10-20px past its box; keep a `p-4` margin around framed media so it does not clip at the card edge.
- **Do not change `onEnded`/`ended` state in `Video.tsx` or the autoplay attributes.** The prompt only appears after the clip ends, and the answer may be revealed first; that behaviour is intentional (existing comment).
- **Do not enlarge text past the tiers.** Long answers overflow the card silently; keep the tiers.
- **Do not pass `undefined` for optional props** (`exactOptionalPropertyTypes`); keep the conditional spread for `caption` in `index.tsx`.
- Comments must ADD value: only non-obvious constraint, why or corner case. Warranted spots: why the tilt is not on video; the `ended`-opacity comment already present stays. Everything else needs no comment.

## Verification

No new tests (presentation only). Run `npm run check`. Then run `npm run dev` and, with a Playwright script kept outside the repo (pre-installed Chromium, viewport 1920x1080, URL `http://localhost:3000/julequiz/`), open and screenshot question state and answer state (Enter) for one standard door with text only, one standard with an image, one wordPuzzle (also a long word), one music, one posterReveal (cropped and revealed) and one video (before and after the clip ends, and after answer). Reset the saved quiz or seed `localStorage` (shape in `src/quizState.ts`) when doors are already won. Confirm: nothing overflows or clips the card, text is readable on paper, colours follow tokens (change a pack colour to be sure), framed media look consistent, and the quizmaster's keyboard flow is unchanged. Note that the card frame may not be merged yet; judge fit against the 1200x560 content budget and say so in the PR body.

## Autonomous decisions

- Content box budget 1200x560px assumed from the mockup, rejecting waiting for the door-frame sibling's exact size.
- Tilt only on still images, not video or revealed posters, rejecting tilting everything (rotated playing video looks wrong and changes perceived edge fit).
- Answer word coloured `text-accent-deep`, rejecting `text-accent` (lower contrast on cream paper).
- Image frame shadow built locally with arbitrary-value Tailwind, rejecting a new token in `styles.css` (not owned).
- "Spørgsmål"/"Svar" labels left to door-frame, rejecting rendering them in `SlideView`.
- Kept `textSize` length tiers and its export, rejecting a rewrite to continuous sizing.
- Keep `MUSIKQUIZ!` and other text unchanged, rejecting copy edits (out of scope).
