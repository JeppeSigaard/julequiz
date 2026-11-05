# Pack-tema: sne, titelskrift og farver pr. pack

> Status: merged — c005bba

Branch `quiz-packs-pack-theme`, base `claude/vibrant-euler-3tsdtn` (diff mod `origin/claude/vibrant-euler-3tsdtn`, aldrig `main`). Afhænger af `pack-loading` (merged).

## Goal

Hver quiz-pack styrer selv om der falder sne, hvilken af de tre indlæste skrifttyper titlen og lågeoverskrifter bruger, og de syv farver på siden. jul-2025 får dagens grønne/røde farver som hex og skal se ud som før. Ændres et hex i `quiz.ts`, ændres brættet live i `npm run dev`.

## Out of scope

- Skrifttyper, der ikke allerede er indlæst i `src/pages/_layout.tsx`; ingen ændring af `_layout.tsx`.
- Farver inde i `FoxChickenGrain`, `MusicBox`-knapper, `WordPuzzle`-komponentens indre, `GuessThatCat` (ikke ejede; kun `className`-prop'en i `src/questionTypes/WordPuzzle.tsx` ændres).
- Pointregler, tastatur, oversættelse af UI-tekster, nye packs, tests/testramme, nye afhængigheder.
- `Ukendt quiz`-listen i `index.tsx` (hvid/sort/blå) og `text-white` på brættet og på aktive låger: ikke grønne/røde/ravgule klasser, bliver stående.

## Owns (hård grænse)

`src/types.ts`, `src/quizzes/*/quiz.ts`, `src/pages/index.tsx`, `src/components/QuestionCard.tsx`, `src/components/QuestionScreen.tsx`, `src/components/SettingsMenu.tsx`, `src/components/ResetQuizSetting.tsx`, `src/questionTypes/`, `CLAUDE.md`. Alt andet (bl.a. `src/quizzes/index.ts`, `_layout.tsx`, `styles.css`, `pages.gen.ts`) er forbudt.

## Decisions made (fastlåst af masterplanen)

- Pinnet `Quiz`-udvidelse i `src/types.ts` (efter `music`, med kommentar-fri tilføjelse):
  `snow: boolean; titleFont: "Mountains of Christmas" | "Nunito" | "DM Sans"; colors: { page: string; board: string; door: string; doorHighlight: string; doorDone: string; screen: string; text: string };`
- Farver er hex-strenge i `quiz.ts`; siden sætter dem som CSS-variabler på sit rod-element; komponenter bruger Tailwind-arbitrære værdier som `bg-(--color-board)`. Forfattere skal ikke kende Tailwind.
- Titelskrift kun fra de tre indlæste: ingen ny fontindlæsning.
- Pr. pack: `snow`. Trøstepoint og fyrværkeri er globale.

## Autonomous decisions

- Hover-/transparente nuancer udledes med Tailwinds `/NN`-modifier og `color-mix` i arbitrær værdi, ikke med ekstra farvenøgler (afvist: nye nøgler i `colors`, som ville bryde den pinnede kontrakt).
- CSS-variablerne sættes som inline `style` på en ny omsluttende `<div>` i `QuizBoard` (afvist: `document.documentElement`-effekt, som giver flash og SSR-forskel).
- `text` bruges som tekstfarve på lågeskærmen og indstillingsmenuen (afvist: også brættets hvide tekst, som står på mørke flader uanset tema).
- `WordPuzzle`-rendererens `text-green-900` bliver `text-(--color-doorDone)` (afvist: `text`, som ville gøre ordet sort i stedet for mørkegrønt).
- Placeholder-`div`en før packen er kendt (`index.tsx`, `packName === null`) beholder `bg-green-950`: packen er ukendt dér, så ingen variabler findes (afvist: sort baggrund, som ændrer jul-2025's opstart).
- Titelskriftens variabel hedder `--font-title` og sættes sammen med farverne (afvist: tre inline `fontFamily` med `style`).
- Hex er omregnet fra Tailwinds oklch til sRGB-hex og afrundet (afvist: `oklch(...)`-strenge i `quiz.ts`, som forfattere ikke kan læse/redigere).
- Hover på de udledte nuancer er tilnærmet, ikke pixel-identisk (afvist: ekstra hover-farver pr. pack).

## Architecture facts (verified)

- `src/types.ts`: `Quiz` ender med `music: {...}` (nu ingen `snow`/`titleFont`/`colors`). `LoadedQuiz = Quiz & { name; questions }` i `src/quizzes/index.ts` (ikke ejet) arver automatisk; `quiz.ts` spreades ind, så nye felter følger med uden ændring dér.
- `src/quizzes/jul-2025/quiz.ts` er eneste pack; `const quiz: Quiz` fejler typecheck, til felterne tilføjes.
- `src/pages/index.tsx` `QuizBoard` returnerer et fragment `<>`: `{started && <Snowfall />}` (l.199), `Fireworks`, side-`div` (l.201), `QuestionScreen` og `SettingsMenu` som `fixed`-søskende uden for side-`div`en (l.296-313). Alle er DOM-efterkommere af det, der erstatter fragmentet, så variabler på en omsluttende `div` nedarves af dem alle. Wrapperen har ingen layoutstil og påvirker ikke `h-screen`/`fixed`/`absolute inset-0`.
- Hårdkodede farveklasser i ejede filer (komplet liste, `grep -rnE "(green|red|amber)-[0-9]+" src/pages src/components src/questionTypes` minus ikke-ejede komponenter):

| Fil:linje (nu) | Nu | Bliver | Nøgle |
|---|---|---|---|
| index.tsx:201 | `bg-green-950` | `bg-(--color-page)` | page |
| index.tsx:202 | `bg-green-700` | `bg-(--color-board)` | board |
| index.tsx:206 | `bg-green-800/60 hover:bg-green-800` | `bg-(--color-doorDone)/60 hover:bg-(--color-doorDone)` | doorDone |
| index.tsx:328 | `bg-green-950` | uændret (se beslutning) | – |
| QuestionCard.tsx:27 | `bg-red-400 hover:bg-red-300` | `bg-(--color-doorHighlight) hover:bg-[color-mix(in_oklab,var(--color-doorHighlight),white_30%)]` | doorHighlight |
| QuestionCard.tsx:29 | `bg-red-500 hover:bg-red-400` | `bg-(--color-door) hover:bg-(--color-doorHighlight)` | door |
| QuestionCard.tsx:30 | `bg-green-800 text-green-700` | `bg-(--color-doorDone) text-(--color-board)` | doorDone, board |
| QuestionScreen.tsx:84 | `bg-green-200` | `bg-(--color-screen) text-(--color-text)` | screen, text |
| SettingsMenu.tsx:15 | `bg-green-200` | `bg-(--color-screen) text-(--color-text)` | screen, text |
| ResetQuizSetting.tsx:13 | `bg-red-500 hover:bg-red-600` | `bg-(--color-door) hover:bg-[color-mix(in_oklab,var(--color-door),black_10%)]` | door |
| ResetQuizSetting.tsx:22 | `bg-green-800/20 hover:bg-green-800/30` | `bg-(--color-doorDone)/20 hover:bg-(--color-doorDone)/30` | doorDone |
| ResetQuizSetting.tsx:34 | `bg-green-800 hover:bg-green-900` | `bg-(--color-doorDone) hover:bg-[color-mix(in_oklab,var(--color-doorDone),black_10%)]` | doorDone |
| questionTypes/WordPuzzle.tsx:16 | `text-green-900` | `text-(--color-doorDone)` | doorDone |

  Ingen anden grøn/rød/rav-klasse findes i ejede filer (`Standard.tsx`, `Video.tsx`, `Music.tsx`, `PosterReveal.tsx` er farveløse). `text-white` står uændret.
- Skriftklasser at erstatte: `font-['Mountains_of_Christmas',Serif]` i index.tsx:206 (titelknappen), QuestionScreen.tsx:87 (`h2`) og SettingsMenu.tsx:19 (`h2`). Erstat med `font-(family-name:--font-title)`.
- `src/pages/_layout.tsx` indlæser præcis familierne `DM Sans` (kun `opsz`, vægt 400 og dermed syntetisk fed), `Mountains of Christmas` (400;700) og `Nunito` (400/700 + kursiv); rod-`div` bruger `font-['Nunito']`.
- Tailwind 4.1.18. Verificeret ved at kompilere kandidaterne med `@tailwindcss/node`: `bg-(--color-board)`, `bg-(--color-doorDone)/60`, `hover:bg-(--color-door)/30`, `font-(family-name:--font-title)`, `text-(--color-doorDone)` og `hover:bg-[color-mix(in_oklab,var(--color-door),black_10%)]` genererer alle CSS (`/NN` giver `color-mix(in oklab, var(...) NN%, transparent)`).
- Hex fra `node_modules/tailwindcss/theme.css` (oklch) omregnet til sRGB: green-950 `#032e15`, green-700 `#008236`, green-800 `#016630`, green-200 `#b9f8cf`, red-400 `#ff6467`, red-500 `#fb2c36`. Alle matcher Tailwinds publicerede hex.

## Implementation steps

1. `src/types.ts`: tilføj de tre felter til `Quiz` efter `music` (pinnet form ovenfor).
2. `src/quizzes/jul-2025/quiz.ts`: tilføj `snow: true`, `titleFont: "Mountains of Christmas"` og
   `colors: { page: "#032e15", board: "#008236", door: "#fb2c36", doorHighlight: "#ff6467", doorDone: "#016630", screen: "#b9f8cf", text: "#000000" }`.
3. `src/pages/index.tsx`:
   a. Tilføj `CSSProperties` til react-importen og `Quiz` til typeimporten fra `../types`.
   b. Over `QuizBoard`: `const TITLE_FONT_FAMILIES: Record<Quiz["titleFont"], string> = { "Mountains of Christmas": "'Mountains of Christmas', serif", Nunito: "'Nunito', sans-serif", "DM Sans": "'DM Sans', sans-serif" };` og `function themeStyle(quiz: Quiz): CSSProperties` der returnerer et objekt med `--color-page`, `--color-board`, `--color-door`, `--color-doorHighlight`, `--color-doorDone`, `--color-screen`, `--color-text` fra `quiz.colors` samt `--font-title` fra tabellen, castet `as CSSProperties` (React-typerne kender ikke egne variabler).
   c. Erstat `<>`/`</>` i `QuizBoard`s return med `<div style={themeStyle(quiz)}>`/`</div>`.
   d. `{started && <Snowfall />}` → `{started && quiz.snow && <Snowfall />}`.
   e. Erstat klasserne i tabellen for l.201, 202 og 206 (inkl. skriftklassen).
4. `QuestionCard.tsx`, `QuestionScreen.tsx`, `SettingsMenu.tsx`, `ResetQuizSetting.tsx`, `src/questionTypes/WordPuzzle.tsx`: erstat som i tabellen; skriftklassen i QuestionScreen:87 og SettingsMenu:19. Skriv hele klassenavne; ingen komponent får nye props.
5. `CLAUDE.md`: ret linjerne, der bliver forkerte. Packens `Quiz` indeholder nu også `snow`, `titleFont` og `colors`; nævn at `QuizBoard` sætter farverne som CSS-variabler (`--color-page|board|door|doorHighlight|doorDone|screen|text`, plus `--font-title`) på en omsluttende `div`, at komponenter bruger `bg-(--color-…)`-klasser og aldrig hårdkodede farver, at sneen kun vises hvis `snow`, og at "tom grøn baggrund" kun gælder placeholderen. Opdatér typeopremsningen i "Spørgsmål" (`titel, holdnavne, lågeord, shuffle, point, musik` + tema).
6. `npm run check`, derefter se Verification.

## Traps

- **Skriv ikke `` bg-(--color-${k}) `` eller andre sammensatte klassenavne.** Tailwind 4 scanner kildetekst og genererer kun fulde, kendte klassenavne; en dynamisk klasse mangler lydløst i buildet. Skriv hver klasse ud.
- **Brug `/NN`-modifier på `bg-(--color-x)` kun som i tabellen, og tjek CSS'en.** En stille ugenereret klasse giver gennemsigtig baggrund uden fejl. Efter `npm run build`: `grep -rhoE "color-doorDone[^}]*" dist --include=*.css | head` skal vise både `var(--color-doorDone)` og `color-mix(in oklab, var(--color-doorDone) 60%`, og tilsvarende for `doorHighlight`/`door`-`color-mix(...white 30%` og `black 10%`.
- **Sæt ikke variablerne på `_layout.tsx` eller via `document`.** Layoutet er en serverkomponent uden packen, og packen vælges først efter mount. Variablerne sættes i `QuizBoard`, som kun monteres efter packen er kendt.
- **Hold hex i `quiz.ts` og variabelnavne ens i store/små bogstaver.** `--color-doorHighlight` er case-sensitivt; `--color-doorhighlight` er en anden, tom variabel og giver lydløst ingen farve.
- **Navnet `--color-*` kolliderer ikke med Tailwinds tema**, fordi det ikke deklareres i `@theme`; tilføj ikke noget til `styles.css` (ikke ejet).
- **Brug ikke `style={{ "--color-page": … }}` uden cast.** Strict TS afviser ukendte nøgler; casten står i `themeStyle`, ikke spredt.
- **Skift ikke fragmentet til et element med `h-screen` eller `relative`.** `Fireworks` er `absolute inset-0` og `QuestionScreen`/`SettingsMenu` er `fixed`; wrapperen må ikke få layoutklasser.
- **Ret ikke farver i `FoxChickenGrain`, `MusicBox`, `GuessThatCat` eller `WordPuzzle`-komponenten,** og rør ikke `_layout.tsx` eller `src/quizzes/index.ts`; ikke ejede.
- **`DM Sans` er kun indlæst i vægt 400** (`_layout.tsx`); titlen er `font-bold`, så browseren syntetiserer fed. Det er accepteret; indlæs ikke flere vægte.
- Kommentarer: ingen er nødvendige, undtagen evt. én dansk linje ved `themeStyle` om at variablerne læses af `bg-(--color-…)`-klasserne i flere komponenter. Alt andet uden kommentarer.

## Verification

Ingen tests (projektet har ingen).

1. `npm run check` skal passere.
2. `npm run build`, kør CSS-grep fra Trap 2.
3. `npm run dev` på `http://localhost:3000/julequiz/` (nulstil med `m` → Nulstil quiz): jul-2025 ser ud som før: mørkegrøn side, grønt bræt, røde låger, mørkegrøn titelknap med hover, besvaret låge mørkegrøn med usynligt tal, lysegrøn lågeskærm og indstillingsmenu med Mountains of Christmas-overskrifter, ordspil i mørkegrøn, nulstil-knapperne røde/grønne med hover.
4. Ændr `board` i `jul-2025/quiz.ts` til fx `"#1e40af"`: brættet skifter live, og lågeskærmen/indstillinger (uden for side-`div`en) bruger stadig deres egne variabler. Ændr `screen`: begge skærme skifter. Ændr `titleFont` til `"Nunito"` og `"DM Sans"`: titel, lågeoverskrift og "Indstillinger" skifter. Sæt `snow: false`: klik på titlen starter musikken, men ingen sne. Vend alt tilbage før afslutning.
