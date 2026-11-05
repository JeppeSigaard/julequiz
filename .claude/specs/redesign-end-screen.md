# Slutskærm (end screen)

> Status: merged — d74b179
> Branch: `redesign-end-screen` (base `claude/sweet-mendel-p0gtn1`, PR targets it, never `main`)

## Goal

After the last door the screen shows a night sky with fireworks and snowy hills, the line "Alle låger er åbnet", the headline "{name} vinder!" (or "Uafgjort!"), two `TeamPlaque`s at `size="end"` with the winner larger and crowned, and "Glædelig jul!" at the bottom. Clicking a plaque still gives that team +5 consolation points. Target: `.claude/initiatives/redesign-mockup/Finale.dc.html`, drawn at 1600×900; multiply its px by 1.2 for the 1920×1080 stage.

## Out of scope

- When the end screen appears and its music (`src/pages/index.tsx`, board task). Keyboard controls, scoring, +5 rule, `src/quizState.ts`.
- Any edit outside `src/components/EndScreen.tsx`. Sibling tasks own `index.tsx`, `QuestionCard.tsx`, `QuestionScreen.tsx`, `src/questionTypes/`, `SettingsMenu.tsx`, `ResetQuizSetting.tsx`, the mini-games, `styles.css`, `decor.tsx`, `CLAUDE.md`. A missing token or primitive is built locally in `EndScreen.tsx` and named in the PR body.
- Mockup's static firework bursts and its 40 snowflakes (the real `Fireworks` replaces the bursts; the board's `Snowfall` in `index.tsx` is hidden behind EndScreen's opaque root, so EndScreen renders its own `Snowfall`). No new dependency, test framework, CI step or committed screenshot script. No emoji; fonts only `font-display`/`font-body`.

## Owns (hard boundary)

`src/components/EndScreen.tsx`

## Settled by the master plan (restated)

- Fixed 1920×1080 `Stage`; lay out in plain px/Tailwind sizes, no `vw`/`vh`, nothing assuming 24 doors or 6 columns. `position: fixed` inside the Stage is stage-relative.
- Colours only via token utilities (`bg-night`, `bg-felt`, `bg-paper`, `text-highlight`, `text-snow`, `fill-highlight`, ...). No raw hex, no Tailwind `green-*`/`red-*`/`amber-*`/`gray-*`.
- Hold 1 = cranberry, Hold 2 = gold. Team names come from the `teamNames` prop, never hardcoded.
- Motion: ambient plus door opening only. No bouncing titles or looping content animations (fireworks are the exception, already decided).
- Pinned contract, unchanged:
  `EndScreen: FC<{ teamNames: [string, string]; points: [number, number]; doors: [number, number]; consolation: [number, number]; onConsolation: (team: 1 | 2) => void }>`
  `TeamPlaque: FC<{ team: 1|2; name; points; doors; consolation; size: "board"|"end"; onClick; children?: ReactNode }>` (`children` is an overlay slot, for the crown).
- UI text and comments in Danish, identifiers in English. `exactOptionalPropertyTypes`: omit optional props, never pass `undefined`.

## Architecture facts (verified)

- `src/components/EndScreen.tsx` is currently a stub: `<Fireworks autostart className="absolute inset-0" />` (from `@fireworks-js/react`, in `package.json`) plus two plain buttons using `AnimatedNumber`. It is `"use client"`. Rewrite it in place.
- `src/pages/index.tsx:209-221` renders `<EndScreen …/>` inside `<Stage>` > padded `div` > `aspect-video bg-felt` div. The board task will change those wrappers, so do not depend on them: make the root `fixed inset-0 overflow-hidden`, which covers the Stage whatever the wrapper is. `index.tsx` already passes all five props.
- `isFinished` is true when every non-skipped door is answered, including doors given to no team (`q`/`x`). So `doors[0] + doors[1]` can be lower than the number of doors.
- `src/components/decor.tsx`: `TeamPlaque` `size="end"` is 440 px wide, rotated -2°/+2° (team 1/2), shows name, big points (158 px), and "point · N låger". It has no winner ring and ignores `consolation` at `end` size. Its root is a `<button>` with an `aria-label` and `onClick`. Its `children` render after the `Paper`, inside the `relative` button, so absolute children position against the plaque.
- Tokens exist in `src/styles.css`: `night`, `felt`, `felt-deep`, `paper`, `paper-edge`, `snow`, `highlight`, `highlight-deep`, `accent`, `team-*`. `Stage.tsx` sets `--quiz-*` vars and a felt texture on its inner box. The Tailwind `text-shadow-[…]` utility is already used by the stub.
- `AnimatedNumber` (in `src/components/`) animates number changes; `TeamPlaque` already uses it.

