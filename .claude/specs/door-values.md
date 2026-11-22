# Lågeværdier: stigende point med skjult forskelsled

> Status: ready for execution

## Goal

I dag giver hver låge `pointsPerQuestion` (100). Fremover får hver låge sin egen værdi, som
trækkes og gemmes, første gang lågen åbnes, og vises på lågens bånd ("Låge 7 · 550 point").
Værdien er mindst en trinværdi, der stiger gennem quizzen (100/200/300), og ellers en tilfældig
andel (30–110 %) af pointforskellen mellem holdene. Værdien er den samme, uanset hvilket hold der
vinder lågen. Formålet er en tættere quiz, hvor holdet bagud oftere kan vende kampen. Tallene må
gerne løbe løbsk (millioner ved et æg), så pointpladerne skal kunne vise lange tal.

## Out of scope

- Ingen fordel til ét bestemt hold (ingen "dobbelt til holdet bagud"), intet loft over værdien.
- Ingen visning af næste låges værdi på brættet, og ingen forklaring af reglen nogen steder i UI.
- Ingen ændring af `Quiz`-typen eller `quiz.ts`-filerne; `pointsPerQuestion` bliver grundværdien.
- Ingen ændring af `TeamPointsSetting` (trin ±5/±`pointsPerQuestion`), trøstepoint, `EndScreen`s
  logik eller teksten "point · N låger".
- Ingen værdi på prøvespørgsmål.
- Ingen ændring af pladernes bredde, `Paper`, `PillButton`, `KeyCap` eller `nameFontSize`.
- Ingen migrering af gemt `v3`-state, ingen oprydning af gamle `v3`-nøgler.
- Ingen tests (repoet har ingen testopsætning).

## Decisions made

- Mekanik → symmetrisk: lågen er lige meget værd for begge hold.
- Formel → `max(trin, forskel × andel rundet OP til nærmeste halve grundværdi)`, hvor
  - grundværdi = `quiz.pointsPerQuestion` (100), halv grundværdi = 50,
  - trin = grundværdi × (1 + `floor(åbnede × 3 / antal låger)`), altså 100/200/300 i tredjedele,
  - åbnede = antal låger, der allerede har fået en værdi (ikke antal besvarede),
  - forskel = `|hold 1's point − hold 2's point|` inkl. trøstepoint, i det øjeblik lågen åbnes,
  - andel = jævnt tilfældig mellem 0,3 og 1,1.
- Værdien må gerne falde igen fra låge til låge (ingen "falder aldrig"-regel).
- Fastsættelse → første gang lågen åbnes. Lukkes lågen med Escape uden svar, beholder den sin
  værdi og trækker ikke en ny, når den åbnes igen (som spørgsmålstildelingen).
- "Ingen"-låger → værdien går tabt; intet hold får den.
- Afsløring → på båndet i den åbne låge: `${doorWord} ${n} · ${værdi} point`. Derudover står
  værdien under rosetten på en låge, et hold har vundet (ikke på "ingen"-låger).
- Store tal → tusindtalspunktum overalt, hvor point vises (`1.450`, `3.556.750`), og
  pointpladernes tal krymper, når det er for langt. Negative tal beholder U+2212.
- Gemt format → nyt felt `doorValues`, nøglen bumpes til `v4`. En igangværende `v3`-quiz
  ignoreres og starter forfra (accepteret).
- En vundet låge uden gemt værdi (bør ikke ske) tæller `pointsPerQuestion`.

## Architecture facts (verified)

- `src/components/QuizBoard.tsx`: al quiz-state. `pickQuestion(index)` (l. 113) åbner en låge og
  tildeler spørgsmål ved `shuffle`; uden `shuffle` oprettes ingen `assignments`, så værdier kan
  ikke ligge i `Assignment`. `team1Points`/`team2Points` udledes l. 189–192 (efter `pickQuestion`
  i filen). Load-effekt l. 221–235, save-effekt med `isLoaded`-port l. 237–257.
  `QuestionScreen` for lågen får `title` l. 381; prøverunden har sin egen l. 396.
- `src/quizState.ts`: `SavedQuizState`, `storageKey` (`julequiz-state-v3:`), `loadQuizState`
  returnerer `null` ved ethvert uventet format. `clearQuizState` bruger samme `storageKey`.
- `src/assignQuestion.ts`: ren funktion i sin egen fil under `src/`; mønster for den nye fil.
- `src/components/QuestionCard.tsx`: valgfri prop `teamName` gives med spread i `QuizBoard`
  l. 332 pga. `exactOptionalPropertyTypes`. Den vundne låges rosette ligger i en
  `flex items-center justify-center`-div (l. 138). Kortet er en `[container-type:size]`, så
  størrelser er i `cqmin`.
