# Hent prislåger fra guloggratis med et script

> Status: in progress — claude/festive-mendel-itplvf

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

### Rettelser efter gennemgang (gælder forud for reglerne ovenfor, hvor de afviger)

- `NUM`: decimaldelen er `[.,]\d{1,2}` (ikke kun komma), og `NUM` må ikke efterfølges af et ciffer
  (`(?!\d)`). `1200.50 kr` → `X kr`, `kr. 1.200.00` → `kr. X`, `5.00 kr` → `X kr`.
- Regel 1 får også suffikset `.-` og ordet `krone`: `1200.-` → `X.-`, `1.200.- kr` → `X.- kr`.
- Regel 2: prisordet `pris`/`prisen` må have bogstaver foran (`[a-zæøå]*pris(?:en)?`, fx `normalpris`,
  `udsalgspris`, `nyprisen`); `bud`, `kr`, `dkk` kræver stadig, at der ikke står et bogstav foran.
  Nye prisord: `værdi`, `sælges til`, `købt for`, `solgt for`, `byd`. Fyldordene må gentages op til
  tre gange og udvides med `var`, `til`, `over`, `pr.`, `stk.`, `normalt`.
  `prisen er på 1200` → `prisen er på X`, `pris fra ca. 1200` → `pris fra ca. X`.
- Regel 1 og 2 dækker intervaller: `NUM`, valgfri whitespace, et af `-`, `–`, `/`, `til`, `og`,
  valgfri whitespace, `NUM` maskeres begge. `800-1200 kr` → `X-X kr`, `kr 800-1200` → `kr X-X`,
  `mellem 800 og 1200 kr` → `mellem X og X kr`.
- Tvetydige tusindtal med mellemrum (`iPhone 12 500 kr`, `26x500 mm` ved pris 500) ændres IKKE: der
  findes ingen ren regel, og quizmasteren læser teksten i `git diff`.
- De fem rækker i tabellen ovenfor skal stadig give præcis samme output, og `12 kranse`, `3 kroge`,
  `budget 1200`, `lampris 12`, `Kr. Himmelfart 2026` skal stadig stå urørt (`lampris` er et kendt
  offer for den nye `*pris`-regel og må gerne blive `lampris X`).
- `clean` erstatter også styretegn (`[\u0000-\u001f\u007f-\u009f]`) med mellemrum før sammentrækningen.
- `truncate` regner i kodepunkter (`Array.from(text)`), så en emoji aldrig deles; `max` tæller
  kodepunkter.
- Billeder: afvis (kode 1, intet skrevet), hvis URL'ens protokol ikke er `https:`, hvis
  `content-type` ikke begynder med `image/`, eller hvis filen er over 5 MB. Ingen værtskontrol:
  billedværten er ikke bekræftet, og et forkert gæt ville gøre scriptet ubrugeligt.
- Fejlsvarets 300 tegn skrives med `JSON.stringify`, så styretegn ikke når terminalen.
- Begge scriptfiler formateres som resten af repoet: 2 mellemrum, dobbelte anførselstegn, semikolon.

### Rettelser efter anden gennemgang (gælder forud for alt ovenfor, hvor de afviger)

- `krone`/`kroner` i regel 1 kræver som `kr`, at næste tegn ikke er et bogstav: `4 kronelys` og
  `2 kronekager` står urørt, `1200 krone` → `X krone`. `krone` er IKKE et prisord i regel 2:
  `Krone 12 cm i guld` står urørt.
- `til` fjernes fra fyldordene i regel 2 (`sælges til` er stadig sit eget prisord):
  `pris til 4 personer` og `byd til 8 personer` står urørt.
- Intervaller i regel 2 (tal EFTER prisord) er kun tæt bindestreg: `NUM[-–]NUM` uden whitespace.
  `kr 800-1200` → `kr X-X`; `koster 250 og 24 låger` → `koster X og 24 låger`;
  `pris 300 - 12 kugler` → `pris X - 12 kugler`. Regel 1 (tal FØR prisord) beholder alle
  intervalformer; at `str. 38/40 kr 100` bliver `str. X/X kr X` er accepteret.
- Accepteret uden ændring: `købt for 3 år siden` → `købt for X år siden` og lignende antal/tid efter
  et prisord. Tilføj ingen lookahead for `år`, `personer`, `stk`.
- `clean` fjerner også usynlige formattegn helt (ikke til mellemrum):
  `[\u200b-\u200f\u2028-\u202e\u2060-\u2064\ufeff]`, så `1<U+200B>200 kr` → `X kr`.
- Scriptet: varens `url` skrives til terminalen med `JSON.stringify`; efter billedhentning afvises
  svaret, hvis `new URL(response.url).protocol` ikke er `https:` (omdirigeringer følges stadig); et `content-length` over 5 MB afvises før kroppen læses (det eksisterende
  tjek efter læsning bliver stående).

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