## Implementation steps

All in `src/components/EndScreen.tsx`.

1. Keep `"use client"` and the exported `EndScreen` name and prop type exactly as pinned. Import `TeamPlaque` from `./decor`. Drop the `AnimatedNumber` import.
2. Derive in the component body: `const [p1, p2] = points; const winner = p1 === p2 ? null : p1 > p2 ? 1 : 2;`
3. Root: `<div className="fixed inset-0 overflow-hidden bg-night …">` with the sky `radial-gradient(ellipse at 50% 110%, <green glow>, transparent 60%)` as an inline `style` constant, written like `FELT_TEXTURE` in `src/components/Stage.tsx` (glow = `color-mix(in oklab, var(--quiz-background) 70%, rgb(46 110 78) 30%)`, not raw hex).
4. Layers, bottom to top:
   - `<Fireworks autostart className="absolute inset-0" />` first, z-0.
   - `<Snowfall color="white" radius={[1, 2.5]} opacity={[0.15, 0.5]} snowflakeCount={60} />` next, between Fireworks and the hills.
   - Hills, `aria-hidden`, z-10: (a) `absolute inset-x-0 bottom-0 h-[144px] bg-felt` with `rounded-t-[50%]` shaped like the mockup (`border-radius: 50% 50% 0 0 / 72px 72px 0 0`) and a 2 px top light line; (b) `absolute -inset-x-12 bottom-0 h-[84px] bg-paper opacity-90`, radius `50% 50% 0 0 / 48px 48px 0 0`. (Mockup 120/70 px and -40 px, times 1.2.)
   - Content column `absolute inset-0 z-20 flex flex-col items-center pt-[84px]`.
5. Content column, top to bottom (mockup sizes ×1.2):
   - Eyebrow `Alle låger er åbnet`: `text-[22px] font-black uppercase tracking-[0.32em] text-highlight`.
   - `<h1>`: `font-display font-bold text-[144px] leading-none text-snow mt-1`, text: `{teamNames[winner - 1]} vinder!` or `Uafgjort!`. Text-shadow: a hard 7 px dark offset plus a 60 px glow from `var(--quiz-highlight)` at about 35 %, as `text-shadow-[…]`.
   - Plaque row `mt-[140px] flex items-end gap-[108px]`, team 1 then team 2. Each plaque sits in a wrapper `div`: the winner's wrapper gets `scale-110 origin-bottom` and a `drop-shadow-[0_0_48px_var(--quiz-highlight)]` glow (so a wrapper, since `TeamPlaque` takes no extra classes); the loser's wrapper gets `mb-3`; on a tie both wrappers are identical with no scale, no glow and no margin.
   - Each `<TeamPlaque team={t} name={teamNames[t-1]!} points={points[t-1]!} doors={doors[t-1]!} consolation={consolation[t-1]!} size="end" onClick={() => onConsolation(t)}>`. Index with `!` or destructure, because `noUncheckedIndexedAccess` is on.
   - Crown (winner only, passed as `TeamPlaque` children): local inline SVG, `aria-hidden`, 144×84 (mockup viewBox `0 0 120 70`), `className="absolute left-1/2 -top-[74px] -translate-x-1/2"` so it sits between the two strings; `fill-highlight stroke-highlight-deep` for the body, `fill-accent` for the jewel circle. Use the mockup path `M10 62 L4 14 L34 38 L60 4 L86 38 L116 14 L110 62 Z`, jewel `cx=60 cy=44 r=7`, stroke width 3. Nudge `top` by eye after the first screenshot.
   - Footer line `<p>` `mt-[67px] font-display font-bold text-[53px] text-highlight`: `Glædelig jul!`.
6. Run `npm run check`.

## Traps