- `src/components/decor.tsx`: `PLAQUE.board.points = "text-[70px]"`, `PLAQUE.end.points =
  "text-[158px]"`; tallet renderes l. 151–153 med `leading-[0.95]`. Pladsen til tal er ca. 149 px
  (board, ved siden af enheden "point") og 372 px (end).
- `src/components/AnimatedNumber.tsx`: eneste bruger er `TeamPlaque`; formaterer selv minus.
- `QuizBoard` renderes først efter mount (`QuizPage`), så `toLocaleString` giver ingen
  hydreringsforskel.

## Implementation steps

1. Opret `src/doorValue.ts` med to eksporter og ingen andre:
   - `doorValue(base: number, opened: number, doorCount: number, gap: number, roll: number): number`
     der returnerer `Math.max(step, Math.ceil((gap * (0.3 + roll * 0.8)) / (base / 2)) * (base / 2))`
     med `step = base * (1 + Math.floor((opened * 3) / doorCount))`. `roll` er et tal i [0, 1).
   - `formatPoints(points: number): string` der returnerer
     `Math.abs(points).toLocaleString("da-DK")` med `−` (U+2212) foran, når `points < 0`.
2. `src/quizState.ts`: eksportér `export type DoorValue = { door: number; value: number };`, tilføj
   `doorValues: DoorValue[]` til `SavedQuizState`, og ret nøglen til `julequiz-state-v4:`. I
   `loadQuizState`: valider `doorValues` som et array, hvor hvert element har `door` (heltal,
   `0 <= door < questions.length`, ingen dubletter) og `value` (`Number.isFinite`); ellers
   `return null`, som resten af funktionen. Returnér feltet.
3. `src/components/QuizBoard.tsx`:
   a. Ny state `const [doorValues, setDoorValues] = useState<DoorValue[]>([]);` ved de øvrige.
   b. Flyt `team1Points`/`team2Points` op over `pickQuestion`, og beregn dem som summen af
      `doorValues.find((v) => v.door === door)?.value ?? quiz.pointsPerQuestion` over holdets
      kort plus trøstepoint.
   c. I `pickQuestion`s returnerede handler, før `setActiveQuestionIndex(index)`: har lågen ingen
      værdi i `doorValues`, så `setDoorValues([...doorValues, { door: index, value:
      doorValue(quiz.pointsPerQuestion, doorValues.length, doors.length,
      Math.abs(team1Points - team2Points), Math.random()) }])`.
   d. Load-effekt: `setDoorValues(saved.doorValues)`. Save-effekt: tilføj `doorValues` både til
      objektet og til dependency-listen.
   e. Lågens `QuestionScreen`-`title`: `` `${quiz.doorWord} ${n} · ${formatPoints(value)} point` ``,
      hvor `value` er lågens værdi; mangler den, bruges den nuværende titel uændret. Prøverundens
      titel røres ikke.
   f. Giv `QuestionCard` lågens værdi som `value` med samme spread-mønster som `teamName`, kun når
      `status` er `"team-1"` eller `"team-2"` og værdien findes.
4. `src/components/QuestionCard.tsx`: ny valgfri prop `value?: number`. I den vundne låges
   rosette-div (l. 138): tilføj `flex-col gap-[3cqmin]`, og under rosetten, når `value` er
   defineret, `<span className="font-display text-[15cqmin] font-bold leading-none text-snow">
   {formatPoints(value)}</span>`. Udvid `aria-label` med `, ${formatPoints(value)} point`, når
   værdien findes.
5. `src/components/AnimatedNumber.tsx`: returnér `<span>{formatPoints(displayValue)}</span>`.
6. `src/components/decor.tsx`:
   - Tilføj `pointsFit: { size: 70, width: 149 }` til `PLAQUE.board` og
     `pointsFit: { size: 158, width: 372 }` til `PLAQUE.end`. Behold `points`-klasserne.
   - Tilføj ved siden af `nameFontSize`:
     `pointsFontSize(points, fit) = Math.min(fit.size, fit.width / (formatPoints(points).length * 0.52))`.
   - Pak `<AnimatedNumber value={points} />` i
     `<span style={{ fontSize: pointsFontSize(points, s.pointsFit) }}>`. Den ydre span beholder
     `s.points` og `leading-[0.95]`.
7. Opdatér `CLAUDE.md`: punktet "Point udledes, ikke lagres" (værdi pr. låge, formlen i én
   sætning, `src/doorValue.ts`, format `v4`) og `TeamPlaque`-linjen under `decor.tsx`
   (pointtallet krymper efter antal tegn, `pointsFontSize`).
