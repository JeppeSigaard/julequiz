# Slukket lys før start

> Status: in progress — claude/fervent-euler-eceyje

## Goal

Før quizmasteren har startet quizzen (klik på titlen), er guirlandens pærer og titlen med
snirklen under den "slukket": dæmpede og uden glød. Klikket på titlen tænder dem med et kort
lysstofrørs-blink (~1,1 s), samtidig med at musik, sne, vuggen og lågegløden starter som i dag.
Stoppes quizzen med et nyt klik på titlen, slukker lyset igen med det samme. Samtidig øges
snefaldet en smule.

## Out of scope

- Ingen ny lydeffekt og ingen ændring af hvornår musik, sne, sway eller glød starter.
- Snefaldets øvrige props (`radius`, `opacity`, `color`) ændres ikke; kun antallet af fnug.
- Undertitlen (`{doorCount} låger · 2 hold · 1 vinder`), holdskiltene, gitteret, footeren og
  `EndScreen` ændres ikke.
- Ingen timer/forsinkelse i JS; ingen brug af `motion` til blinket.
- `started` gemmes ikke i `localStorage` (tavlen er altid slukket efter genindlæsning).

## Decisions made

- Hvad slukkes → pærerne i `Garland` (hele guirlanden inkl. ledningen), titlen (`<h1>`) og den
  gyldne snirkel/stjerne-SVG under titlen. Intet andet.
- Tænding → på selve klikket blinker lyset ~1,1 s og lyser derefter fast; alt andet starter på
  klikket som i dag. Ingen lyd.
- Stop → lyset slukker øjeblikkeligt uden blink; næste klik tænder igen med blink.
- Slukket-niveau → guirlanden: `brightness(0.3) saturate(0.4)`. Titlen og snirklen (brugerens
  tilføjelse efter første review: "gør titlen lidt lysere i slukket tilstand, og snirklen"):
  `brightness(0.5) saturate(0.6)`. `@keyframes flicker` er uændret; dens OFF-trin (0.3/0.4)
  gælder også titel og snirkel under blinket, så de dykker en anelse dybere end hvilende slukket,
  mens de blinker. Det er ønsket og kræver ingen variabel eller ekstra keyframes. Blinket er stadig
  synkront på alle tre.
- Snefald (brugerens tilføjelse: "øg også snefaldet en smule") → `snowflakeCount` fra 60 til 90
  både på tavlen og i `EndScreen`, så de to forbliver ens.

## Architecture facts (verified)

- `src/pages/index.tsx`: `QuizBoard` har `const [started, setStarted] = useState(false)`;
  `startQuiz` sætter `true`, `stopQuiz` sætter `false`; titlens `onTitleClick` skifter mellem dem.
  `<Garland />` og `<BoardHeader … />` renderes kun, når `!isFinished`. `QuestionCard` får allerede
  `sway={started}` — samme mønster bruges her til `lit={started}`.
- `src/components/board/Garland.tsx`: komponent uden props. Yderste `<div aria-hidden … className=
  "absolute top-0 left-0 w-full h-[108px] pointer-events-none">` rummer ledningens SVG og pærerne.
  Hver pære er en `<span className="absolute animate-twinkle …">` med `animationDelay`.
- `src/components/board/BoardHeader.tsx`: midterkolonnen har `<span>` (undertitel), `<h1><button
  onClick={onTitleClick} …>{title}</button></h1>` og en `<svg aria-hidden width={504} height={31}>`
  (snirkel + stjerne).
- `src/styles.css`: animationer defineres i `@theme inline` som `--animate-<navn>` + `@keyframes`
  (se `twinkle`, `glow`, `sway`); Tailwind genererer så `animate-<navn>`. `twinkle` animerer selv
  `filter: brightness(...)` på hver pære.
- `QuestionCard`s `animate-sway` kører altid fra mount for at holde takt med `Garland`s
  `animate-twinkle` (2,4 s, forskudte faser).

## Implementation steps

1. `src/styles.css`, i `@theme inline`:
   - Tilføj `--animate-flicker: flicker 1.1s linear;` efter `--animate-sway` (kører én gang).
   - Tilføj `@keyframes flicker` efter `@keyframes glow` med præcis disse trin, hvor OFF =
     `filter: brightness(0.3) saturate(0.4);` og ON = `filter: brightness(1) saturate(1);`:
     `0%` OFF, `8%` ON, `12%` OFF, `22%` ON, `26%` OFF, `45%` OFF, `50%` ON, `56%` OFF,
     `62%` ON, `100%` ON. (Samme procent med samme værdi kan samles i én selektor, som
     `0%, 100%` i `twinkle`.)
