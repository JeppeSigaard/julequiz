# Ny lågetype: Gæt en pris (`priceGuess`)

> Status: merged — 045cdd1

## Goal

En ny `QuestionSpec`-type, `priceGuess`, viser et produkt som et opslag på en markedsplads: billede,
titel, beskrivelse og et prismærke, der hænger skævt ud over kortets nederste højre hjørne. På
spørgsmålssiden står der "?" på mærket, og på svarsiden står prisen. Kortet har et skævt "Gæt en
pris"-bånd ud over øverste venstre hjørne. Låge 16
(Maileg-nissen) flyttes over på den nye type. Designet er godkendt i mockuppen
https://claude.ai/artifact/AFoySoHRNKwYmA32HkDF6r (artboards "Trin 1" og "Trin 2"), og målene
nedenfor er taget derfra.

## Out of scope

- Ingen animation af afsløringen (CLAUDE.md: ingen bevægelse ud over de fire animationer og lågens
  åbning). Svaret er bare en ny montering.
- Ingen ændringer i `QuestionScreen.tsx`, `decor.tsx`, `styles.css` eller andre lågetyper.
- Ingen talformatering af prisen, ingen valuta-logik.
- Ingen nye prøvespørgsmål og ingen andre låger end 16.

## Decisions made

- Spec-felter → `image: string`, `title: string`, `description: string`, `price: string`.
- Pris → tekst, vist præcis som skrevet (`"1199,95 kr."`), ingen formatering.
- Mærket på trin 1 → stort "?" i `font-display`.
- Mærkets farve → guld (`highlight`) på begge trin; kun indholdet skifter.
- Billedet → `object-cover`, beskåret til et kvadrat på 520×520.
- Bånd → "Gæt en pris" i `accent`, roteret -7°, over kortets øverste venstre hjørne, på begge trin.
- Prismærke → absolut placeret over kortets nederste højre hjørne (`right: -40px; bottom: -8px`,
  roteret -6°), 150 px højt. Mærket må aldrig røre footerens knapper, så kortet løftes med `mb-11`. Det ligger uden for tekstkolonnen, så teksten får hele kolonnens højde.
  Ingen snor (fjernet efter review af mockuppen).
- Kortet viser ikke selv et spørgsmål; båndet og "?" er spørgsmålet.
- Låge 16 → `priceGuess` med `title: "Maileg Jul, Kalendernisse, 121 cm - Dreng"`,
  `description: "Nissedreng i blødt bomuld med 24 ringe til små gaver – én for hver dag frem til jul. Den har en strop i nakken, så den kan hænges op på væggen."`,
  `price: "1199,95 kr."` og `image: "/quizzes/jul-2025/images/maileg-nisse.webp"`. Beskrivelsen er
  brugerens tekst forkortet efter aftale. Teksterne er målt til at passe (titlen på 3 linjer ved
  52 px, beskrivelsen ved 30 px slutter ca. 40 px over mærket).

## Architecture facts (verified)

- `src/types.ts:15-23`: `QuestionSpec = Common & (…union…)`. Tilføj en ny gren.
- `src/questionTypes/index.tsx`: `toQuestion` er en udtømmende `switch` uden `default`.
  `posterReveal`-grenen (linje ~50) er mønsteret: `body`, `answer` og `preload` (rå stier) samt `...common`.
- `src/questionTypes/PosterReveal.tsx` er mønsteret for en renderer: `useAsset(path)` fra
  `../mediaCache` opløser stien én gang pr. montering.
- `src/questionTypes/Standard.tsx`: `textSize(text)` er mønsteret for størrelsestrin ud fra længde,
  med hele klassenavne som strenge.
- `QuestionScreen.tsx` renderer `body`/`answer` i `<main className="… w-[1200px] grow … items-center
  justify-center gap-[26px] text-center">` inden for et `<Fragment key=…>`, så svaret er en ny
  montering. `main` er ca. 650 px høj: kortet er 912 px, minus båndet (~108), footeren (101) og
  `pb-[53px]`.
- Tokens findes i `src/styles.css` (`@theme inline`): `paper-lit`, `ink`, `ink-soft`, `accent`,
  `highlight`. Afledte skygger skrives med `color-mix(in_oklab,var(--quiz-…)…)`, som `mediaFrame` i
  `Standard.tsx` gør.
