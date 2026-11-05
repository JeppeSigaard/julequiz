# Synligt vug på lågerne

> Status: in progress — claude/vibrant-fermi-cxdhwd

## Goal

PR 26 lod lågerne på brættet vugge i pærernes 2,4 s-takt, mens musikken spiller. Brugeren ser
ingen bevægelse i Chrome. Mekanismen virker (målt i Chromium: computed `rotate` svinger), men
udsvinget på ±0,9–1,5° flytter kun lågernes hjørner 2–4 px på en 274×139 px låge, så det
drukner i den faste tilt (op til ±1,35°). Udsvinget skal øges til et moderat, synligt niveau.

## Out of scope

- Ændring af mekanismen (`@property --sway`, `@keyframes sway`, transition, `animationDelay`,
  `SWAY_PHASES`, `origin-top`). Den virker i Chrome, som brugeren bruger.
- Safari/Firefox-robusthed (fx at fjerne `var()` fra keyframes).
- Hvornår der vugges (`sway={started}` i `src/pages/index.tsx`), takt (2,4 s) og faser.
- Den faste `tilt` i `QuestionCard`.
- `CLAUDE.md` — den nævner ingen vinkel og skal ikke ændres.

## Decisions made

- Browser, hvor fejlen sås → Chrome/Edge; ingen synlig bevægelse. Rettelsen er derfor kun
  amplituden.
- Udsvingets størrelse → moderat, ±2–2,5°: tre trin 2°, 2,25° og 2,5°, fordelt pr. låge med den
  eksisterende formel `(number * 5) % 3`, så nabolåger stadig svinger forskelligt.

## Architecture facts (verified)

- `src/components/QuestionCard.tsx:72`:
  `const swayAmount = sway && status !== "skip" ? 0.9 + ((number * 5) % 3) * 0.3 : 0;`
  Det giver 0,9/1,2/1,5°. Værdien sættes som `"--sway": \`${swayAmount}deg\`` i `style`
  (linje 77) og bruges af `@keyframes sway` i `src/styles.css:73-81`
  (`rotate: var(--sway)` ↔ `rotate: calc(var(--sway) * -1)`).
- `skip`-låger og tiden før titelklik giver 0 udsving; det skal forblive sådan.
- Der er ingen tests og ingen linter; `npm run check` er `tsc --noEmit` + `waku build`.

## Implementation steps

1. I `src/components/QuestionCard.tsx:72` ændr udtrykket til
   `0.9 + ((number * 5) % 3) * 0.3` → `2 + ((number * 5) % 3) * 0.25`.
   Resten af linjen (`sway && status !== "skip" ? … : 0`) er uændret.
2. Kør `npm run check`.
3. Commit med en dansk, imperativ besked, fx
   `Gør lågernes vug større, så det kan ses på storskærmen`.

## Traps

- **Rør ikke `src/styles.css` eller keyframes.** Det er fristende at "rette" mekanismen, men den
  er målt til at virke; en ændret keyframe-form kan bryde transitionen af `--sway`, som gør, at
  vuggen glider ind og ud. Ret kun tallet på linje 72.
- **Gå ikke over 2,5°.** Brugeren valgte moderat frem for kraftigt; lågerne står med 22 px
  mellemrum, og større vinkler får dem til at virke urolige.
- **Fjern ikke `status !== "skip"`-betingelsen eller `sway &&`.** Ellers vugger låger, der ikke
  kan vælges, og lågerne vugger før musikken er startet.
- Kommentarer: ingen nye. Den eksisterende kommentar over linje 72 forklarer allerede
  sammenhængen med Garland og gælder stadig.

## Verification

Ingen nye tests (en konstant-ændring, synlig ved læsning). Kør `npm run check`; det skal passere.
Hvis muligt: `npm run build && npm start`, åbn http://localhost:3000/julequiz/ (eller den port,
`npm start` melder), klik titlen, og læs `getComputedStyle(el).rotate` på `.animate-sway`-elementer
over et par sekunder. Forventet: `--sway` på 2deg/2.25deg/2.5deg, og `rotate` svinger mellem ca.
±samme værdi. Før titelklik og på `skip`-låger er `--sway` 0deg.
