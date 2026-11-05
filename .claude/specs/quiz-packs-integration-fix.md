# Quiz packs: brættet skal passe på skærmen

> Status: in progress — quiz-packs-integration-fix

## Goal

Med en pack på 3 låger giver `gridColumns(3)` 2 kolonner, og hver `aspect-video`-låge (fuld cellebredde) bliver 420-510 px høj. Brættet vokser ud over viewporten og klipper (`h-screen overflow-hidden items-center`): ved 1920x1080 er titelknappen ved top -60, holdnavnene ved -36..4 og brættet spænder -84..1165. Rettelsen: for 1 til ~30 låger skal titel, holdnavne og alle låger være synlige ved 1920x1080 og 1600x900. `jul-2025` (24 låger, 6 kolonner) må ikke ændre udseende.

## Out of scope

- Svarskærmens overflow på høje billede+billedtekst-slides, den løse `console.log(bgsound)` i `pickQuestion`, `gridColumns`-formlen, og alt uden for de to filer.
- Nye afhængigheder, tests, ændringer i `src/questions/`, `src/types.ts`, `src/quizzes/`, `src/pages.gen.ts`.

## Decisions made (settled, fra masterplanen)

- Låge-antal udledes; "Nothing may assume 24" (shared.md). Ingen konstant 24, ingen særbehandling af jul-2025.
- Temafarver er CSS-variabler (`bg-(--color-board)`, `bg-(--color-door)` osv.); behold dem uændret.
- Ejer kun `src/pages/index.tsx`, `src/components/QuestionCard.tsx` og denne spec.

## Architecture facts (verified)

- `src/pages/index.tsx:34` `gridColumns(count) = max(1, round(sqrt(count*1.5)))`: 3 giver 2, 24 giver 6.
- `index.tsx:221-222`: ydre `div` `p-6 ... h-screen overflow-hidden flex items-center justify-center`; board `div` `aspect-video ... w-full rounded-lg p-6`. Brættets højde er altså givet af bredden, uafhængigt af antal låger.
- `index.tsx:224`: `<header className="text-center relative flex justify-center mb-12">`; holdnavnene er en absolut `dl` i headeren.
- `index.tsx:~285-295`: `<main className="grid gap-4 ...">` med inline `gridTemplateColumns: repeat(${columns}, minmax(0, 1fr))`; `columns` er beregnet på linje 128.
- `QuestionCard.tsx:~23`: knappen har `aspect-video` i sin classNames-streng; den bestemmer lågens højde ud fra cellebredden.

## Implementation steps

Idé: lad brættet beholde sin nuværende størrelse (derfor er jul-2025 uændret), men giv `main` den resterende højde som et rækkegitter, og lad lågerne krympe, så de aldrig overskrider deres række.

1. `index.tsx` board-`div` (linje 222): tilføj `flex flex-col` til klasserne. Behold `aspect-video`, `w-full`, `p-6`, farveklasse.
2. `index.tsx` `<main>` (~linje 285): tilføj klasserne `flex-1 min-h-0`, og udvid inline-style med `gridTemplateRows: repeat(${rows}, minmax(0, 1fr))`. Beregn `const rows = Math.ceil(questions.length / columns);` lige efter `const columns = gridColumns(...)` (linje 128).
3. `QuestionCard.tsx`: tilføj `max-h-full max-w-full self-center justify-self-center` til den faste klassestreng sammen med `aspect-video`. Rør ikke de betingede farveklasser.
4. Mål (se Verification). Hvis lågerne i jul-2025 ændrer størrelse (rækkehøjden er mindre end lågens naturlige højde), så er brættets højde-budget for snævert: justér kun `header`'s `mb-12` ned i trin af 4 (`mb-8`, ...) til jul-2025 er pixel-identisk. Hvis `max-h-full` ikke løses mod gitterrækken i browseren, så sæt `min-h-0` på kortet og prøv `h-full` + `aspect-video` + `max-w-full` i stedet.

## Traps

- **Brug ikke `grid-cols-${columns}` eller `grid-rows-${rows}`.** Tailwind 4 scanner kildetekst; dynamiske klasser findes ikke i buildet. Brug inline `gridTemplateRows`/`gridTemplateColumns` (som dynamic-board-specen fandt).
- **Ændr ikke brættets `aspect-video w-full` til `h-full` eller `max-h`.** Det ændrer brættets bredde og dermed jul-2025's lågestørrelse; kravet er, at 24 låger ser nøjagtig ens ud. Kun `main` og kortene justeres.
- **Rør ikke `isLoaded`-porten eller læs `window` under render**; siden er statisk prerenderet.
- **Hårdkod ikke 3, 6 eller 24, og ret ikke `gridColumns`.** Kolonnetallet er afstemt til 24 låger; fixet er layout, ikke formel.
- Brug ikke `overflow-hidden` på `main` for at skjule problemet; låger må ikke klippes.
- Kommentarer: ingen nødvendige; skriv ingen.

## Verification

`npm run check` skal passere (beviser kun typer/build). Layout verificeres med Playwright (brug den, der allerede er installeret, ellers `npx playwright` uden at tilføje afhængighed til `package.json`; scripts og skærmbilleder i scratchpad, ikke i repoet).

1. FØR ændring (på ren gren): start `npm run dev`, åbn `/?quiz=jul-2025` ved 1920x1080 og 1600x900, tag skærmbilleder og mål `getBoundingClientRect()` for `h1 button`, de to holdknapper og første/sidste dørknap.
2. Efter ændring: gentag, og sammenlign. jul-2025 skal være identisk (samme rects, visuel diff uden forskel).
3. Midlertidig, ucommittet 3-låge pack (kopiér `src/quizzes/jul-2025` til en ny pack med 3 spørgsmål og registrér den i `src/quizzes/index.ts`; åbn `/?quiz=<navn>`). Mål ved begge opløsninger: titel, begge holdnavne og alle 3 låger har `top >= 0` og `bottom <= innerHeight`, og ingen vandret overflow. Gentag for 1, 2, 7 og 30 låger.
4. Tryk start og åbn/luk en låge; tjek at brættet ikke hopper. Fjern den midlertidige pack og registreringen med `git checkout`/sletning før afslutning; `git status` må kun vise de to ejede filer.

## Autonomous decisions

- Behold brættets `aspect-video w-full` og krymp lågerne i et rækkegitter; afvist: gøre brættet `h-full` (ændrer jul-2025's bredde).
- Lågerne begrænses med `max-h-full` på kortet; afvist: beregne lågehøjde i JS ud fra `window.innerHeight` (kræver browser-API under render/resize-lytter).
- Rækketal afledes af `Math.ceil(count / columns)`; afvist: ændre `gridColumns` så flere kolonner bruges ved få låger.
- Fallback ved uændret jul-2025 er at mindske `mb-12`; afvist: skalere hele brættet med CSS `transform: scale`.

## Afvigelser fra planen (fundet ved måling)

- `max-h-full` alene kollapsede lågerne (bredde auto). `h-full` + aspect gav højere låger i jul-2025.
- Endelig løsning: kortet `aspect-video w-full max-h-full min-h-0 self-center justify-self-center`; `main` `flex-1 min-h-0 content-start` med `gridTemplateRows: repeat(rows, minmax(0, auto))` (ikke `1fr`, som strakte rækkerne og flyttede jul-2025). Med få låger bliver lågerne bredere end 16:9, fordi højden begrænses af rækken.
