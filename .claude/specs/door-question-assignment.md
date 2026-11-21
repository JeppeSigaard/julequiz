# Løbende tildeling af spørgsmål til låger

> Status: in progress — claude/youthful-davinci-wlc04o

## Goal

I dag blandes spørgsmålene én gang ved start, så hver låge har sit spørgsmål fra begyndelsen. Det
giver ofte samme spørgsmålstype flere gange i træk. I stedet skal quizzen "snyde": en låge får først
sit spørgsmål, når quizmasteren åbner den første gang, og valget styres, så typerne fordeles jævnt
over gennemspilningen. Et spørgsmål kan desuden kræve et mindste lågenummer (Fingerspurt i `gg26`:
kun bag låge 20, 21 eller 22). En tildeling er permanent og overlever luk/genåbn og genindlæsning.
Åbningen må ikke blive langsommere.

## Out of scope

- Ændringer i `QuestionCard`, `QuestionScreen`, `EndScreen`, `decor.tsx`, renderere i
  `src/questionTypes/*.tsx` (ud over `index.tsx`), `mediaCache.ts` og prøverunden.
- Migrering af gemt `v2`-tilstand (den ignoreres bare; se Decisions).
- Tests, testramme, nye afhængigheder, nye indstillinger i menuen, ny UI-tekst.
- At fjerne `"skip"` fra `QuestionCard`s `Status`-type.
- `src/pages.gen.ts`.

## Decisions made

- Hvad betyder "fra låge nr. 20"? → **Lågenummeret på brættet** (det viste tal, 1-baseret) skal være
  ≥ 20, uanset hvornår lågen åbnes. Den sidste ledige låge med nummer ≥ 20 tvinges til Fingerspurt.
- Hvordan angives det? → Nyt valgfrit felt **`minDoor?: number`** i `QuestionSpec`s `Common`, sat til
  `20` i `src/quizzes/gg26/questions/22-fingerspurt.tsx`. Ingen hardcoding af type eller filnavn.
- Hvor hårdt undgås gentagelser? → **Aldrig samme type som forrige tildeling**, så længe der er en
  anden type blandt kandidaterne. Typen fra tildelingen før det får halv vægt. Ellers vægtes en type
  med antal tilbageværende kandidater af typen.
- "Type" → `QuestionSpec["type"]` (`standard`, `music`, …; `custom` er sin egen type).
- `skip: true`-spørgsmål → **udelades helt fra brættet** (én låge færre). Ingen pakke bruger det nu.
- `Quiz.shuffle: false` → låge *i* får spørgsmål *i* i filrækkefølge som i dag; `minDoor` og
  typefordeling gælder ikke. `shuffle: true` → løbende tildeling.
- Umulig `minDoor` (fx 30 i en pakke med 22 låger) → kravet ignoreres stille for det spørgsmål
  (reglen "ingen brugbare kandidater ⇒ hele puljen" nedenfor).
- Lagring → nyt format **`v3`** under nøglen `julequiz-state-v3:<pakke>`. Gemt `v2` læses ikke; en
  igangværende quiz starter forfra efter udgivelsen.
- Tildelingen sker synkront i klik-handleren. Alle medier er allerede hentet ved start, så der
  tilføjes ingen ventetid og ingen ny indlæsning.

## Architecture facts (verified)

- `src/components/QuizBoard.tsx`: `shuffleQuestions` (l. 38-48), state `questions` (l. 61),
  `pickQuestion(index, question)` (l. 119-124), afledninger `columns`/`doorCount`/`isFinished`
  (l. 171-176), `activeQuestion` (l. 190-191), load-effekt (l. 215-237), save-effekt med
  `isLoaded`-port (l. 239-260), gitteret `questions.map(...)` (l. 331-369).
  `team1Cards`/`team2Cards`/`noTeamCards` er lågeindekser (0-baseret); lågenummer = indeks + 1.
- `src/quizState.ts`: `SavedQuizState` med `questionIds`, `storageKey` (`v2`), `isCardArray`,
  `loadQuizState(pack, questions)`. Kun `QuizBoard.tsx` kalder `loadQuizState`/`saveQuizState`.
- `src/types.ts`: `Question` (l. 3-10), `Common` (l. 14). `src/questionTypes/index.tsx`: `common`
  (l. 16-19) spredes ind i alle `toQuestion`-grene.
- `QuestionCard` kalder kun `onClick` ved status `"closed"`; en besvaret låge kan ikke genåbnes.
- `QuizPage` monterer først `QuizBoard` på klienten; `Math.random` i en handler er uproblematisk.
- Preload-effekten (l. 83-99) henter medier for alle `quiz.questions`; den røres ikke.
- React Compiler er slået til, og dev kører StrictMode (updaters og effekter køres dobbelt).
- Node er v22.23: `node --experimental-strip-types fil.ts` kan køre en `.ts`-fil med kun type-imports.

## Implementation steps

