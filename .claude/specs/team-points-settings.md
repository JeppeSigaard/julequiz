# Justér holdenes point fra indstillingsmenuen

> Status: in progress — claude/exciting-cray-jb9wsd

## Goal

Quizmasteren skal kunne lægge point til og trække point fra hvert hold i indstillingsmenuen
(`m`), fx for at rette et fejlklik på et holdnavn eller en låge, der blev givet til det forkerte
hold. Menuen får en række pr. hold med knapperne −100 −5 +5 +100 (100 = pakkens
`pointsPerQuestion`) over "Nulstil quiz". Justeringerne lægges i den eksisterende trøstepulje, så
gemt format og pointberegning er uændrede.

## Out of scope

- Ingen ny pulje, intet nyt felt i `SavedQuizState`, ingen ændring af storage-nøglen (`v2`).
- Intet pointtal i menuen (kun holdnavn og knapper).
- Ingen tastaturgenveje til justering, ingen ændring af `m`/Escape-håndteringen i `index.tsx`.
- Ingen nedre grænse: point må gerne blive negative.
- Ingen ændring af at klik på en plakette giver +5 med ding.
- Ingen ændring af `Paper`, `PillButton`, `KeyCap` eller `TeamPlaque`'s layout/størrelser.
- Ingen fortryd-knap, intet log over justeringer.

## Decisions made

- Pulje → genbrug `team1ConsolationPoints`/`team2ConsolationPoints`. Menuens knapper ændrer dem.
- Trin → −`pointsPerQuestion`, −5, +5, +`pointsPerQuestion` (i jul-2025: −100 −5 +5 +100).
  Tallene udledes af `quiz.pointsPerQuestion`, hardkod ikke 100.
- Negative point → tilladt, ingen clamp, hverken på puljen eller på totalen.
- Lyd → `ding.mp3` ved plus, `wrong2.mp3` (samme "ingen fik lågen"-lyd som i
  `QuestionScreen`) ved minus. Det gælder også plaketternes +5, som allerede dinger.
- Layout → én række pr. hold: holdnavn i holdfarve til venstre, fire runde knapper til højre.
  Intet pointtal. Sektionen ligger over `ResetQuizSetting`.
- Plakettens trøsteangivelse → skal vise fortegn korrekt, også negativt: `+5 trøst`, `0` som
  `+0 trøst`, og `−10 trøst` (Unicode-minus U+2212), aldrig `+-10 trøst`.

## Architecture facts (verified)

- `src/pages/index.tsx` (`QuizBoard`): trøstepoint er state `team1ConsolationPoints` /
  `team2ConsolationPoints` (l. 54–55). Totaler l. 114–117:
  `teamNCards.length * quiz.pointsPerQuestion + teamNConsolationPoints`. `handleConsolation`
  (l. 118–122) kalder `ding()` og lægger 5 til. Den gives som `onConsolation` til `EndScreen`
  (l. 225) og `BoardHeader` (l. 238), hvis prop-type er `(team: 1 | 2) => void`.
- Gem/indlæs: save-effekten (l. 168–187) gemmer allerede trøstepoint ved hver ændring, og
  `loadQuizState` i `src/quizState.ts` godtager ethvert `number`, også negative. Intet skal
  ændres der.
- Lyd: `const [ding] = useSound(dingSFX);` (l. 58) med `import dingSFX from "../sfx/ding.mp3";`.
  `src/components/QuestionScreen.tsx` l. 11/24 viser mønstret for `wrong2.mp3`.
- Menuen renderes l. 316–320:
  `<SettingsMenu onClose=…><ResetQuizSetting pack={quiz.name} /></SettingsMenu>`.
  `SettingsMenu` (`src/components/SettingsMenu.tsx`) lægger children i
  `relative mt-[44px] flex flex-col gap-[28px]`. Indholdsbredden er 880 − 2×64 = 752 px.
- `src/components/ResetQuizSetting.tsx` er mønstret for en indstillingskomponent:
  `"use client"`, navngiven eksport, `FunctionComponent<{…}>`, kun token-utilities.
- `TeamPlaque` i `src/components/decor.tsx` l. 135:
  `` {size === "board" ? `${doors} låger · +${consolation} trøst` : `point · ${doors} låger`} ``.
  Det er den eneste linje i `decor.tsx`, der skal ændres.
- Holdfarve-tokens: `text-team-1-deep`/`text-team-2-deep` (navn, som `PLAQUE_TEAM` i
  `decor.tsx`), `bg-team-1 text-team-1-ink`, `bg-team-2 text-team-2-ink`, `bg-ink/10 text-ink-soft`
  (neutral, som `PILL.neutral`), skygger `shadow-pill-team-1`/`shadow-pill-team-2`.
