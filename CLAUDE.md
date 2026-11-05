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
| `npm start`     | serverer det byggede `dist/` (http://localhost:8080/julequiz/)        |

Der er ingen linter og ingen tests. `check` beviser kun, at det typechecker og bygger: om en låge
virker, ses kun ved at åbne den i browseren.

## Stack

Waku 0.27 (React Server Components) med React 19 og React Compiler (Babel-plugin i
`waku.config.ts`), Tailwind 4 via Vite-plugin, `motion` til animationer, `use-sound` til lyd,
`react-snowfall` og `@fireworks-js/react`. `tsconfig.json` har `strict`, `noUncheckedIndexedAccess`
og `exactOptionalPropertyTypes`. `src/pages.gen.ts` genereres af Waku og redigeres ikke i hånden.

## Arkitektur

- `src/pages/_layout.tsx` er en serverkomponent (fonte, `<title>`, meta/OG-tags, ikoner,
  `styles.css`); `_root.tsx` sætter kun `<html lang="da">` og bevarer Waku's `ErrorBoundary`. Alt
  andet med tilstand, lyd eller browser-API'er er `"use client"`.
- `src/components/Stage.tsx` er en fast 1920×1080-scene, skaleret til vinduet med `scale()`. Al
  layout bruger derfor px (`cqmin` kun inde i en `[container-type:size]`, som `QuestionCard`),
  aldrig `vw`/`vh`, og `fixed` inde i scenen er scene-relativ.
- `src/pages/index.tsx` er to klientkomponenter. `HomePage` vælger pakken efter mount, fordi siden
  prærenderes uden URL'en og indtil da kun viser en tom `bg-night`; `QuizBoard` er selve quizzen.
  I `QuizBoard` omslutter `Stage` `Snowfall` (kun efter
  titelklik), derefter enten `EndScreen` eller `Garland` + `BoardHeader` + gitter af `QuestionCard`
  + `Footer`, så `QuestionScreen` og `SettingsMenu`. Pakken vælges med `?quiz=<navn>` (standard
  `DEFAULT_QUIZ` i `src/config.ts`); et ukendt navn viser en liste over pakker uden `Stage`.
  Gitterets kolonner og glødegrupper udledes af antal låger (`gridColumns`, `tickGroup`), og
  rækkefølgen blandes ved mount, hvis `Quiz.shuffle` er sat. `QuestionCard` får ikke spørgsmålet,
  kun nummer, status og visningsprops.
- Board-delene (`Garland`, `BoardHeader`, `Footer`) ligger i `src/components/board/`.
- Point udledes, ikke lagres: antal vundne låger × `Quiz.pointsPerQuestion` plus trøstepoint (+5 pr.
  klik på et holdnavn, og kan justeres op og ned, også under 0, fra indstillingsmenuen). Staten
  gemmes i `localStorage` pr. pakke (`src/quizState.ts`, format `v2`).
  Når alle låger, der ikke er `skip`, er besvaret, vises `EndScreen` i stedet for header og gitter:
  den har sin egen `Snowfall` og `Fireworks`, kroner lederen, viser "Uafgjort!" ved lige point, og
  plaketterne giver stadig +5 ved klik. Samtidig skiftes baggrundsmusikken til `music.finale`.
- `src/components/QuestionScreen.tsx` er den åbne låge: et papirkort med bånd, kristtorn og
  sløret mørk baggrund. Tastatur: Enter/mellemrum viser svaret, 1/2 giver lågen til et hold, q/x til
  ingen, Escape lukker eller går tilbage til spørgsmålet. `m` åbner indstillinger (`SettingsMenu`,
  Escape lukker), når ingen låge er åben; `p` starter prøverunden (også "Start prøverunde" i
  indstillingerne); `TeamNamesSetting` ændrer holdnavnene (gemt pr. pakke under sin egen nøgle i
  `src/quizState.ts`, så de overlever nulstilling; et tomt felt falder tilbage til
  `Quiz.teamNames`), `TeamPointsSetting` justerer holdenes trøstepoint med
  ±5/±`pointsPerQuestion`, og `ResetQuizSetting` nulstiller pakkens gemte quiz.

### Quiz-pakker

En pakke er `src/quizzes/<navn>/quiz.ts` (`Quiz` i `src/types.ts`: titel, holdnavne, `doorWord`,
`shuffle`, `pointsPerQuestion`, `music.background`/`music.finale` og de syv `colors`) plus
`src/quizzes/<navn>/questions/*.tsx`, hver med en `QuestionSpec` som default-eksport. Filnavnet
bestemmer rækkefølgen før blanding og er lågens `id`. `src/quizzes/index.ts` finder pakkerne med
`import.meta.glob`, så en ekstra mappe udgives med det samme (slet testpakker igen). Medier ligger
i `public/quizzes/<navn>/{audio,images,video}` og refereres som `/quizzes/<navn>/…`.

`QuestionSpec.type` er `standard`, `wordPuzzle`, `music`, `posterReveal`, `video` eller `custom`
(fri JSX som `FoxChickenGrain`, `GuessThatCat`). `toQuestion` i `src/questionTypes/index.tsx` laver
dem til `Question` (`body`/`answer`/`setVolume`/`skip`) med renderere i `src/questionTypes/`;
dørindholdets størrelsestrin (fx `textSize`, `mediaFrame` i `Standard.tsx`) bor i rendererne.
`backgroundVolume` dæmper baggrundsmusikken, mens lågen er åben (uanset det skærer `useMuffle` i
`src/muffle.ts` diskanten af den med et lavpasfilter, mens en låge, et prøvespørgsmål eller
indstillingsmenuen er åben), og `skip` gør lågen uvælgelig. Alle
lågers og prøvespørgsmåls billeder, video og lyd (`Question.preload`: rå stier fra begge sider,
udledt i `toQuestion`; en `custom`-låge angiver selv alle sine medier med `preload`) og lågens
lydeffekter hentes som blobs ved start af `preloadMedia` i `src/mediaCache.ts`, mens footeren viser
fremskridtet. Renderere opløser stier med `useAsset` (lydeffekterne i `QuestionScreen`, `Music` og
`GuessThatCat` med `useCachedUrl`; `WordPuzzle`s `ding`/`wrong2` har brættets `use-sound` allerede
hentet) én gang pr. montering, og `useSound` skal have `format`, fordi en `blob:`-URL ingen
filendelse har. En ny type skal tilføjes i
`QuestionSpec` og i `toQuestion` (switchen har ingen default med vilje). Kopiér den nærmeste
eksisterende låge frem for at opfinde en ny form.

Pakkens prøvespørgsmål ligger i `src/quizzes/<navn>/practice/*.tsx` (samme `QuestionSpec`-form,
filrækkefølge). De åbnes i samme lågekort med `Prøve <n>` som bånd, giver aldrig point og gemmes
ikke; en pakke uden `practice/` har ingen prøverunde.

### Farver og stil

- Pakkens `colors` (background, paper, ink, accent, highlight, team1, team2) sættes af `Stage` som
  `--quiz-*` på det yderste element. `src/styles.css` har standardværdier på `:root` og afleder alle
  farvetokens i `@theme inline` (bl.a. night, felt, paper, snow, mist, ink, accent, highlight,
  team-1/2 og deres suffikser `-deep`/`-lit`/`-soft`/`-edge`/`-ink`), så en ny pakkefarve
  omfarver alle skærme. Hold 1 er rød, Hold 2 guld.
- Brug kun token-utilities (`bg-paper`, `text-ink-soft`, `border-accent/55` …): ingen rå hex og ingen
  Tailwind-paletteklasser (`green-`, `red-`, `amber-`, `gray-`).
- Faldgrube: afledte tokens må ALDRIG bruges som `var(--color-<afledt>)` i arbitrary values (fx
  `shadow-[…var(--color-accent-deep)…]`). Pga. `inline` opløses de på `:root` mod standard-`--quiz-*`
  og følger ikke pakkens farver. Skriv `color-mix(in oklab, var(--quiz-accent) 72%, black)`. Fjern
  ikke `inline` fra `@theme`.
- Fonte: `font-display` (Mountains of Christmas) til overskrifter og tal, `font-body` (Nunito) til
  resten. Animationer: `animate-twinkle` (pærerne i `Garland`), `animate-glow` (lågens glød),
  `animate-sway` (lågerne vugger i pærernes 2,4 s-takt med forskudt fase, mens musikken spiller;
  animationen kører altid, og `sway` skruer kun det registrerede `--sway`-udsving op og ned; slået fra for nu med `sway={false}` i `index.tsx`) og
  `animate-flicker` (guirlanden er dæmpet med `brightness(0.3) saturate(0.4)` og titlen og snirklen
  med `brightness(0.65) saturate(0.7)`, indtil quizzen startes, og de blinker én gang op, når den
  startes; stop slukker dem uden blink). `@keyframes sway` animerer det registrerede tal
  `--sway-swing`, og wrapperen ganger det på `--sway`: brug aldrig `var()` i keyframes for
  `rotate`/`transform`/`opacity`, for Chrome kører dem på compositoren med variablens værdi fra
  animationens start. Bevægelse ud over de fire animationer og lågens åbning (`motion`) er ikke
  ønsket.
- `src/components/decor.tsx` har de fælles primitiver: `Paper` (stiplet søm, valgfri `stitchSize`),
  `KeyCap`, `PillButton` (`team-1`/`team-2`/`neutral`/`dark`, valgfri `keyHint`) og `TeamPlaque`
  (`board`/`end`, bruger `AnimatedNumber`). Kendte grænser: `Paper` har fast radius og skygge,
  `PillButton` fast skriftstørrelse og min-bredde med tastehint efter teksten, og `TeamPlaque` har
  ingen vinderring (det klarer `EndScreen` udenom) og krymper lange holdnavne efter antal tegn
  (`nameFontSize`), så de står på højst to linjer. Skærmene er trimmet efter dem; ændr dem ikke
  uden at se alle skærme igennem.

### Medier

Billeder, video og lyd til en pakke ligger i `public/quizzes/<navn>/…`. Specs og `quiz.ts` giver den
almindelige sti `/quizzes/<navn>/…`; renderere og komponenter kører den gennem `useAsset()` fra
`src/mediaCache.ts`, som kalder `asset()` fra `src/asset.ts` præcis én gang, fordi quizzen kører
under basestien `/julequiz/` på GitHub Pages (`public/images/` rummer kun ikoner og delingsbilledet;
kilden er `icon.svg`). Kun håndskrevne komponenter til en `custom`-låge kalder selv
`cachedUrl(asset(…))`. Lydeffekter, som koden bruger, importeres som moduler fra `src/sfx/`;
`src/env.d.ts` erklærer `*.mp3`, og de importerede URL'er går aldrig gennem `asset()`. Pakkens musik
angives som sti i `quiz.ts`.

## Arbejdsgang

`.claude/` indeholder skills og kommandoer: `/plan`, `/branch`, `/review`, `/pr`, `/land`,
`/initiative`, `/execute` og `/issue`, med developer- og reviewer-agenter. Fælles regler for kode
og git står i `.claude/skills/_shared/`. Commit aldrig direkte på `main`.
Hvert push til `main` udgives til GitHub Pages af `.github/workflows/deploy.yml`.
