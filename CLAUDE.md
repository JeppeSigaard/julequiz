# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projektet

Den store julequiz: en julekalender-quiz med låger (antallet bestemmes af den valgte quiz-pack),
vist på en storskærm og styret af en quizmaster med mus og tastatur. To hold dyster om point. Al
tekst i quizzen er på dansk; kommentarer og commit-beskeder er også på dansk, identifikatorer og
filnavne på engelsk.

## Kommandoer

| Kommando        | Gør                                                                   |
| --------------- | --------------------------------------------------------------------- |
| `npm run dev`   | Waku-devserver med hot reload (http://localhost:3000/julequiz/)       |
| `npm run check` | `tsc --noEmit` + `waku build`; skal passere, før noget meldes færdigt |
| `npm run build` | produktionsbuild til `dist/` (statisk genereret)                      |
| `npm start`     | serverer det byggede `dist/` (http://localhost:3000/julequiz/)        |

Der er ingen linter og ingen tests. `check` beviser kun, at det typechecker og bygger: om en låge
virker, ses kun ved at åbne den i browseren.

## Stack

Waku 0.27 (React Server Components) med React 19 og React Compiler (Babel-plugin i
`waku.config.ts`), Tailwind 4 via Vite-plugin, `motion` til animationer, `use-sound` til lyd.
`tsconfig.json` har `strict`, `noUncheckedIndexedAccess` og `exactOptionalPropertyTypes`.
`src/pages.gen.ts` genereres af Waku og redigeres ikke i hånden.

## Arkitektur

- `src/pages/_layout.tsx` er en serverkomponent (fonte, favicon, `styles.css`). Alt andet med
  tilstand, lyd eller browser-API'er er `"use client"`.
- `src/pages/index.tsx` vælger quiz-packen efter mount ud fra `?quiz=<pack>` (ellers `DEFAULT_QUIZ`
  i `src/config.ts`), fordi siden prerenderes uden URL'en; indtil da vises en tom grøn baggrund.
  Et ukendt navn viser en liste over packs som `?quiz=`-links. `QuizBoard` er hele quizzen for én
  pack: lågegitteret, holdenes point, baggrundsmusik, sneen og fyrværkeriet ved afslutning.
  Rækkefølgen blandes ved mount, hvis packen har `shuffle`; kun `QuestionCard`-prop'en får
  gitterpladsen, mens `Question.id` gemmes af `quizState.ts` (nøgle `julequiz-state-v2:<pack>`, én
  pr. pack) og skal være stabil.
- Point udledes, ikke lagres: antal vundne låger × packens `pointsPerQuestion` plus trøstepoint
  (+5 pr. klik på et holdnavn). Når hver låge uden `skip` er besvaret, skiftes til
  lynrundemusikken; brættets kolonner og blink udledes af antallet af låger. Titel, holdnavne
  (`teamNames`) og lågeord (`doorWord`) kommer også fra packens `quiz.ts`.
- `src/components/QuestionScreen.tsx` er den åbne låge. Tastatur: Enter/mellemrum viser svaret,
  1/2 giver lågen til et hold, q/x til ingen, Escape lukker eller går tilbage til spørgsmålet.
  Lågeord og holdnavne får den som props (`doorWord`, `teamNames`) fra packen.

### Spørgsmål

Hver quiz er en pack i `src/quizzes/<pack>/` (kebab-case): `quiz.ts` default-eksporterer en `Quiz`
(`src/types.ts`: titel, holdnavne, lågeord, shuffle, point, musik), og hver låge er en
`QuestionSpec` i `src/quizzes/<pack>/questions/NN-<slug>.tsx` med `export default`. Filnavnet uden
endelse er lågens id, og filnavnsrækkefølgen er den forfattede rækkefølge. `src/quizzes/index.ts`
finder alle packs med `import.meta.glob` (eager) og eksporterer `QUIZZES`. Kopiér en pack-mappe
for at lave en ny quiz. `toQuestion` i `src/questionTypes/index.tsx` laver en `QuestionSpec` til en
`Question` med én renderer-fil pr. type: `standard`, `wordPuzzle`, `music`, `posterReveal`,
`video` og `custom` (fri JSX; i jul-2025 kun låge 2, 7 og 8). `backgroundVolume` dæmper
baggrundsmusikken, mens lågen er åben, og `skip` gør lågen uvælgelig. Genbrugelige spil som
`MusicBox` (én sang som props), `WordPuzzle`, `GuessThatCat` (får sine billeder som `images`) og
`FoxChickenGrain` ligger i `src/components/`. Kopiér den nærmeste eksisterende låge.

### Medier

En packs billeder, video og lyd ligger i `public/quizzes/<pack>/images|video|audio/` (inkl.
baggrunds- og afslutningsmusikken) og refereres med absolut sti (`/quizzes/<pack>/images/…`), som
køres gennem `asset()` fra `src/asset.ts` præcis én gang, fordi quizzen kører under basestien
`/julequiz/` på GitHub Pages. Favicon ligger stadig i `public/images/`. Delte lydeffekter ligger i
`src/sfx/` og importeres som moduler (aldrig gennem `asset()`); Vites typer erklærer `*.mp3`.
`src/audio/` findes ikke mere.

## Arbejdsgang

`.claude/` indeholder skills og kommandoer: `/plan`, `/branch`, `/review`, `/pr`, `/land`,
`/initiative`, `/execute` og `/issue`, med developer- og reviewer-agenter. Fælles regler for kode
og git står i `.claude/skills/_shared/`. Commit aldrig direkte på `main`.
Hvert push til `main` udgives til GitHub Pages af `.github/workflows/deploy.yml`.