1. **`src/types.ts`**: tilføj `type: QuestionSpec["type"]` (påkrævet) og `minDoor?: number` til
   `Question`; tilføj `minDoor?: number` til `Common`.
2. **`src/questionTypes/index.tsx`**: udvid `common` med `type: spec.type` og
   `...(spec.minDoor !== undefined && { minDoor: spec.minDoor })` (samme form som `skip`-linjen).
   Rør ikke switchen.
3. **`src/quizzes/gg26/questions/22-fingerspurt.tsx`**: tilføj `minDoor: 20`.
4. **Ny fil `src/assignQuestion.ts`** (ingen `"use client"`, kun `import type { Question }`):

   ```ts
   export function assignQuestion(
     pool: Question[],      // spørgsmål uden låge
     freeDoors: number[],   // lågenumre (1-baseret) uden spørgsmål, inkl. `door`
     door: number,          // lågenummeret, der åbnes
     recentTypes: string[], // typer for tidligere tildelinger, nyeste først
   ): Question
   ```

   Regler, i denne rækkefølge:
   a. `min(q) = q.minDoor ?? 1`. `doorsLeft = freeDoors` uden `door`.
   b. En kandidat `c` er **brugbar**, hvis `min(c) <= door`, og hvis der for resten
      (`rest = pool` uden `c`) gælder for hvert `q` i `rest` med `minDoor` sat:
      antal `r` i `rest` med `min(r) >= min(q)` ≤ antal `d` i `doorsLeft` med `d >= min(q)`.
   c. `candidates` = de brugbare; er der ingen, så `candidates = pool`.
   d. Vægt pr. type blandt `candidates`: antal kandidater af typen; × 0, hvis typen er
      `recentTypes[0]`; × 0,5, hvis typen er `recentTypes[1]`. Er alle vægte 0 (kun forrige type
      tilbage), bruges antallet uden faktorer.
   e. Træk en type med vægtet lodtrækning (`Math.random() * sum`), og derefter et spørgsmål
      ligeligt blandt `candidates` af den type. Kaldes aldrig med tom `pool`.
5. **`src/quizState.ts`**: erstat `questionIds` i `SavedQuizState` med
   `assignments: { door: number; id: string }[]` (lågeindeks 0-baseret, i tildelingsrækkefølge).
   Nøglen bliver `julequiz-state-v3:`. `loadQuizState(pack, questions)` får nu **kun de låger, der
   er på brættet** (ikke-skip) og validerer: `assignments` er et array af objekter med heltals-`door`
   i `[0, questions.length)` og `id` som kendt id; ingen `door` og intet `id` forekommer to gange.
   Kort-arrays valideres som i dag mod `questions.length`. Ret kommentaren i l. 3 til at sige, at
   kortene er lågeindekser, og at tildelingerne derfor gemmes sammen med dem.
6. **`src/components/QuizBoard.tsx`**:
   - Slet `shuffleQuestions` og `questions`-state. Tilføj øverst i komponenten
     `const doors = quiz.questions.filter((q) => !q.skip);` og state
     `const [assignments, setAssignments] = useState<{ door: number; id: string }[]>([]);`.
   - Tilføj `const questionAt = (index: number) => quiz.shuffle ? doors.find((q) => q.id ===
     assignments.find((a) => a.door === index)?.id) : doors[index];`.
   - `pickQuestion` bliver `(index: number) => () => {...}`: `let question = questionAt(index)`;
     hvis `undefined` (kun muligt ved `shuffle`): byg `pool` (døre, hvis id ikke er i
     `assignments`), `freeDoors` (numre `i + 1` for indekser uden tildeling), `recentTypes`
     (`assignments` bagfra, mappet til spørgsmålets `type`), kald `assignQuestion(pool, freeDoors,
     index + 1, recentTypes)` og `setAssignments([...assignments, { door: index, id: question.id }])`.
     Derefter `setActiveQuestionIndex(index)` og `setVolume`-linjen som i dag.
   - `columns = gridColumns(doors.length)`, `doorCount = doors.length`,
     `isFinished = doors.length > 0 && doors.every((_, i) => allAnswered.includes(i))`,
     `activeQuestion = activeQuestionIndex !== null ? questionAt(activeQuestionIndex) : undefined`.
   - Load-effekt: `loadQuizState(quiz.name, doors)`; ved gemt tilstand `setAssignments(saved.assignments)`
     plus de fem eksisterende settere; `else`-grenen med blanding slettes.
   - Save-effekt: gem `assignments` i stedet for `questionIds`; byt `questions` ud med `assignments`
     i afhængighedslisten. Behold `isLoaded`-porten og dens kommentar uændret.
   - Gitter: `doors.map((_, index) => …)` med `key={index}`; `gridTemplateRows` bruger
     `doors.length`; status-kæden mister `question.skip ? "skip"`-leddet; `glow` mister
     `!question.skip`; `onClick={pickQuestion(index)}`.
