# Dynamisk bræt (quiz-packs-dynamic-board)

> Status: in progress — quiz-packs-dynamic-board
> Branch: `quiz-packs-dynamic-board`. Base og PR-mål: `claude/vibrant-euler-3tsdtn` (ikke `main`); diff mod `origin/claude/vibrant-euler-3tsdtn`.
> Master plan: `.claude/initiatives/` (task `dynamic-board`, ingen afhængigheder).

## Goal

Lågegitteret og spørgsmålsskærmen virker for et vilkårligt antal låger og bruger `TEAM_NAMES`.
"Færdig" afledes som "alle låger, der ikke er `skip`, er besvaret"; blinkmønster og antal
gitterkolonner beregnes ud fra antallet. Med 24 låger spiller quizzen præcis som før.

## Owns (hård grænse, ordret)

`src/pages/index.tsx`, `src/components/QuestionScreen.tsx`, `src/config.ts`, `src/env.d.ts`

Intet andet må redigeres. Søsken-task `question-types` ejer `src/types.ts`, `src/questionTypes/`,
`src/questions/` og kører samtidig. Rør ikke `QuestionCard.tsx`, `quizState.ts`, `_layout.tsx`,
`CLAUDE.md`.

## Out of scope

- Spørgsmålstyper, `QuestionSpec`, `toQuestion` (`question-types`); quiz-pakker, `quiz.ts`, pakkevalg, per-pakke point/musik/shuffle (`pack-loading`); farver, titelfont, `snow` (`pack-theme`); CLAUDE.md (`interactive-types`).
- Ændring af pointregler (trøstepoint +5, fyrværkeri er globale), tastaturstyring, flere end to hold, oversættelse af UI-tekst, tests/testramme, nye afhængigheder.
- `TEAM_NAMES` og `POINTS_PER_QUESTION` forbliver i `src/config.ts` (`pack-loading` erstatter dem senere). `Question.id`, `QUESTIONS`-import og gemt tilstand uændret.

## Decisions made (afgjort af masterplanen)