8. Kør `npm run check`, og gennemfør Verification i browseren.

## Traps

- **Kald ikke `doorValue`/`Math.random()` under render, i `useMemo` eller i en effekt.** React
  Compiler og StrictMode kører render flere gange, så værdien ville skifte mellem renders og på
  båndet. Træk den kun i klik-handleren i `pickQuestion`, og læs den derefter fra `doorValues`.
- **Træk ikke en ny værdi, når en låge genåbnes.** Tjek `doorValues` først, præcis som
  `questionAt(index)` tjekkes før `assignQuestion`. Ellers kan quizmasteren lukke og åbne lågen,
  til tallet passer.
- **Tæl ikke besvarede låger til trinnet.** Brug `doorValues.length` før den nye værdi lægges
  til. `allAnswered.length` halter bagefter, når en låge er lukket uden svar.
- **Læg ikke værdien i `Assignment`.** Pakker uden `shuffle` har ingen assignments, så deres
  låger ville aldrig få en værdi og stille og roligt tælle 100.
- **Behold nøgleskiftet til `v4`.** Uden det læser en gammel `v3`-state `doorValues` som
  `undefined`; enten crasher `.find`, eller også tæller alle låger 100 uden fejl.
- **Glem ikke `doorValues` i save-effektens dependency-liste**, og rør ikke `isLoaded`-porten:
  uden den overskriver første commit den gemte quiz med standardværdier.
- **Indfør intet loft, ingen `Math.max(0, …)` og ingen "falder aldrig"-regel.** Simuleringerne
  viste, at et loft fjerner hele comeback-effekten; løbske tal er valgt med vilje.
- **Rund op, ikke af** (`Math.ceil`), og brug `base / 2` som enhed; hardkod ikke 50 eller 100.
- **Sæt ikke skriftstørrelsen på den ydre point-span i `TeamPlaque`.** Den bærer linjehøjden;
  krymper den, bliver pladen lavere, og brættets header er trimmet til pladens højde. Kun den
  indre span om tallet får `fontSize`.
- **Beregn `pointsFontSize` ud fra `points`-proppen, ikke det animerede tal.** Ellers hopper
  størrelsen, mens tallet tæller op.
- **`2.400` skal stå i fuld størrelse (70/158 px) som i dag.** Gør konstanten 0,52 det ikke, så
  justér konstanten, ikke pladens bredde eller padding.
- **Byg ikke Tailwind-klasser ved interpolation**, brug kun token-utilities (`text-snow`), ingen
  rå hex, og aldrig `var(--color-<afledt>)` i arbitrary values. Størrelser i `QuestionCard` er
  `cqmin`, alt andet px; aldrig `vw`/`vh`.
- Sæt aldrig valgfrie props til `undefined` (`exactOptionalPropertyTypes`); brug spread.
- Kommentarer skal tilføre noget. Kun ét sted fortjener én: over `doorValue`, en dansk linje om
  at værdien er ens for begge hold, og at forskelsleddet er det, der giver holdet bagud en chance.
  Alt andet uden kommentarer. Commit-beskeder på dansk, aldrig direkte på `main`.

## Verification

Ingen nye tests. `npm run check` skal passere. Derefter i browseren (`npm run dev`,
`http://localhost:3000/julequiz/gg26`, uden afsluttende `/`; Playwright er installeret):

1. Ny quiz: første låge viser "Låge N · 100 point" på båndet. Giv den til Hold 1: pladen viser
   100, og lågen på brættet viser "100" under rosetten.
2. Luk en låge med Escape og åbn den igen: samme værdi. Genindlæs siden: værdier og point er
   bevaret.
3. Giv Hold 1 +100 otte gange i indstillingerne (forskel 900) og åbn en ny låge: værdien er
   mellem 300 og 1.000, delelig med 50. "Ingen" (q) giver ingen point og intet tal på lågen.
4. Åbn 8 låger ved lige stilling: låge 9–16 viser 200, låge 17–24 viser 300.
5. Skriv en `julequiz-state-v4:gg26` i `localStorage` med alle 24 låger vundet af Hold 1 og
   værdier, der summer til 3.556.750, og tag skærmbilleder af brættet (fjern én låge fra
   `team1Cards`) og slutskærmen: tallene står på én linje inden for pladen, og pladerne har samme
   højde som ved 2.400. Tjek også et negativt tal (−1.250) via indstillingerne.
6. Prøverunden (`p`) viser stadig "Prøve 1" uden point.