7. **`CLAUDE.md`**: ret sætningen om blanding ved mount ("rækkefølgen blandes ved mount…") til løbende
   tildeling via `src/assignQuestion.ts`, `v2` → `v3`, nævn `minDoor` ved `backgroundVolume`/`skip`
   i pakke-afsnittet, og at `skip`-spørgsmål udelades fra brættet. Ret også kommentaren i
   `QuizPage.tsx` l. 15 ("før blanding" passer ikke længere: skriv "før gemt tilstand og skalering").
8. Kør `npm run check`. Commit på dansk på den aktuelle branch; aldrig på `main`.

## Traps

- **Træk ikke spørgsmålet i en `setState`-updater, i render, i `useMemo` eller i en effekt.**
  StrictMode kører updaters og effekter to gange, og React Compiler kræver ren render: to lodtrækninger
  giver to forskellige spørgsmål, og lågen skifter indhold. Træk i klik-handleren (`pickQuestion`), og
  kald `setAssignments([...assignments, …])` med en færdig værdi.
- **Tildel ikke igen, hvis lågen allerede har en tildeling.** Escape lukker lågen uden svar; næste
  åbning skal vise samme spørgsmål. `pickQuestion` slår altid op med `questionAt` først.
- **Tildel ikke alle låger på forhånd "for hastighedens skyld" og hent ikke medier ved åbning.**
  Forhåndstildeling er netop den adfærd, der fjernes, og alle medier ligger allerede som blobs.
- **Udled ikke forrige type af kort-arrays eller lågeindeks.** Rækkefølgen i `assignments` er den
  eneste kilde til "forrige" og "forrige før det"; sortér eller omarrangér den aldrig.
- **Spring ikke resten-tjekket i regel 4b over.** Kun at filtrere `min(c) <= door` lader låge 20-22
  blive brugt op af andre spørgsmål, og Fingerspurt ender stille bag en lav låge via reserven i 4c.
- **Forveksl ikke lågeindeks (0-baseret: kort-arrays, `assignments.door`) med lågenummer (1-baseret:
  `minDoor`, `freeDoors`, `door`).** En forskydning på én giver ingen fejl, bare Fingerspurt bag låge 19.
- **Brug ikke `quiz.questions.length` eller indekser i `quiz.questions` til brættet.** Med et
  `skip`-spørgsmål forskydes alt; brug `doors` overalt (preload-effekten er eneste undtagelse).
- **Behold `key={index}` og giv ikke `QuestionCard` spørgsmålet.** Et id som key findes ikke før
  tildeling, og et keyskift ved tildeling ville remonte kortet midt i åbningsanimationen.
- **Læs ikke `localStorage` i en `useState`-initializer, og fjern ikke `isLoaded`-porten.** Første
  commit ville skrive en tom quiz, som StrictModes anden load-kørsel så læser.
- **Sæt ikke `minDoor: undefined` og tilføj ikke `default` i `toQuestion`-switchen**
  (`exactOptionalPropertyTypes`; switchen er udtømmende med vilje).
- **Nulstil ikke via state.** `ResetQuizSetting` rydder og genindlæser; den virker uændret, fordi
  `clearQuizState` bruger samme `storageKey`.
- Kommentarer skal tilføje værdi, på dansk, højst én linje. Kun to steder: over resten-tjekket i
  `assignQuestion.ts` (hvorfor: spørgsmål med `minDoor` skal stadig have en ledig låge bagefter) og
  den rettede kommentar i `quizState.ts`. Alt andet skal være uden kommentarer.

## Verification

Ingen tests i repoet (ingen testramme; ikke ønsket her). I stedet:

1. `npm run check` skal passere.
2. Simulér `assignQuestion` med et engangsscript i scratch-mappen (committes ikke), kørt med
   `node --experimental-strip-types`: 22 falske spørgsmål med `gg26`s typefordeling (4 music,
   2 standard, 3 video, 4 posterReveal, 4 wordPuzzle, 4 priceGuess, 1 embed med `minDoor: 20`),
   5000 gennemspilninger med tilfældig åbningsrækkefølge. Kræv: alle spørgsmål tildelt præcis én
   gang; embed altid på låge 20-22; samme type to gange i træk forekommer kun, når den tvungne embed
   ikke er involveret og alle kandidater havde samme type (forventet sjældent; rapportér andelen).
3. I browseren (`npm run dev`, `/julequiz/gg26`): åbn en låge, luk med Escape, åbn igen → samme
   spørgsmål. Genindlæs → samme spørgsmål bag samme låge, point bevaret. Åbn låge 1-19 → aldrig
   Fingerspurt. Åbn 20, 21, 22 → præcis én er Fingerspurt (den sidste, hvis ikke før). Ingen mærkbar
   pause ved klik. Spil færdig → slutskærmen vises. "Nulstil quiz" → nye tildelinger.
4. `/julequiz/jul-2025`: fuld gennemspilning virker, ingen type to gange i træk undtagen evt. til
   sidst (`standard` har 9 af 24).
