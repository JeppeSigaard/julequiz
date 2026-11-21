# Hent prislåger fra guloggratis med et script

> Status: ready for execution

## Goal

gg26-pakkens fire "Gæt en pris"-låger skal kunne fyldes med aktuelle julevarer fra guloggratis.dk.
Et Node-script, som quizmasteren kører lokalt før quizzen, søger på "jul" i guloggratis' offentlige
GraphQL-API, vælger fire tilfældige varer, maskerer priser i titel og beskrivelse med "X", afkorter
teksten til kortets layout, henter billederne og overskriver de fire eksisterende spørgsmålsfiler.
Quizzens egen kode ændres ikke.

## Out of scope

- Ingen hentning i browseren ved quizzens start: API'ets CORS afviser `jeppesigaard.github.io`.
- Ingen ændring i guloggratis-repoet (`/home/user/guloggratis`), heller ikke CORS.
- Ingen ændring i `src/` ud over de fire spørgsmålsfiler, som scriptet selv skriver, når det køres.
  Rør ikke `PriceGuess.tsx`, `types.ts`, `toQuestion`, `mediaCache.ts`, `QuizBoard.tsx`.
- Ingen nye npm-afhængigheder, ingen testramme, intet CI-trin, ingen GitHub Action der kører scriptet.
- Slet ikke de gamle billeder i `public/quizzes/gg26/images/`.
- Ingen kategori-søgning, ingen interaktiv udvælgelse, ingen andre pakker end `gg26`.
- Eksekutoren kører ikke scriptet mod API'et som en del af leverancen og committer ikke overskrevne
  spørgsmålsfiler (se Verification).

## Decisions made

- Datakilde → script, der køres på forhånd (`npm run fetch-prices`), ikke live i browseren.
- Output → overskriv `14-pris-1.tsx`, `15-pris-2.tsx`, `16-pris-3.tsx`, `21-pris-4.tsx` i
  `src/quizzes/gg26/questions/` og gem billederne i `public/quizzes/gg26/images/`. Quizmasteren ser
  `git diff`, kører igen ved en dårlig vare og committer selv.
- Udvalg → søgeord `jul`; kun varer med billede, fast pris 50-10.000 kr. (5.000-1.000.000 øre), ikke
  auktion, beskrivelse på mindst 40 tegn efter rensning. Fire tilfældige blandt kandidaterne.
- Prismaskering → smart: tal ved et prisord og tal lig varens egen pris bliver `X`; øvrige tal står.
- Længde → beskrivelse højst 150 tegn, titel højst 44 tegn, afkortet ved helt ord med `…`.
- Prisen på svarsiden formateres af scriptet fra `price.raw` (øre), ikke fra API'ets `price.text`.
- Ingen automatiske tests (repoet har ingen testramme); tekstfunktionerne tjekkes med `node -e`.

## Architecture facts (verified)

- `package.json` har `"type": "module"` og scripts `dev`, `build`, `start`, `check`. Der er ingen
  `scripts/`-mappe endnu. `tsconfig.json` har ingen `include` og ingen `allowJs`, så en `.mjs`-fil
  typecheckes ikke og bygges ikke af Waku.
- En prislåge er en fil som `src/quizzes/gg26/questions/14-pris-1.tsx`: import af `QuestionSpec` fra
  `"../../../types"`, et objekt med `type: "priceGuess"`, `image`, `title`, `description`, `price`
  (alle strenge) og `export default question`. Filnavnet er spørgsmålets id og må ikke ændres: gemt
  quiz-tilstand i `localStorage` peger på id'et (`src/quizState.ts`).
- `image` er en rå sti `/quizzes/gg26/images/<fil>`; rendereren lægger selv basestien på.
- `price` vises som tekst, fx `"5.000 kr."`. `src/questionTypes/PriceGuess.tsx` har plads til 11 tegn
  i største skrift.
- API (læst i guloggratis-repoet, ikke kaldt): `POST https://api.guloggratis.dk/graphql`, JSON-body,
  ingen login. Værtsnavnet står ikke i repoet og er ikke bekræftet. Fra planlægningscontaineren
  svarede Cloudflare 403 (datacenter-IP), så kaldet er uprøvet.
- Query: `search(filters: SearchFiltersInput!, pagination: PaginationInput!)`. Filtre: `term: String`,
  `hasImages: Boolean`. Pagination: `{ page, perPage }`, `perPage` over 60 giver fejl.
- Felter på hver `listings`-post: `id`, `title`, `description`, `price { raw }` (øre, kan være
  `null`; 0 er gratis), `auction { id }` (`null` når varen ikke er en auktion),
  `images(take: 1) { url(size: Listing1280) }` (absolut URL til `…-1280x960.webp`).

## Implementation steps

