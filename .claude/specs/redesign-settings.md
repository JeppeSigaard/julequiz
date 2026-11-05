# Redesign: settings

> Status: merged — 630537b

Branch `redesign-settings`, branched from and PR-targeting `claude/sweet-mendel-p0gtn1` (the initiative's integration branch, NOT `main`: every push to `main` deploys to GitHub Pages). Master plan: `.claude/initiatives/redesign.md` (settled; restated below). Depends on `foundation` and `door-frame`, both merged.

## Goal

Make the `m` settings menu match the new look: a cream `Paper` card with a ribbon heading "Indstillinger" over the dimmed, blurred stage, like the open-door card. The reset buttons become `PillButton`s: "Nulstil quiz" is dark, the confirm button is team-1 red, "Annuller" is neutral. Behaviour (open/close, reset = clear saved state + reload) is unchanged.

## Out of scope

- New settings items, any change to reset logic, `clearQuizState`, the `m` key handling or `settingsOpen` state in `src/pages/index.tsx`.
- Editing anything outside the Owns list. **Owns: `src/components/SettingsMenu.tsx`, `src/components/ResetQuizSetting.tsx`.** Not `decor.tsx`, `styles.css`, `index.tsx`, `QuestionScreen.tsx`, `CLAUDE.md`. Sibling tasks run in parallel on those.
- Per-pack theming beyond tokens, new dependencies, tests, CI, committed screenshot scripts, sound.

## Decisions made

Settled by the master plan:
- All colour via token utilities (`bg-paper`, `text-ink`, `bg-accent`, `text-paper-lit`, `bg-night/80`, `text-ink-soft`); no raw hex; no `green-*`/`red-*`/`amber-*`/`gray-*`.
- Lay out in px against the 1920x1080 stage; no `vw`/`vh`. `fixed` inside `Stage` is relative to the stage.
- `font-display` = Mountains of Christmas (ribbon), `font-body` = Nunito. Icons: `material-symbols-outlined` (close). Decorative drawings are inline SVG `aria-hidden`; no emoji in chrome.
- Motion: none added (no entrance animation on the menu).
- UI text Danish, comments Danish, identifiers English. `exactOptionalPropertyTypes`: omit optional props instead of passing `undefined`.

Autonomous decisions (see section at the end).

## Architecture facts (verified)

- `SettingsMenu` (`src/components/SettingsMenu.tsx`, 32 lines) props: `onClose: () => void; children: ReactNode`. Renders a `fixed inset-0 z-50` overlay whose click closes it, and a card that `stopPropagation`s. Header has `<h2>Indstillinger</h2>` and a close button with `autoFocus`. It is used only at `src/pages/index.tsx:302` inside `<Stage>`, with `<ResetQuizSetting pack={quiz.name} />` as sole child. Keep props and export name.
- `ResetQuizSetting` (`src/components/ResetQuizSetting.tsx`) props `{ pack: string }`; `confirming` state; confirm calls `clearQuizState(props.pack)` then `window.location.reload()`; cancel sets `confirming` false; the idle state also shows the hint "Sletter point og lågernes rækkefølge og starter forfra." Keep all of it.
- `decor.tsx` exports `Paper`, `KeyCap`, `PillButton` (`PillButton` props: `ComponentProps<"button"> & { variant: "team-1" | "team-2" | "neutral" | "dark"; keyHint?: string }`; it is `type`-less, `min-w-[276px]`, `px-9 py-5`, `text-[34px]` (neutral 26px), `font-black`, `rounded-full`, with 7px solid bottom shadow except `neutral`). `Paper`: `relative bg-paper text-ink shadow-paper-edge rounded-[19px]` plus a dashed inner stitch (`inset-[10px] rounded-[12px] border-2`, `stitch` default `"accent"`), `className` appended, children rendered above the stitch div (give children `relative` to sit over it).
- The open-door card in `src/components/QuestionScreen.tsx:76-140` is the visual reference. Scrim: `fixed inset-0 z-40 bg-night/80 backdrop-blur-[4px]`. Close button: `size-[62px] rounded-full bg-ink/10 text-ink`, icon `text-[32px]`. Ribbon (lines ~137-149): a `h2` `rounded-b-[22px] bg-accent px-[67px] pt-3 pb-[17px] font-display text-[79px] font-bold leading-none text-paper-lit shadow-[0_7px_0_color-mix(in_oklab,var(--quiz-accent)_72%,black)]`, flanked by two 55x77 `bg-accent-deep` fold tails using `[clip-path:polygon(0_0,100%_0,100%_100%,0_100%,34%_50%)]` (left, `mt-[22px] -mr-[17px]`) and `[clip-path:polygon(0_0,100%_0,66%_50%,100%_100%,0_100%)]` (right, `mt-[22px] -ml-[17px]`).
- Tokens exist in `src/styles.css:16-49`. The shadows use `color-mix` on `var(--quiz-*)`.

## Implementation steps

1. `SettingsMenu.tsx`: keep the component signature and the click-outside/`stopPropagation` behaviour. Replace the overlay classes with `fixed inset-0 z-50 flex items-center justify-center bg-night/80 backdrop-blur-[4px]` (z-50 stays so it is above any door scrim).
2. Card: `<Paper className="w-[880px] px-[64px] pb-[56px]" ...>` wrapped so `onClick` can `stopPropagation` (`Paper` takes no `onClick`/`role` props, so put `role="dialog"`, `aria-label="Indstillinger"` and the `stopPropagation` handler on a plain wrapper `div` around the `Paper`). Children of `Paper` go in a `relative` flex column centred (`relative flex flex-col items-center`).
3. Ribbon heading: copy the door card's ribbon markup (three parts above) at ~0.75 scale: `h2` `text-[60px]`, `px-[50px] pt-2 pb-[13px]`, `rounded-b-[18px]`, tails 42x58 with `mt-[16px] -mr-[13px]` / `-ml-[13px]`, the shadow `0_5px_0`. Pull it up so it hangs from the card's top edge (`-mt-0.5` as the door does, parent has no top padding). Use the exact full class strings; do not build them dynamically.
4. Close button: `absolute right-[28px] top-[26px]`, same look as the door's (`flex size-[52px] cursor-pointer items-center justify-center rounded-full bg-ink/10 text-ink`, icon `text-[28px]`), keep `autoFocus`, `type="button"`, add `aria-label="Luk indstillinger"`, keep `onClick={() => props.onClose()}`.
5. Body: `<div className="relative mt-[44px] flex flex-col gap-[28px]">{props.children}</div>`.
6. `ResetQuizSetting.tsx`: replace the three raw buttons with `PillButton` imported from `./decor`:
   - idle: `<PillButton variant="dark" onClick={() => setConfirming(true)}>Nulstil quiz</PillButton>`; hint `<p>` becomes `text-[22px] font-semibold text-ink-soft`.
   - confirming: `<div className="flex gap-6">` with `<PillButton variant="team-1" onClick={...clear + reload as before}>Ja, nulstil quizzen</PillButton>` and `<PillButton variant="neutral" onClick={() => setConfirming(false)}>Annuller</PillButton>`. No `keyHint` (the `m` menu has no key bindings).
   - Layout wrappers keep the existing structure (`flex flex-col gap-2 items-start` becomes `gap-4`).
7. Run `npm run check`; then verify visually (below).

## Traps

- **Do not pass size/rounding overrides to `Paper` or `PillButton` through `className`.** Their base classes are also in the string; which one wins is decided by Tailwind's generated order, not DOM order (door-frame hit this with `rounded-[36px]`). Only add classes that do not conflict (`w-[880px]`, padding is not set by `Paper` so it is safe). For pill sizing accept the defaults. `decor.tsx` is not ours to change.
- **Do not put `onClick`/`role` on `Paper`**; its props do not forward them (type error). Use a wrapper div.
- **Do not build shadows from `var(--color-*)`.** `styles.css` uses `@theme inline`, so those variables may not exist at runtime; use `color-mix` on `var(--quiz-*)` as the door ribbon does.
- **Do not leave `bg-green-*`, `bg-red-*`, `bg-black/50`, `text-5xl`, or `max-w-xl`**: the old classes are exactly the raw-palette ones the redesign removes.
- **Do not change the reset flow.** No state setter before `clearQuizState` + reload (a state change would re-run the save effect in `index.tsx` and write the old quiz back). Do not add `autoFocus` to the confirm button.
- **Do not use `vh`/`vw`/`h-screen`**, and do not change the `m` toggling in `index.tsx` (not owned).
- Do not set optional props to `undefined`.
- Comments must ADD value: only a non-obvious why. None needed except, optionally, one Danish line that the wrapper div exists because `Paper` forwards no handlers. Everything else needs none.

## Verification

No new tests (small UI change, no branching logic). Steps:
1. `npm run check` passes (tsc + waku build).
2. Playwright screenshot script outside the repo (pre-installed Chromium, viewport 1920x1080) against `npm run dev` at `http://localhost:3000/julequiz/`: press `m`, screenshot the menu; click "Nulstil quiz", screenshot the confirm state; also one with a door open behind is not needed. Compare with the door card (same cream paper, accent stitch, ribbon, blur scrim). Check the ribbon tails align, the close button does not overlap the ribbon, and "Ja, nulstil quizzen" is not clipped.
3. Behaviour: Escape does not need to close (it did not before; `m` toggling is in `index.tsx`); clicking the scrim and the close button close it; "Annuller" returns to the idle state; confirming reloads with a fresh quiz (state cleared). Do not commit the screenshots or the script.

## Autonomous decisions

- Card built from `Paper` (with a wrapper div for the handlers) -> rejected a hand-built card like the door's, since `Paper` fits at this size and avoids duplicating the shadow.
- Ribbon copied locally at 0.75 scale in `SettingsMenu.tsx` -> rejected adding a shared `Ribbon` primitive (decor.tsx is not owned).
- Scrim identical to the door's (`bg-night/80` + 4px blur) -> rejected a lighter dim.
- Idle "Nulstil quiz" uses `variant="dark"` -> rejected `neutral`, so the destructive entry point is visibly a primary action.
- No `keyHint` on the pills and no new keyboard handling -> rejected adding Enter/Escape bindings (keyboard is out of scope).
- Pill sizes left at the defaults -> rejected overriding via `className` (Tailwind order trap).
- Menu has no entrance animation -> rejected a spring like the door card (master plan: motion only for ambient and door opening).