- Låge-antal afledes; intet må antage 24. "Færdig" = hver låge uden `skip` er besvaret.
- `src/env.d.ts` bliver præcis `/// <reference types="vite/client" />` (Vites typer deklarerer også `*.mp3` som `string`; verificeret under planlægning).
- `LIGHTNING_ROUND_POINTS` slettes (aldrig læst).
- `QuestionScreen`s holdknapper bruger `TEAM_NAMES`.
- Constraints: UI-tekst og kommentarer på dansk, identifikatorer på engelsk; `exactOptionalPropertyTypes`; `localStorage` kun læses i effekter og `isLoaded`-porten på gem-effekten bevares; `index.tsx` er statisk prerenderet; `npm run check` skal bestå og de berørte låger åbnes i `npm run dev` (http://localhost:3000/julequiz/; nulstil via `m` -> "Nulstil quiz" før frisk bræt); `src/pages.gen.ts` redigeres aldrig; aldrig commit på `main`.

## Autonomous decisions

- Antal kolonner: `Math.round(Math.sqrt(count * 1.5))` (24 -> 6, 12 -> 4, 20 -> 5), afvist: fast 6 kolonner (dur ikke til andre antal) og en opslagstabel (mere kode).
- Kolonner sættes med inline `style={{ gridTemplateColumns: ... }}`, afvist: Tailwind `grid-cols-${n}` (dynamiske klassenavne findes ikke i buildet).
- Blinkmønster er et skakbræt: låge med 0-baseret indeks `i` blinker i gruppe `(Math.floor(i / cols) + (i % cols)) % 2`; afvist: ren lige/ulige på indeks (giver striber ved ulige kolonnetal, og matcher ikke dagens mønster).
- "Færdig" kræver mindst én låge uden `skip`, så et tomt eller helt skippet bræt ikke starter finalen ved mount. Afvist: kun `every`.
- Hjælpefunktionerne lægges i `index.tsx` over `HomePage` ved siden af `shuffleQuestions`, afvist: ny fil (ligger uden for Owns).

## Architecture facts (verificeret)

- `src/pages/index.tsx:100-101`: `allAnswered` = `[...team1Cards, ...team2Cards, ...noTeamCards]` (gitterindekser, 0-baserede); `isFinished = allAnswered.length === 24`.
- `index.tsx:114-117`: `tickQuestions` er to hårdkodede lister af 1-baserede numre; brugt i `contrast` ved `index.tsx:270` (`tickQuestions[tick ? 1 : 0]?.includes(index + 1)`). Dagens mønster er et skakbræt på 6 kolonner (1,3,5 | 2,4,6; 8,10,12 | 7,9,11; ...), så `tick=false` vælger gruppe 0 og `tick=true` gruppe 1.
- `index.tsx:262`: `"grid grid-cols-6 gap-4"` i `<main>` via `classNames`.
- `index.tsx:279`: `active={!allAnswered.includes(index) && !question.skip}`; `index.tsx:4`: importerer `POINTS_PER_QUESTION, TEAM_NAMES` fra `../config`.
- `src/components/QuestionScreen.tsx:115` og `:127`: bogstavelig `Hold 1` / `Hold 2` i holdknapperne (`onAnswer(1)` / `onAnswer(2)`); ingen import af config endnu (importer øverst, nær linje 4-10).
- `src/config.ts` har tre linjer: `POINTS_PER_QUESTION`, `LIGHTNING_ROUND_POINTS`, `TEAM_NAMES`. `TEAM_NAMES[0]` er `string | undefined` under `noUncheckedIndexedAccess` (typen er `string[]`); `index.tsx:226` bruger den allerede direkte i JSX, hvor det er fint.
- `src/env.d.ts` refererer nu `react-scripts` (findes ikke) og deklarerer `*.mp3`.

## Implementation steps

1. `src/env.d.ts`: erstat hele indholdet med den ene linje `/// <reference types="vite/client" />`.
2. `src/config.ts`: slet linjen med `LIGHTNING_ROUND_POINTS`. Kontrollér med `grep -rn LIGHTNING_ROUND_POINTS src` at intet andet henviser (CLAUDE.md nævner den, men er uden for Owns; `interactive-types` retter den).
3. `src/components/QuestionScreen.tsx`: importér `TEAM_NAMES` fra `"../config"`; erstat de to bogstavelige hold-tekster med `{TEAM_NAMES[0]}` og `{TEAM_NAMES[1]}` (samme mønster som `index.tsx:226`/`:246`). Rør intet andet, heller ikke tastaturlogikken.
4. `src/pages/index.tsx`:
   a. Over `HomePage`: tilføj `gridColumns(count: number): number` (formel ovenfor, minimum 1) og `tickGroup(index: number, columns: number): 0 | 1` (skakbræt-formlen ovenfor).
   b. Slet `tickQuestions`. Beregn `const columns = gridColumns(questions.length);`.
   c. Erstat `isFinished` med: `questions.some((q) => !q.skip) && questions.every((q, i) => q.skip || allAnswered.includes(i))`.
   d. `contrast`: erstat `tickQuestions[...]?.includes(index + 1)` med `tickGroup(index, columns) === (tick ? 1 : 0)`; behold de øvrige betingelser (`started`, `!isFinished`, `activeQuestionIndex === null`, `!question.skip`).
   e. `<main>`: fjern `grid-cols-6` fra klasserne og tilføj `style={{ gridTemplateColumns: \`repeat(${columns}, minmax(0, 1fr))\` }}`.
5. Kør `npm run check`. Åbn `npm run dev`, nulstil, start quizzen og klik: blinket er et skakbræt, hold-knapper viser `TEAM_NAMES`, alle 24 besvaret giver finale (lynrundemusik + fyrværkeri).
6. Midlertidig test (ikke committet): fjern én låge fra `QUESTIONS` i `src/questions/index.ts` lokalt, nulstil, kontrollér at 23 låger når finalen og at gitteret stadig ser rimeligt ud; sæt den tilbage med `git checkout src/questions/index.ts` og bekræft med `git status` at filen ikke er ændret.

## Traps

- **Tæl ikke låger i `allAnswered.length` mod et antal.** `skip`-låger besvares aldrig, så en længdesammenligning kan ikke blive sand, når en låge er `skip`. Test hver låges indeks mod `allAnswered`.
- **Brug ikke `grid-cols-${columns}`.** Tailwind 4 scanner kildetekst og genererer kun kendte klassenavne; den dynamiske klasse mangler i buildet og gitteret kollapser til én kolonne. Brug inline `gridTemplateColumns`.
- **Lav ikke blinkmønsteret som `index % 2`.** Det giver lodrette striber, ikke dagens skakbræt.
- **Læs ikke `window` eller `localStorage` under render, og fjern ikke `isLoaded`-porten** (kommentaren ved `index.tsx:148`). Siden er statisk prerenderet.
- **Ret ikke `src/questions/` eller `src/types.ts`** selvom test-trinnet i step 6 peger dertil; ændringen vendes tilbage med `git checkout` før afslutning.
- **Rediger ikke `src/pages.gen.ts`.**
- Kommentarer: kun hvis de tilføjer en ikke-oplagt grund. Det er ikke nødvendigt for denne ændring; alt andet skal være uden kommentarer.

## Verification

Ingen nye tests (projektet har ingen, og ændringen er afledninger synlige ved læsning). `npm run check` skal bestå. Manuel gennemgang i `npm run dev`: (1) 24 låger i 6 kolonner, skakbrætblink identisk med før; (2) `Hold 1`/`Hold 2` i bunden af en åben låge; (3) 24 besvarede giver finale; (4) midlertidigt 23 låger giver finale efter 23 svar og 23-gitteret går ikke i stykker; (5) `git status` viser kun de fire ejede filer ændret.