1. Opret `scripts/listingText.mjs` med tre rene, eksporterede funktioner og intet andet:
   - `clean(text)`: erstat al whitespace-følge (også linjeskift) med ét mellemrum og trim.
   - `maskPrices(text, priceKroner)`: se "Maskeringsregler" nedenfor.
   - `truncate(text, max)`: er `text.length <= max`, returnér uændret. Ellers tag de første `max - 1`
     tegn, skær tilbage til sidste mellemrum (findes intet mellemrum, behold de `max - 1` tegn), fjern
     afsluttende tegn fra `[\s,.;:!–-]`, og tilføj `…`. Resultatet er aldrig længere end `max`.
2. Opret `scripts/fetch-price-listings.mjs` (Node 22, global `fetch`, kun `node:fs/promises` og
   `node:path`):
   1. Hent side 1, 2 og 3 med `perPage: 60`, `filters: { term: "jul", hasImages: true }` og felterne
      fra Architecture facts. Send `content-type: application/json` og ingen andre headere.
   2. Er HTTP-status ikke 200, eller har svaret `errors`, så skriv status og de første 300 tegn af
      svaret til `console.error` og afslut med `process.exit(1)`, før noget skrives til disk.
   3. Behold varer, hvor `price.raw` er et tal med `5000 <= raw <= 1000000`, `auction === null`,
      `images` har mindst én post, og `clean(description).length >= 40`. Fjern dubletter på `id`.
   4. Er der færre end 4 kandidater, så skriv antallet og afslut med kode 1 uden at skrive filer.
   5. Bland kandidaterne (Fisher-Yates med `Math.random`) og tag de første 4.
   6. For vare nr. `n` (1-4): `kroner = Math.round(raw / 100)`;
      `title = truncate(maskPrices(clean(title), kroner), 44)`;
      `description = truncate(maskPrices(clean(description), kroner), 150)`;
      `price = kroner.toLocaleString("da-DK") + " kr."`.
   7. Hent alle fire billeder til hukommelsen først. Fejler ét (status ikke 200), afslut med kode 1
      uden at skrive noget. Skriv dem derefter som `public/quizzes/gg26/images/gg-pris-<n>.webp`.
   8. Skriv de fire spørgsmålsfiler i rækkefølgen `14-pris-1.tsx`, `15-pris-2.tsx`, `16-pris-3.tsx`,
      `21-pris-4.tsx` med præcis samme form som den nuværende `14-pris-1.tsx`. Strengværdierne
      skrives med `JSON.stringify(value)`; `image` er `/quizzes/gg26/images/gg-pris-<n>.webp`.
   9. Skriv til sidst én linje pr. vare til `console.log`: filnavn, titel, pris og
      `https://www.guloggratis.dk` + varens `url` (tilføj `url` til queryen).
   Stier opløses fra repo-roden med `new URL("..", import.meta.url)`, så scriptet virker uanset cwd.
3. Tilføj `"fetch-prices": "node scripts/fetch-price-listings.mjs"` til `scripts` i `package.json`.
4. Tilføj til `CLAUDE.md`: en række i kommandotabellen (`npm run fetch-prices`: henter fire julevarer
   fra guloggratis og overskriver gg26's prislåger og billederne `gg-pris-1..4.webp`; køres lokalt,
   gennemse `git diff` før commit) og én sætning i afsnittet "Quiz-pakker" efter omtalen af
   `priceGuess`-kortets tegngrænser, der peger på `scripts/listingText.mjs` for maskering og afkortning.

### Maskeringsregler

`NUM` er `\d{1,3}(?:[. ]\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?` (tusindtal med punktum eller mellemrum,
valgfri decimaler). `NUM` må ikke begynde midt i et tal (`(?<!\d)` foran), og et prisord må ikke stå
lige efter et bogstav (`(?<![a-zæøå])` foran). Alle mønstre er case-insensitive og globale. Kun tallet erstattes med `X`;
prisordet og tegn omkring bliver stående. Anvend i denne rækkefølge:

1. Tal før prisord: `NUM` efterfulgt af valgfri whitespace og et af `kr` (ikke efterfulgt af et
   bogstav), `kroner`, `dkk`, `,-`, `;-`, `:-`.
2. Tal efter prisord: et af `kr.`, `kr`, `kroner`, `dkk`, `pris`, `prisen`, `nypris`, `nyprisen`,
   `butikspris`, `vejl.`, `koster`, `sælges for`, `bud` (som helt ord), derefter valgfrit `:` eller
   `=`, valgfrit et af ordene `er`, `på`, `fra`, `ca.`, `ca`, `kun`, og så `NUM`.
3. Tal lig prisen: ethvert resterende `NUM`, hvis værdi efter fjernelse af `.` og mellemrum og af en
   decimaldel `,00`/`,0` er lig `String(priceKroner)`.

Forventede resultater (bruges i Verification), alle med `priceKroner = 500`:

