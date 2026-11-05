# Fox chicken grain-off: tur, trækketæller og sejlende båd

> Status: in progress — claude/fervent-allen-lcpiq9

## Goal

Låge 02 (`src/quizzes/jul-2025/questions/02-fox-chicken-grain.tsx`) viser to ræv-høne-korn-brætter
side om side, ét pr. hold. Konkurrencen er at få alt over åen med færrest træk. Brætterne skal
skiftes til at trække (tur-lås), hvert bræt får en trækketæller, en fælles "Start forfra"-knap
nulstiller begge, og båden skal synligt sejle over åen i stedet for at hoppe.

## Out of scope

- Holdnavne, holdfarver eller point på brætterne; ingen kobling til `QuestionScreen`'s point.
- Tastaturgenveje til spillet; `QuestionScreen` ejer tasterne.
- Gemning af tællere i `localStorage` eller uden for komponentens state.
- Ændringer i `QuestionScreen.tsx`, `decor.tsx`, `styles.css` eller andre låger.
- Ændring af svaret (`answer`) i låge 02.
- Ny lyd.

## Decisions made

- Hvad er ét træk? → Kun en overfart (klik på båden). At læsse/losse last er gratis inden for ens tur.
- Tur-lås → Ved start (`turn === null`) må begge brætter trække. Efter en overfart på bræt *i* er
  det det andet bræts tur; bræt *i* er låst, indtil det andet har sejlet.
- Tab (ræven æder hønen / hønen æder kornet) → den fatale overfart tæller som træk og giver turen
  videre. Brættet viser game over-overlayet i 3 s og starter selv forfra (dyrene tilbage);
  tælleren beholdes.
- Sejr → brættet er færdigt (ingen ring, ikke dæmpet, uklikbart som i dag via `isWon`). Det andet
  bræt er derefter aldrig låst og spiller videre, til det også vinder.
- "Start forfra" → én fælles knap. Den nulstiller begge spil, begge tællere og tur-låsen
  (`turn = null`, ingen har vundet). Den kan trykkes når som helst.
- Tællerne nulstilles ellers kun, når lågen skifter trin (spørgsmål ↔ svar) eller lukkes/genåbnes.
  Det sker af sig selv, fordi kroppen afmonteres (se Architecture facts); ingen ekstra kode.
- Aktivt bræt → tyk `ring-8 ring-highlight` om brættet. Et låst bræt dæmpes (`opacity-40`) og er
  uklikbart. Ved start har begge brætter ring.
- Båden → glider over åen på 0,9 s med `motion` (`y`) og vugger let (`rotate`-keyframes) undervejs.
  Klik på bræt og last blokeres under overfarten; sejr/tab og beskeden vises først ved ankomst.
  Lasten bliver i båden under overfarten.
- Layout → tælleren er et lille papirmærke i brættets øverste venstre hjørne (stort tal +
  "træk"). "Start forfra" er en `PillButton variant="neutral"` på samme række som overskriften.
  Brætterne krymper fra 560 til 540 px høje.

## Architecture facts (verified)

- `src/components/FoxChickenGrain.tsx` eksporterer i dag ét bræt `FoxChickenGrain` (ingen props)
  med egen state (`state`, `message`, `isWon`, `isGameOver`). Game over nulstilles med en rå
  `setTimeout` i `handleBoatClick` (linje 113-117) uden oprydning. Båden skifter mellem
  `top-0`/`bottom-0` (linje 171, 183), som CSS ikke kan transitionere, så den hopper i dag.
- Brættet er `w-[520px] h-[560px]`; bredderne er 30 % / 40 % / 30 % (top-bred, å, bund-bred).
- Låge 02's `body` er `<h2>` + `<div className="flex gap-[60px]">` med to `<FoxChickenGrain />`.
  Den bruges ingen andre steder (`grep -rn FoxChickenGrain src`).
- `src/components/QuestionScreen.tsx:153` renderer kroppen i
  `<Fragment key={hasAnswered ? "answer" : "body"}>` inde i `<main className="… flex-col … gap-[26px]">`
  (linje 151). Skift til svaret afmonterer kroppen, og Escape tilbage monterer den på ny; lukning
  afmonterer hele skærmen. Al tæller-/tur-state i komponent-state nulstilles derfor præcis, som
  ønsket. Indholdsfeltet er ca. 650 px højt og 1200 px bredt.
- `motion` importeres som `import * as motion from "motion/react-client";`
  (`src/components/QuestionCard.tsx:2`). `QuestionScreen`s kort sidder i en `motion.div` med
  `scale`-fjeder, og `Stage` skalerer hele scenen med `scale()`.
- `PillButton` (`src/components/decor.tsx:44`): `variant="neutral"` giver `text-[26px]`,
  `px-9 py-5`, `min-w-[276px]`. Det er en rigtig `<button>`; `QuestionScreen`s vindues-keydown
  kalder `preventDefault`, så Enter efter et klik udløser ikke knappen igen.