- **Do not return a fragment or `absolute inset-0` as root.** The wrapper above `EndScreen` in `index.tsx` is about to change (padding, `aspect-video`), so an `absolute` root can end up smaller than the Stage and leave the felt visible. Use `fixed inset-0` (stage-relative because `Stage` is transformed).
- **Do not hardcode "Hold 1"/"Hold 2", `24` or the 1920 geometry as data.** Names come from `teamNames`; there is no door count in the text. Do not copy the existing stub, which has no such logic.
- **Do not build class names dynamically** (`` `scale-${n}` ``, `` `text-${tone}` ``). Tailwind scans source text; use whole strings in a lookup or a ternary.
- **Do not put the crown, glow or scale in `decor.tsx`** (not owned). The crown goes through the `children` slot, scale and glow on a wrapper `div`. A winner ring like the mockup's `0 0 0 4px` is not possible without editing `TeamPlaque`; the `drop-shadow` glow stands in for it. Name that in the PR body.
- **Do not put the plaque `scale` on the `<button>` or wrap it in a second button.** Nested buttons are invalid, and `scale` on the wrapper keeps the plaque's own rotation intact.
- **Do not pass `undefined`** for optional props; omit `children` when there is no crown (tie, loser): render the crown as `{winner === t && <Crown />}` as the child of `TeamPlaque`, which handles a `false` child.
- **Raw hex is forbidden**, including from the mockup (`#f2c14e` etc.); use `highlight`, `highlight-deep`, `accent` tokens or `var(--quiz-*)`. `grep -nE "#[0-9a-fA-F]{3,6}|green-|red-|amber-|gray-" src/components/EndScreen.tsx` must be empty.
- **Fireworks must stay inside the root** (z-0). Do not render `Fireworks` outside the Stage; it sizes to its positioned ancestor.
- Comments: add none unless a non-obvious why; the one that warrants it is a Danish line on the `fixed` root (stage-relative because of the Stage transform, and independent of the wrapper in `index.tsx`).

## Verification

No test (visible on read; no test framework, none added).

1. `npm run check` passes.
2. Playwright (script in the scratchpad, not the repo; pre-installed Chromium) against `npm run dev` at 1920×1080, URL `http://localhost:3000/julequiz/`. Seed `localStorage` key `julequiz-state-v2:jul-2025` (shape `SavedQuizState` in `src/quizState.ts`: `questionIds` is the full list of ids in the saved order, with every door index spread across `team1Cards`/`team2Cards`/`noTeamCards`). Read the ids from the page's shuffled state or by first saving once from the running quiz.
   - Winner case: team 1 holds more doors; expect "{Hold 1} vinder!", the crown on the larger plaque only, winner larger with glow.
   - Tie case: equal doors and equal consolation; expect "Uafgjort!", no crown, equal plaques.
   - Compare both screenshots against `Finale.dc.html` (open it scaled ×1.2 or compare composition).
3. Click a plaque in both screenshots' states: that team's points rise by exactly 5 (consolation) and the ding plays; the other team is untouched. A click that makes the scores equal flips the headline to "Uafgjort!" and removes the crown.
4. Keep `localStorage` seeding out of the commit; do not commit the script or screenshots.

## Autonomous decisions

- The kicker reads "Alle låger er åbnet", without a number → rejected N = `doors[0] + doors[1]` (miscounts doors given to nobody or skipped) and rejected a new `totalDoors` prop (changes the pinned contract and needs an `index.tsx` edit outside Owns).
- Winner emphasis is a wrapper `div` with `scale-110` and a `drop-shadow` glow → rejected editing `TeamPlaque` for a `winner` prop (`decor.tsx` is not owned) and rejected a ring box-shadow (does not follow the rotated plaque).
- Loser sits `mb-3` lower than the winner and tie plaques are level → rejected adding any tie decoration.
- Fireworks kept as the real `Fireworks` component; the mockup's static bursts and snowflakes are not drawn → rejected drawing SVG bursts (duplicates the dependency's job) and the mockup's 40 hand-placed snowflakes are replaced by `react-snowfall` (already a dependency) inside the root, with the board's parameters (`color="white" radius={[1, 2.5]} opacity={[0.15, 0.5]} snowflakeCount={60}`), since the board's own snow is painted over by the opaque root.
- Root is `fixed inset-0` → rejected `absolute inset-0` as in the stub (depends on the soon-to-change wrapper in `index.tsx`).
- Crown is a local inline SVG in `EndScreen.tsx` → rejected a `decor.tsx` export (not owned; master plan says screen-specific decoration lives with its screen).
- Sky glow is an inline `color-mix` gradient on `var(--quiz-background)` → rejected the mockup's raw `rgba` and rejected a new token.
- Headline shows the team name as given, not uppercased → rejected `uppercase` (the mockup headline is mixed case).