2. `src/components/board/Garland.tsx`: giv komponenten prop `lit: boolean`
   (`export const Garland: FC<{ lit: boolean }> = ({ lit }) => (`). Tilføj på det yderste `<div>`
   klassen `animate-flicker`, når `lit`, ellers `[filter:brightness(0.3)_saturate(0.4)]`. Byg
   className med en template-streng som pæren gør i samme fil. Rør ikke pærernes egne klasser.
3. `src/components/board/BoardHeader.tsx`: tilføj prop `lit: boolean` i typen og destruktureringen.
   Definér øverst i komponenten en konstant, fx `const light = lit ? "animate-flicker" :
   "[filter:brightness(0.5)_saturate(0.6)]";` — komponenten er i dag en pil med implicit return;
   omskriv den til krop med `return (…)`. Tilføj `light` til `<h1>`'s className (h1 har i dag ingen
   className) og til snirkel-`<svg>`'s className. Undertitlens `<span>` og holdskiltene får den
   ikke.
4. `src/pages/index.tsx`: send `lit={started}` til `<Garland />` og til `<BoardHeader … />`.
5. Sæt `snowflakeCount={60}` til `snowflakeCount={90}` i `<Snowfall>` i `src/pages/index.tsx`
   (i `QuizBoard`, bag `started &&`) og i `src/components/EndScreen.tsx` (linje ~49).
6. `CLAUDE.md`, afsnittet "Farver og stil", punktet om animationer: tilføj `animate-flicker`
   (guirlanden er dæmpet med `brightness(0.3) saturate(0.4)` og titel/snirkel med
   `brightness(0.5) saturate(0.6)`, indtil quizzen
   startes, og blinker én gang op, når den startes; stop slukker dem uden blink). Hold det til én
   sætning i samme stil.

## Traps

- **Fjern ikke `animate-twinkle` fra pærerne, når lyset er slukket, og læg ikke slukket-filteret
  på pære-`<span>`'erne.** Twinkle animerer selv `filter` på pæren, så et filter dér overskrives af
  animationen; og fjernes/genindsættes animationen, genstarter den med ny fase og kommer ud af takt
  med lågernes `animate-sway`, som med vilje kører fra mount. Dæmp i stedet guirlandens yderste
  `<div>`, hvis filter lægges oven på pærernes.
- **Brug ikke `transition` på `filter` og ikke `motion`.** En transition giver en blød fade i
  stedet for blink og ville også fade ved stop, hvor lyset skal slukke øjeblikkeligt; CLAUDE.md
  forbyder bevægelse med `motion` ud over lågens åbning. Blinket er alene CSS-animationen, der
  starter, fordi klassen `animate-flicker` tilføjes; når klassen fjernes, gælder slukket-filteret
  straks.
- **Brug ikke `animation-fill-mode: forwards`, og læg ikke `animate-flicker` på, når `lit` er
  false.** Slutværdien er identisk med elementets normale tilstand (intet filter), så forwards er
  unødvendigt; og blinket må kun ske ved klik, ikke ved mount/genindlæsning.
- **Brug ikke Tailwinds `brightness-*`/`saturate-*`-utilities til slukket-tilstanden.** De sætter
  `filter` via `--tw-*`-variabler, så værdien ikke står ordret som i keyframes; brug den arbitrære
  egenskab `[filter:brightness(0.3)_saturate(0.4)]` / `[filter:brightness(0.5)_saturate(0.6)]`
  (understreg = mellemrum), så guirlandens slukket-tilstand og keyframes' OFF-trin er samme tekst.
- **Ingen rå hex, ingen paletteklasser** (CLAUDE.md). Ændringen bruger kun filtre, ingen farver.
- Kommentarer: ingen er nødvendige. Højst én kort dansk kommentar i `Garland.tsx` ved filteret på
  det yderste `<div>`, der siger hvorfor det ligger dér og ikke på pærerne (twinkle ejer pærernes
  `filter`). Ellers ingen.

## Verification

Ingen tests (projektet har ingen; ændringen er ren UI). Kør `npm run check` — skal passere.

Se det i browseren (`npm run dev`, http://localhost:3000/julequiz/ eller Playwright mod den, med
`localStorage` ryddet, så tavlen ikke er færdig):

1. Ved indlæsning: pærer, titel og snirkel er tydeligt dæmpede og uden glød; undertitel og
   holdskilte lyser normalt; titlen er stadig læsbar.
2. Klik på titlen: pærer, titel og snirkel blinker synkront et par gange (~1,1 s) og lyser så fast;
   musik, sne (synligt lidt tættere end før), vuggen og lågegløden starter straks; pærerne twinkler fortsat i takt med lågernes
   vuggen.
3. Klik på titlen igen: musik stopper, lyset slukker øjeblikkeligt uden blink. Klik igen: blink
   igen.
4. Genindlæs siden: slukket, uden blink.

Tag skærmbilleder før klik, ~0,1 s og ~1,5 s efter klik, og efter andet klik, og vedlæg
konklusionen i rapporten.