- Tokens findes: `highlight`, `felt`, `felt-deep`, `paper`, `ink`, `ink-soft`, `mist`, `snow`
  (`src/styles.css`).

## Implementation steps

1. I `src/components/FoxChickenGrain.tsx`: omdøb den nuværende komponent til en ikke-eksporteret
   `RiverBoard` med props
   `{ locked: boolean; highlighted: boolean; moves: number; onCross: () => void; onWin: () => void }`.
2. Fast geometri i `RiverBoard`: brættet `h-[540px]` (bredde 520 uændret). Top-bred `h-[162px]`,
   bund-bred `h-[162px]`, åen `top-[162px] bottom-[162px]` (216 px). Erstat procent-klasserne.
   Tilføj modul-konstanter `const SAIL_SECONDS = 0.9;` og `const SAIL_DISTANCE = 128;`
   (216 px å − 88 px båd).
3. Overfart i to faser. Tilføj state `arrival: { next: GameState; cargo: Item | null } | null`
   (startværdi `null`).
   - `handleBoatClick`: returnér straks, hvis `locked || isWon || isGameOver || arrival !== null`.
     Beregn `newBoatSide` og `next` præcis som i dag (`boat: newBoatSide, boatCargo: null`, lasten
     flyttet). Sæt så `setState({ ...state, boat: newBoatSide })` (lasten bliver i båden),
     `setArrival({ next, cargo })`, `setMessage("")` og kald `onCross()`.
   - Ny `land(next, cargo)`: `setArrival(null)`, `setState(next)`, og derefter den eksisterende
     logik for game over (sæt `isGameOver` og tab-beskeden; brug `next.boat` i stedet for
     `newBoatSide`), sejr (besked, `setIsWon(true)`, kald `onWin()`) og ellers
     sejlede-over-beskeden.
   - Effekt: `useEffect(() => { if (arrival === null) return; const timer = setTimeout(() => land(arrival.next, arrival.cargo), SAIL_SECONDS * 1000); return () => clearTimeout(timer); }, [arrival]);`
   - Flyt game over-nulstillingen til en effekt på `isGameOver` med `clearTimeout`-oprydning
     (samme 3000 ms og samme tre setters). Fjern den rå `setTimeout` fra klikhandleren.
4. `handleItemClick`: returnér straks, hvis `locked || isWon || arrival !== null`
   (resten uændret).
5. Båden: wrap den i `<div className="absolute inset-x-0 top-0 flex justify-center">` og gør selve
   knappen til `motion.button` med fast `h-[88px] flex items-center`, `cursor-pointer
   hover:scale-105`, uden `absolute`/`top-0`/`bottom-0`/`left-1/2`/`-translate-x-1/2`/
   `transition-all`. Props:
   `initial={false}`,
   `animate={{ y: state.boat === "left" ? 0 : SAIL_DISTANCE, rotate: state.boat === "left" ? [0, -8, 6, -4, 0] : [0, 8, -6, 4, 0] }}`,
   `transition={{ duration: SAIL_SECONDS, ease: "easeInOut" }}`. Lasten vises fortsat i båden ud
   fra `state.boatCargo`. Ret `title="Click to sail"` til `title="Sejl over"`.
6. Tællermærke i `RiverBoard`, øverst i det relative bræt:
   `<div className="absolute left-3 top-3 z-30 flex flex-col items-center rounded-[14px] bg-paper px-3 pt-1 pb-1.5 text-ink">`
   med `<span className="font-display text-[44px] font-bold leading-none">{moves}</span>` og
   `<span className="font-body text-[16px] font-extrabold uppercase text-ink-soft">træk</span>`.
   `z-30` holder det over game over-overlayet (`z-20`).
7. Ydre element i `RiverBoard` (i dag `flex flex-col items-center`): giv det `rounded-[24px]` og
   klasser efter tilstand med fulde strenge, fx
   `` `rounded-[24px] transition-opacity duration-300 ${highlighted ? "ring-8 ring-highlight" : ""} ${locked ? "opacity-40 pointer-events-none" : ""}` ``.
8. Ny eksporteret `FoxChickenGrain({ title }: { title: string })` i samme fil:
   - State: `round` (tal, 0), `moves: [number, number]` (`[0, 0]`), `turn: 0 | 1 | null` (`null`),
     `won: [boolean, boolean]` (`[false, false]`).
   - `isActive(i)` = `!won[i] && (turn === null || turn === i || won[other])`.
   - Pr. bræt `i`: `locked={!won[i] && !isActive(i)}`, `highlighted={isActive(i)}`,
     `moves={moves[i]}`, `onCross` → læg 1 til `moves[i]` og sæt `turn` til det andet bræt,
     `onWin` → sæt `won[i] = true`. Brug funktionelle opdateringer og nye tupler (ingen mutation).
   - `restart` → `round + 1`, `moves [0, 0]`, `turn null`, `won [false, false]`.
   - Render et fragment (så `main`s `gap-[26px]` virker):
     `<div className="flex items-center gap-10">` med
     `<h2 className="font-display text-[58px] text-ink leading-none">{title}</h2>` og
     `<PillButton variant="neutral" onClick={restart}>Start forfra</PillButton>`; derefter
     `<div className="flex gap-[60px]">` med to `<RiverBoard key={`${round}-0`} … />` /
     `key={`${round}-1`}`.
