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
  baggrundsmusik, sneen og fyrværkeriet ved afslutning. Rækkefølgen blandes ved mount, og hver
  låges `id` overskrives med dens plads i gitteret, så `Question.id` er kun en React-nøgle.
- Point udledes, ikke lagres: antal vundne låger × `POINTS_PER_QUESTION` plus trøstepoint (+5 pr.
  klik på et holdnavn). Når alle 24 låger er besvaret (hårdkodet i `index.tsx`), skiftes til
  lynrundemusikken. `LIGHTNING_ROUND_POINTS` i `src/config.ts` læses ikke af koden.
- `src/components/QuestionScreen.tsx` er den åbne låge. Tastatur: Enter/mellemrum viser svaret,
  1/2 giver lågen til et hold, q/x til ingen, Escape lukker eller går tilbage til spørgsmålet.
  Holdknapperne her skriver "Hold 1"/"Hold 2" direkte i stedet for at bruge `TEAM_NAMES`.

### Spørgsmål

Hver låge er en `Question` (`src/types.ts`) i sin egen `src/questions/QuestionN.tsx`, registreret i
`src/questions/index.ts`. `body` og `answer` er fri JSX, så en låge kan være alt fra et billede til
et lille spil (`FoxChickenGrain`, `WordPuzzle`, `GuessThatCat`, `MusicBox` i `src/components/`).
`setVolume` dæmper baggrundsmusikken, mens lågen er åben (til låger med egen lyd eller video), og
`skip` gør lågen uvælgelig. Kopiér den nærmeste eksisterende låge frem for at opfinde en ny form.

### Medier

Billeder, video og lyd ligger i `public/images/`, `public/video/` og `public/audio/` (sidstnævnte til
lyd, der afspilles direkte med `<audio>`) og refereres gennem `asset("/images/…")` fra
`src/asset.ts`, fordi quizzen kører under basestien `/julequiz/` på GitHub Pages. Musik og
lydeffekter, som koden bruger, importeres i stedet som moduler fra `src/audio/` (musik) og
`src/sfx/` (effekter); `src/env.d.ts` erklærer `*.mp3`.

## Arbejdsgang

`.claude/` indeholder skills og kommandoer: `/plan`, `/branch`, `/review`, `/pr`, `/land`,
`/initiative`, `/execute` og `/issue`, med developer- og reviewer-agenter. Fælles regler for kode
og git står i `.claude/skills/_shared/`. Commit aldrig direkte på `main`.
Hvert push til `main` udgives til GitHub Pages af `.github/workflows/deploy.yml`.
