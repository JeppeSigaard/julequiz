# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projektet

Den store julequiz: en julekalender-quiz med 24 låger, vist på en storskærm og styret af en
quizmaster med mus og tastatur. To hold dyster om point. Al tekst i quizzen er på dansk; kommentarer
og commit-beskeder er også på dansk, identifikatorer og filnavne på engelsk.

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
- `src/pages/index.tsx` er hele quizzen i én klientkomponent: lågegitteret, holdenes point,
  baggrundsmusik, sneen og fyrværkeriet ved afslutning. Rækkefølgen blandes ved mount; kun
  `QuestionCard`-prop'en får gitterpladsen, mens `Question.id` gemmes af `quizState.ts` og skal
  være stabil.
- Point udledes, ikke lagres: antal vundne låger × `POINTS_PER_QUESTION` plus trøstepoint (+5 pr.
  klik på et holdnavn). Når hver låge uden `skip` er besvaret, skiftes til
  lynrundemusikken; brættets kolonner og blink udledes af antallet af låger. Der er ingen
  lynrunde-konstant.
- `src/components/QuestionScreen.tsx` er den åbne låge. Tastatur: Enter/mellemrum viser svaret,
  1/2 giver lågen til et hold, q/x til ingen, Escape lukker eller går tilbage til spørgsmålet.
  Holdknapperne her skriver "Hold 1"/"Hold 2" direkte i stedet for at bruge `TEAM_NAMES`.

### Spørgsmål

Hver låge er en `QuestionSpec` (`src/types.ts`) i sin egen `src/questions/QuestionN.tsx`, og
`src/questions/index.ts` giver den id `"1"`-`"24"` efter position. `toQuestion` i
`src/questionTypes/index.tsx` laver den til en `Question` med én renderer-fil pr. type:
`standard`, `wordPuzzle`, `music`, `posterReveal`, `video` og `custom` (fri JSX; kun låge 2, 7 og
8). `backgroundVolume` dæmper baggrundsmusikken, mens lågen er åben, og `skip` gør lågen
uvælgelig. Genbrugelige spil som `MusicBox` (én sang som props), `WordPuzzle`, `GuessThatCat` og
`FoxChickenGrain` ligger i `src/components/`. Kopiér den nærmeste eksisterende låge.

### Medier

Billeder, video og lyd ligger i `public/images/`, `public/video/` og `public/audio/` og refereres gennem `asset("/images/…")` fra
`src/asset.ts`, fordi quizzen kører under basestien `/julequiz/` på GitHub Pages. Quizsangene
ligger i `public/audio/`. `src/audio/` rummer den baggrunds- og afslutningsmusik, der importeres
som moduler (som lydeffekterne i `src/sfx/`); Vites typer erklærer `*.mp3`.

## Arbejdsgang

`.claude/` indeholder skills og kommandoer: `/plan`, `/branch`, `/review`, `/pr`, `/land`,
`/initiative`, `/execute` og `/issue`, med developer- og reviewer-agenter. Fælles regler for kode
og git står i `.claude/skills/_shared/`. Commit aldrig direkte på `main`.
Hvert push til `main` udgives til GitHub Pages af `.github/workflows/deploy.yml`.