- Fonten "Mountains of Christmas" 700: "1199,95 kr." er 379 px bred ved 100 px (målt), altså ca.
  303 px ved 80 px. Tekstkolonnen er 552 px bred (1200 − 2×36 − 520 − 56).

## Implementation steps

1. **`src/types.ts`**: tilføj grenen
   `| { type: "priceGuess"; image: string; title: string; description: string; price: string }`
   efter `posterReveal`.

2. **Ny fil `src/questionTypes/PriceGuess.tsx`** med én komponent:
   `export const PriceListing = ({ image, title, description, price }: { image: string; title: string; description: string; price?: string })`.
   Uden `price` viser mærket "?". Med `price` viser det prisen. Strukturen og målene er de samme
   som i mockuppen (oversæt inline-styles til Tailwind-klasser med tokens):
   - `<article>`: `relative mb-11 grid w-[1200px] grid-cols-[520px_minmax(0,1fr)] gap-[56px] rounded-[28px]
     bg-paper-lit p-9 text-left shadow-[0_8px_0_color-mix(in_oklab,var(--quiz-paper)_80%,black)]`.
   - Båndet er første barn: `div` med `absolute -left-[44px] -top-[30px] z-10 -rotate-7 whitespace-nowrap
     rounded-[14px] bg-accent px-10 pt-2 pb-[14px] font-display text-[58px] font-bold leading-none
     text-paper-lit shadow-[0_6px_0_color-mix(in_oklab,var(--quiz-accent)_72%,black)]` og teksten
     `Gæt en pris`.
   - `<img src={useAsset(image)} alt={title} className="block size-[520px] rounded-[18px] object-cover" />`.
   - Højre kolonne: `flex min-w-0 flex-col gap-6 pt-4` med kun `<h3>` (titlen,
     `font-body font-black leading-[1.05] text-ink` + `titleSize`) og `<p>` (beskrivelsen,
     `leading-[1.35] text-ink-soft` + `descriptionSize`).
   - Mærket er sidste barn af `<article>` (ikke i kolonnen): en ydre `div` med
     `absolute -right-10 -bottom-2 -rotate-6`. Indeni en skyggewrapper `div` med
     `[filter:drop-shadow(0_8px_0_color-mix(in_oklab,var(--quiz-highlight)_72%,black))]` om selve
     mærket: `relative flex h-[150px] min-w-[330px] items-center justify-center bg-highlight
     pl-24 pr-11 [clip-path:polygon(60px_0,100%_0,100%_100%,60px_100%,0_50%)]`. Mærket indeholder:
     - sømmen: `aria-hidden` `div` med `absolute top-3 bottom-3 left-[76px] right-3 rounded-[10px]
       border-[3px] border-dashed border-ink/30`;
     - hullet: `aria-hidden` `div` med `absolute left-9 top-[62px] size-[26px] rounded-full
       bg-paper-lit shadow-[inset_0_3px_0_color-mix(in_oklab,var(--quiz-highlight)_72%,black)]`;
     - teksten: `<span className={`font-display font-bold leading-none whitespace-nowrap text-ink ${…}`}>`.
       Uden pris er indholdet `?` med `text-[130px]`. Med pris er indholdet prisen med `priceSize(price)`.
   - Størrelsestrin, lokale funktioner ligesom `textSize` (hele klassenavne):
     - `titleSize`: ≤20 tegn `text-[64px]`, ≤44 `text-[52px]`, ellers `text-[44px]`.
     - `descriptionSize`: ≤60 tegn `text-[36px]`, ≤150 `text-[30px]`, ellers `text-[26px]`.
     - `priceSize`: ≤11 tegn `text-[80px]`, ≤16 `text-[64px]`, ellers `text-[52px]`.

3. **`src/questionTypes/index.tsx`**: importér `PriceListing` og tilføj efter `posterReveal`:
   ```tsx
   case "priceGuess":
     return {
       id,
       body: <PriceListing image={spec.image} title={spec.title} description={spec.description} />,
       answer: <PriceListing image={spec.image} title={spec.title} description={spec.description} price={spec.price} />,
       preload: [spec.image],
       ...common,
     };
   ```

4. **`src/quizzes/jul-2025/questions/16-maileg-nisse.tsx`**: erstat specen med
   `type: "priceGuess"` og de fire felter fra Decisions made. Behold filnavnet (det er lågens `id`).