- `quiz.teamNames` er `readonly [string, string]` (se `BoardHeader`'s props).

## Implementation steps

1. **`src/pages/index.tsx`, lyd.** Tilføj `import wrongSFX from "../sfx/wrong2.mp3";` ved
   `dingSFX`-importen og `const [playWrong] = useSound(wrongSFX);` lige under `ding`-linjen.
2. **`src/pages/index.tsx`, justering.** Erstat `handleConsolation` med:
   ```ts
   const adjustConsolation = (team: 1 | 2, amount: number) => {
     if (amount > 0) ding();
     else playWrong();
     if (team === 1) setTeam1ConsolationPoints((current) => current + amount);
     else setTeam2ConsolationPoints((current) => current + amount);
   };
   ```
   Giv `EndScreen` og `BoardHeader` `onConsolation={(team) => adjustConsolation(team, 5)}`.
   Lad `BoardHeader`, `EndScreen` og deres prop-typer være som de er.
3. **Ny `src/components/TeamPointsSetting.tsx`**, efter mønstret fra `ResetQuizSetting.tsx`:
   - Props: `teamNames: readonly [string, string]`, `step: number` (få
     `quiz.pointsPerQuestion`), `onAdjust: (team: 1 | 2, amount: number) => void`.
   - Beløb i denne rækkefølge: `[-step, -5, 5, step]`. Etiket: `+N` for positive, `−N` med
     U+2212 for negative (`` `${amount > 0 ? "+" : "−"}${Math.abs(amount)}` ``).
   - Rod: `<div className="flex flex-col gap-[18px]">` med én række pr. hold (`[1, 2] as const`):
     `<div className="flex items-center gap-[14px]">`.
   - Holdnavn: `<span className="w-[220px] truncate font-black uppercase tracking-[0.08em] text-[26px] text-team-N-deep">`
     med `teamNames[team - 1]`.
   - Hver knap: almindelig `<button type="button">` (ikke `PillButton`), klasser
     `cursor-pointer h-[64px] w-[106px] rounded-full font-black text-[26px]` plus farve: minus
     `bg-ink/10 text-ink-soft`, plus `bg-team-N text-team-N-ink shadow-pill-team-N`. Brug opslag
     med fulde klassenavne (som `PILL`/`PLAQUE_TEAM` i `decor.tsx`), aldrig sammensatte strenge
     som `` `bg-team-${team}` ``.
   - `aria-label`: `` `${name}: ${etiket} point` ``. `onClick={() => props.onAdjust(team, amount)}`.
4. **`src/pages/index.tsx`, menu.** Indsæt over `ResetQuizSetting`:
   `<TeamPointsSetting teamNames={quiz.teamNames} step={quiz.pointsPerQuestion} onAdjust={adjustConsolation} />`
   og importér komponenten ved de andre komponentimporter.
5. **`src/components/decor.tsx` l. 135.** Vis fortegn korrekt i board-plaketten:
   `` `${doors} låger · ${consolation < 0 ? "−" : "+"}${Math.abs(consolation)} trøst` ``.
   Intet andet i `decor.tsx` ændres.
6. Kør `npm run check`. Commit på dansk, fx "Justér holdenes point fra indstillingsmenuen".

## Traps

- **Byg ikke Tailwind-klasser ved interpolation** (`` `bg-team-${team}` ``,
  `` `shadow-pill-team-${team}` ``). Tailwind finder kun klasser, der står som hele strenge i
  kilden, så de interpolerede klasser genereres ikke, og knapperne bliver farveløse uden nogen
  fejl. Brug et opslagsobjekt med fulde klassenavne pr. hold, som `PLAQUE_TEAM` i `decor.tsx`.
- **Brug ikke `PillButton` til justeringsknapperne.** Den har fast `min-w-[276px]` og
  `text-[34px]`, så fire pr. række fylder over 1.100 px i en menu på 752 px, og overstyring via
  `className` er upålidelig, fordi Tailwinds rækkefølge og ikke DOM-rækkefølgen afgør, hvilken
  klasse der vinder (se `redesign-settings`). Brug en almindelig `<button>`.
- **Clamp ikke.** Brugeren har valgt, at point må blive negative. Tilføj ikke `Math.max(0, …)`
  på puljen eller totalen, og indfør ingen deaktiverede knapper.
- **Indfør ikke en ny pulje eller nye felter i `SavedQuizState`.** `loadQuizState` returnerer
  `null` ved et uventet format, så et formatskift midt i en quiz sletter en igangværende quiz
  uden fejl. Puljen er besluttet: trøstepoint.
- **Lav ikke beløbet om til en streng med bindestreg i beregninger.** U+2212 bruges kun i
  visningsteksten. Beløb er tal (`-5`), og `Math.abs` laver etiketten.
- **Rør ikke `m`/Escape-håndteringen og fokus i `SettingsMenu`.** `autoFocus` på lukkeknappen og
  den globale keydown-handler i `index.tsx` er tidligere rettet (commit 05b7797). Knapperne er
  rene klik.
- **Lad `onConsolation`'s signatur være.** `BoardHeader` og `EndScreen` kalder den med kun hold;
  beløbet 5 bindes i `index.tsx`. Ændres prop-typen, skal flere filer røres uden grund.
- Sæt aldrig valgfrie props til `undefined` (`exactOptionalPropertyTypes`), og brug kun
  token-utilities: ingen rå hex og ingen paletteklasser (`red-`, `gray-` …).
- Kommentarer skal tilføre noget: kun en ikke-oplagt begrænsning eller et hvorfor. Denne ændring
  behøver ingen kommentarer.

## Review-rettelser (runde 2, godkendt af brugeren)

Fire fund fra review af 26c7c20. Ret dem oven på den eksisterende commit.

1. **`src/components/AnimatedNumber.tsx`: en afbrudt animation lander på den gamle værdi
   (blocker).** I dag starter hver animation fra `previousValue.current`, som først opdateres, når
   en animation er færdig. Effekten har heller ingen cleanup. +100 og så −100 inden for 1,2 s gør
   derfor følgende: anden kørsel ser start 0 og slut 0 og returnerer tidligt, mens første animation
   kører videre og lander på 100.
   - Ret: hold den viste værdi i en ref, som opdateres i hver frame. Start hver animation fra den
     ref. Gem id'et fra `requestAnimationFrame` og returnér en cleanup, der kalder
     `cancelAnimationFrame`.
   - Drop den tidlige `return` ved start === slut, eller lad den stå efter at den gamle animation er
     annulleret. Pointen er, at en ny værdi altid stopper den igangværende animation.
   - Behold props (`value`, `duration`), easing og varighed.
2. **`src/components/AnimatedNumber.tsx`: minus i pointtallet (minor).** Negative værdier vises
   med U+2212, fx `−105`, ligesom trøstelinjen. Formatér kun i render, så værdien forbliver et tal.
   `AnimatedNumber` bruges kun i `TeamPlaque` (`decor.tsx:132`).
3. **`src/components/TeamPointsSetting.tsx`: dobbelte beløb (minor).** Ved
   `pointsPerQuestion: 5` giver `[-step, -5, 5, step]` to ens knapper og dublerede React-keys.
   Ret: fjern dubletter med `[...new Set([-step, -5, 5, step])]`, og behold `key={amount}`.
4. **`CLAUDE.md` (minor).**
   - Linje ~48: trøstepoint er "+5 pr. klik på et holdnavn, og kan justeres op og ned, også under
     0, fra indstillingsmenuen".
   - Linje ~56: nævn `TeamPointsSetting`, som justerer holdenes trøstepoint med
     ±5/±`pointsPerQuestion`, ved siden af `ResetQuizSetting`.
   - Hold samme stil og linjebredde som resten af filen.

## Review-rettelser (runde 3, godkendt af brugeren)

To små fund fra review af 8452866. Ret dem oven på de eksisterende commits.

1. **`src/components/AnimatedNumber.tsx`:** sæt `if (startValue === endValue) return;` tilbage
   lige efter `const endValue = value;`. Det erstatter "drop den tidlige `return`" fra runde 2.
   Uden den kører hver mount en rAF-løkke på 1,2 s, der kun gentager den viste værdi. Den er
   sikker nu, fordi React kører den forrige effekts cleanup (`cancelAnimationFrame`) før den næste
   effekt, så en ny værdi stopper stadig en igangværende animation. Alt andet i filen bliver som
   det er.
2. **`CLAUDE.md` ~l. 48–50:** bryd punktet om point om, så ingen linje er længere end ca.
   100 tegn som resten af filen. Ordlyden ændres ikke.

## Verification

Ingen tests (projektet har ingen, og logikken er en simpel addition). Kør `npm run check`, som
skal passere. Rapportér outputtet ordret. I browseren (`npm run dev`,
http://localhost:3000/julequiz/):

- `m` åbner menuen med to rækker ("HOLD 1", "HOLD 2") og knapperne −100 −5 +5 +100 over
  "Nulstil quiz". Holdnavnene har holdfarve, og plusknapperne er røde (hold 1) og guld (hold 2).
- +5 på Hold 1: ding, og plaketten bag menuen viser 5 point og `+5 trøst`. +100: ding.
- −5 og −100: wrong-lyden. Point kan blive negative, og plaketten viser fx `−100 trøst`, ikke
  `+-100 trøst`.
- Genindlæs siden: justeringerne er bevaret.
- Klik på en plakette giver stadig +5 med ding, både på brættet og på `EndScreen`.
- Escape og `m` lukker stadig menuen. "Nulstil quiz" virker stadig.