9. I `02-fox-chicken-grain.tsx`: erstat `<h2>…</h2>` og brætternes `div` med
   `<FoxChickenGrain title="Fox chicken grain-off!" />`. Fragmentet om kroppen kan så fjernes.
10. `CLAUDE.md` (Farver og stil, linje ~114): sætningen om, at bevægelse ud over de fire animationer
    og lågens åbning ikke er ønsket, skal nævne undtagelsen: bådens overfart i `FoxChickenGrain`.
    Ret ikke andet i `CLAUDE.md`.
11. `npm run check`.

## Traps

- **Brug ikke motion's `layout`-prop eller `top`/`bottom`-skift til at flytte båden.** `top-0` →
  `bottom-0` kan ikke transitioneres (det er grunden til, at den hopper i dag), og layout-animation
  måler med `getBoundingClientRect` under `Stage`s `scale()` og kortets fjeder-`scale`, så den
  skyder forkert. Animér `y` i px mod den faste åhøjde, som i trin 5.
- **Lad ikke Tailwind-`translate` og motion-transform ligge på samme element.** Centrér med den
  ydre `flex justify-center`-div, ikke `left-1/2 -translate-x-1/2` på `motion.button`.
- **Brug ikke rå `setTimeout` i klikhandlere.** "Start forfra" genmonterer brætterne via `key`; en
  ventende timer fra det gamle bræt kører ellers videre. Alle timere ligger i effekter med
  `clearTimeout` i oprydningen (trin 3).
- **Kald ikke `onCross` ved ankomst eller fra `land`.** Turen skal skifte straks ved klik, så det
  andet bræt kan trække under overfarten; kun sejr meldes ved ankomst (`onWin`).
- **Gem ikke tællere eller tur i `localStorage`, modul-variabler eller i `QuestionScreen`.** De skal
  nulstilles ved trinskift og genåbning, hvilket kun komponent-state giver gratis.
- **Lås ikke et vundet bræt med `opacity`.** `locked` er `false` for et vundet bræt (trin 8); det
  er færdigt via `isWon`, ikke dæmpet.
- **Ingen dynamiske klassenavne** (`` `ring-${x}` ``, `` `h-[${n}px]` ``): Tailwind 4 scanner
  kildeteksten og dropper ukendte klasser. Skriv hele klasser, betinget med ternary.
- **Ingen rå hex og ingen paletteklasser** (`green-`, `red-`, `amber-`, `gray-`, `text-white`).
- **Ingen `vw`/`vh`.** Scenen er fast 1920×1080 i px.
- **`exactOptionalPropertyTypes`:** send aldrig `undefined` til en valgfri prop; udelad den.
- **Ret ikke `decor.tsx` for at få knappen mindre.** `PillButton` er fælles; brug den som den er.
- Kommentarer skal tilføje værdi: kun en ikke-indlysende begrænsning eller et hvorfor. Én dansk
  linje er berettiget ved `SAIL_DISTANCE` (afhænger af åens 216 px og bådens 88 px). Behold de
  eksisterende kommentarer i filen. Alt andet behøver ingen.

## Verification

Ingen tests (projektet har ingen). `npm run check` skal passere. Åbn derefter låge 02 i
browseren (`npm run dev`, `http://localhost:3000/julequiz/`, klik titlen, åbn låge 02) og tjek:

1. Ved start har begge brætter ring og er ikke dæmpede; begge tællere viser 0.
2. Læs hønen på bræt A, sejl: båden glider og vugger over åen på ca. 0,9 s med hønen om bord;
   beskeden kommer ved ankomst. A's tæller er 1, A er dæmpet uden ring, B har ring.
3. Læs/los på B tæller ikke. Sejl med B: B låses, A låses op.
4. Tab på et bræt: overlay i 3 s, dyrene tilbage, tælleren beholdt (fatal overfart talt med), turen
   er gået videre.
5. Vind på et bræt (7 overfarter): det viser sejrsbeskeden uden ring og udæmpet; det andet bræt er
   aldrig låst derefter.
6. "Start forfra" midt i en overfart og efter sejr: begge brætter tilbage, tællere 0, begge med
   ring, intet hopper eller nulstilles 3 s senere.
7. Vis svaret (Enter) og gå tilbage (Escape): tællerne er 0. Luk og genåbn lågen: tællerne er 0.
8. Indholdet passer i kortet: overskriftsrækken og brætterne overlapper ikke footerens knapper.