5. **`CLAUDE.md`**: i afsnittet Quiz-pakker skal `QuestionSpec.type er …` også nævne `priceGuess`
   (prisopslag med billede, titel, beskrivelse og pris som tekst). Tilføj under "Kendte grænser" eller
   samme sted: kortet har plads til en titel på ca. 44 tegn og en beskrivelse på ca. 150 tegn. Længere
   tekst løber ind under prismærket.

6. Commit på dansk, f.eks. "Tilføj lågetypen Gæt en pris og brug den på låge 16".

## Traps

- **Kald ikke `asset()` på `image`, hverken i `index.tsx` eller i komponenten.** `useAsset` kalder den
  selv. Et ekstra kald giver `/julequiz/julequiz/…`, som 404'er på GitHub Pages. `preload` får den rå
  sti.
- **Byg ikke klassenavne dynamisk** (`` `text-[${n}px]` ``). Tailwind 4 scanner kildeteksten og dropper
  ukendte klasser uden at sige det. Brug hele strenge i trinfunktionerne.
- **Brug ikke `var(--color-highlight-deep)`/`var(--color-accent-deep)` i arbitrary values.** Pga.
  `@theme inline` opløses de mod standardfarverne på `:root` og følger ikke pakken. Skriv
  `color-mix(in_oklab,var(--quiz-…)_72%,black)` som ovenfor.
- **Ingen rå hex, ingen paletteklasser** (`red-`, `amber-` …) og ingen `vw`/`vh`. Scenen er fast
  1920×1080 og skaleret.
- **Læg ikke skyggen som `shadow-…` på elementet med `clip-path`.** `clip-path` klipper box-shadow væk.
  Derfor ligger skyggen på en wrapper som `filter: drop-shadow`.
- **Læg ikke mærket i tekstkolonnen, og fjern ikke `mb-11` fra `<article>`.** I kolonnen ville mærket
  tage tekstens plads. Uden `mb-11` er der kun ca. 30 px luft under kortet i `main`, og mærkets
  udhæng (ca. 31 px) rammer footerens knapper (Hold 2). Brugeren har krævet, at mærket og knapperne
  aldrig rører hinanden. Flyt ikke mærket længere ned end `-bottom-2`.
- **Glem ikke `text-left` på `<article>`.** `main` i `QuestionScreen` har `text-center`, som ellers
  arves.
- **Lav ikke to komponenter med hver deres layout til body og answer.** Kortet skal stå pixelidentisk,
  så kun mærkets indhold skifter. Én komponent med valgfri `price`.
- **`exactOptionalPropertyTypes`:** send aldrig `price={undefined}`. Udelad prop'en på spørgsmålssiden.
- **Tilføj ikke `default` i `toQuestion`-switchen.** Den er udtømmende med vilje.
- **Rør ikke `QuestionScreen.tsx`.** Footeren og tastaturet er fælles for alle typer og virker
  uændret.
- Kommentarer skal tilføje værdi: den eneste, der er berettiget, er én linje ved skyggewrapperen om,
  at `clip-path` ville klippe en almindelig skygge væk. Alt andet behøver ingen kommentar. Kommentarer
  er på dansk.

## Verification

Ingen tests (projektet har ingen). Kør `npm run check`, som skal passere. Start derefter `npm run dev`
og åbn låge 16 i browseren (http://localhost:3000/julequiz/). Brug Playwright fra den forinstallerede
Chromium til at tage et skærmbillede af hvert trin:

- Trin 1: kortet har billedet til venstre, titlen på 3 linjer og beskrivelsen under den. Det guldfarvede
  mærke med "?" hænger skævt ud over kortets nederste højre hjørne. Båndet "Gæt en pris" står skævt
  over øverste venstre hjørne.
- Enter → trin 2: alt står samme sted, og mærket viser "1199,95 kr." på én linje.
- Beskrivelsens sidste linje slutter over mærket.
- På svarsiden: mål med `getBoundingClientRect` i Playwright, at mærkets nederste kant ligger mindst
  16 px over den øverste kant af footerens knapper. Hvis ikke, så øg `mb-11` på `<article>` til
  `mb-14`, og mål igen. Rapportér de målte tal. Tjek samtidig, at båndet ikke rører "Låge"-båndet
  øverst på kortet.
- 1/2/Q giver lågen som før, og Escape går tilbage til "?".
- Skift kortvarigt pakkens `accent`/`highlight` lokalt (uden at committe), eller brug devtools, for at
  se, at bånd, mærke og skygger følger `--quiz-*`.

Vedlæg de to skærmbilleder i den afsluttende rapport (sti i scratchpad).