| Input | Output |
| --- | --- |
| `Julekalender 2026 med 24 låger, 500 kr.` | `Julekalender 2026 med 24 låger, X kr.` |
| `Nypris 1.299,- sælges for 500` | `Nypris X,- sælges for X` |
| `Pris: ca. 1 200 kroner. Mål 500 mm` | `Pris: ca. X kroner. Mål X mm` |
| `Fra 1950, 3 stk, kr 75 pr. stk` | `Fra 1950, 3 stk, kr X pr. stk` |
| `Krystal fra 1920 og 12 kranse` | `Krystal fra 1920 og 12 kranse` |

## Traps

- **Hent ikke varer i browseren og tilføj ingen `fetch` i `src/`.** API'ets CORS-regel
  (`corsMiddleware.ts` i guloggratis) tillader kun origins, der ender på `guloggratis.dk`; kaldet
  fejler stille i produktion og virker kun tilsyneladende i curl. Alt netværk bor i scriptet.
- **Sæt ikke en browser-`User-Agent`, cookies eller `Origin` for at komme forbi et 403.** Et 403 er
  Cloudflare, der afviser netværket; at forklæde klienten er ikke ønsket. Rapportér status og stop.
- **Brug ikke `price.text` og ikke filtrene `priceFrom`/`priceTo`.** `text` kan være fritekst
  ("Gratis", "Giv et bud", "… ex. moms"), og filtrenes enhed er ikke bekræftet. Filtrér og formatér
  fra `price.raw` i øre: 500 kr. er `50000`. Glemmes `/ 100`, bliver alle priser 100 gange for store
  uden nogen fejl.
- **Skriv ikke den absolutte billed-URL i `image`.** Rendereren kører stien gennem `asset()`, som
  sætter `/julequiz/` foran: en `https://`-URL bliver til `/julequiz/https://…` og giver et tomt
  billede uden fejl. Billedet skal ligge lokalt og angives som `/quizzes/gg26/images/…`.
- **Omdøb, tilføj eller fjern ikke spørgsmålsfiler.** Filnavnet er id'et i gemt quiz-tilstand, og en
  ekstra fil giver en ekstra låge på brættet. Præcis de fire navngivne filer overskrives.
- **Skriv ikke strenge ind i `.tsx` med håndlavede anførselstegn.** Annoncetekst indeholder `"`, `\`
  og linjeskift; brug `JSON.stringify`. `clean` skal køre før maskering, og maskering før afkortning,
  ellers kan en pris, der deles af et linjeskift eller skæres midt over, slippe igennem.
- **Skriv ikke noget til disk, før alt er hentet.** Et halvt kørt script efterlader låger, hvis
  billede mangler, og `npm run check` fanger det ikke. Hent først, valider, skriv til sidst.
- **Lad ikke `kr`-mønstret matche inde i ord.** `12 kranse` og `3 kroge` er ikke priser; `kr` kræver,
  at næste tegn ikke er et bogstav (JS `\b` kender ikke `æøå`, så brug `(?![a-zæøå])`).
- **Læg ikke scriptet i `src/` og giv det ikke endelsen `.ts`.** Så typechecker `tsc` det under
  `strict` uden Node-typer (`@types/node` er ikke installeret), og Waku kan trække det ind i buildet.
- Kommentarer skal tilføje værdi, på dansk, højst én linje. Kun to er berettigede: ved `/ 100`
  (API'ets pris er i øre) og ved `kr`-lookaheadet (hvorfor ikke `\b`). Alt andet uden kommentarer.

## Verification

- Ingen nye tests. Tjek tabellen i "Maskeringsregler" med ét `node -e`, der importerer
  `./scripts/listingText.mjs` og sammenligner alle fem rækker med `===`; alle skal passe.
- Tjek `truncate` på samme måde: en tekst på 150 tegn returneres uændret; en på 151 tegn giver højst
  150 tegn, ender på `…` og skærer ikke midt i et ord; `truncate("a".repeat(60), 44)` har længde 44.
- `node --check scripts/fetch-price-listings.mjs` og `npm run check` skal passere.
- Kør ikke `npm run fetch-prices` som en del af leverancen. Vil eksekutoren prøve det og får 403
  eller netværksfejl, er det forventet i et datacenter: bekræft kun, at scriptet afslutter med kode 1
  og `git status` viser, at ingen spørgsmålsfil eller billede er ændret. Lykkes kaldet mod
  forventning, så fortryd de overskrevne filer med `git checkout -- src/quizzes/gg26/questions` og
  slet `gg-pris-*.webp`, så leverancen kun indeholder scriptet.
- Sig i afleveringen, at API-kaldet (værtsnavn, Cloudflare, feltnavne mod produktion) er uprøvet og
  skal køres første gang af brugeren på egen maskine.
