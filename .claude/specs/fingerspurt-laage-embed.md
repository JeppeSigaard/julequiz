# Embed-låge (julequiz): spørgsmålstypen `embed`

> Status: in progress — fingerspurt-laage-embed
> Branch: `claude/gg26-julequiz-spectator-gate-t7du9e` (allerede checket ud i worktreet; executoren committer dér og pusher aldrig)

## Goal

Julequizzen får spørgsmålstypen `embed`: en låge, hvis spørgsmålsside er en iframe til en https-URL (senere Fingerspurt) med en knap, der sætter selve iframe-elementet i fuldskærm. Svarsiden har `standard`s form. Der laves ingen gg26-låge her; den ejes af en senere opgave (`gg26-laagen`).

## Out of scope

- Selve gg26-lågen; alt i Fingerspurt; `postMessage` eller anden dataudveksling med den indlejrede side.
- Forudindlæsning (ingen medier), nye afhængigheder, nye abstraktioner, ændring af `QuestionScreen.tsx`, `decor.tsx` eller `Standard.tsx`.
- Filer uden for Owns (nedenfor). Den midlertidige testpakke (trin 5) er den eneste undtagelse og slettes før sidste commit.

## Owns (hård grænse)

`src/types.ts`, `src/questionTypes/index.tsx`, `src/questionTypes/Embed.tsx` (ny), `CLAUDE.md`. Plus denne spec og den midlertidige testdør (slettes).

## Decisions made

- Pinnet form (må ikke afvige): `{ type: "embed"; question: { url: string; text?: string }; answer: Slide; backgroundVolume?: number }`. `answer` har `standard`s svarform, dvs. `Slide`.
- Iframen har `allow="fullscreen; autoplay"`. Fuldskærmsknappen kalder `requestFullscreen()` på iframe-elementet selv (ikke på kortet eller siden).
- Når svaret vises, afmonteres iframen (det sker allerede: `QuestionScreen.tsx:153` bruger `<Fragment key=...>` med body eller answer). Byg ikke noget ekstra til det.
- Preload: kun svarets medier via `slideMedia(spec.answer)`; selve iframe-URL'en forudindlæses ikke.
- Ingen kommunikation med iframen; vinderen afgøres manuelt med musen/tastaturet som i alle låger.
- Fuldskærm ejes af julequizzen (Fingerspurt får ingen knap).

## Architecture facts (verified)

- `src/types.ts`: `QuestionSpec = Common & (| {type:"standard"; question: Slide; answer: Slide} | … | {type:"custom"; …})`. `Slide = { text?; note?; image?; video?; audio? }`. `Common` giver `backgroundVolume?` og `skip?`.
- `src/questionTypes/index.tsx`: `toQuestion(spec, id)` har et `switch (spec.type)` UDEN default (bevidst), og `common` spredes sidst i hvert returnobjekt (`...common`). `Question` kræver `preload: string[]`. Valgfrie felter udelades frem for at sættes til `undefined` (`exactOptionalPropertyTypes`), se `video`-casen med `caption`.
- Svarsiden: genbrug `<SlideView slide={spec.answer} />` fra `./Standard` (som `standard` og `video` gør). `textSize(text)` og `mediaFrame` eksporteres også fra `src/questionTypes/Standard.tsx`.
- Næsteligger-mønster: `src/questionTypes/Video.tsx` (body-komponent med `useState`, `mediaFrame`, `classNames`, Tailwind-tokens) og `PriceGuess.tsx`.
- `QuestionScreen.tsx:44-72`: en `window`-`keydown`-lytter kalder `preventDefault` og håndterer Enter/mellemrum (vis svar), Escape, 1/2/q/x. `main` er `w-[1200px]`, flex-kolonne, centreret (linje ~150). Footerens `PillButton` "Vis svaret" virker med musen.
- `PillButton` (`src/components/decor.tsx:44`): props `variant: "team-1"|"team-2"|"neutral"|"dark"`, valgfri `keyHint`, plus almindelige button-props. Fast skriftstørrelse, min-bredde 276 px.
- Scenen er en fast 1920×1080 med `scale()` (`Stage.tsx`); al layout i px, aldrig `vw`/`vh`.
- Pakker findes med `import.meta.glob` i `src/quizzes/index.ts`; en ekstra mappe `src/quizzes/<navn>/{quiz.ts,questions/*.tsx}` udgives straks. `src/quizzes/gg26/quiz.ts` er en brugbar skabelon. Mappenavn = URL-sti (`/julequiz/<navn>`).
- `CLAUDE.md`, afsnittet "Quiz-pakker", linjen der begynder "`QuestionSpec.type` er `standard`, `wordPuzzle`, …" lister typerne: den skal have `embed` med en kort parentes.

## Implementation steps

1. `src/types.ts`: tilføj medlemmet `| { type: "embed"; question: { url: string; text?: string }; answer: Slide }` i `QuestionSpec`-unionen, efter `video` (før `custom`). `backgroundVolume` kommer allerede fra `Common`, så skriv det ikke igen.
2. Opret `src/questionTypes/Embed.tsx` med `export const EmbedBody = ({ url, text }: { url: string; text?: string })`:
   - `useRef<HTMLIFrameElement>(null)` og `useState(false)` for `fullscreen`; `useEffect` lytter på `document` `fullscreenchange` og sætter `fullscreen = document.fullscreenElement === ref.current`; fjern lytteren i cleanup.
   - Hvis `text !== undefined`: en `<p>` over iframen med `textSize(text)`-lignende hierarki, men mindre (fx `text-[43px]`, `font-body font-extrabold leading-tight text-ink`), så iframen får plads.
   - `<iframe ref src={url} title="Indlejret side" allow="fullscreen; autoplay" className={`${mediaFrame} h-[…px] w-[…px] bg-paper-lit`} />`. Vælg faste px-mål, der passer i kortets `main` (bredde max 1200 px); start med `w-[1100px]` og `h-[560px]` (`h-[460px]` hvis `text` er sat), og justér efter at have set kortet i browseren. Skriv fulde klassenavne, ingen dynamiske Tailwind-klasser.
   - En `PillButton variant="neutral"` med teksten "Fuldskærm" (dansk), `onClick={() => void ref.current?.requestFullscreen()}`; ingen `keyHint` (Enter er optaget af "Vis svaret"). Skjul/deaktivér ikke knappen i fuldskærm (den er alligevel usynlig der); `fullscreen`-state bruges kun, hvis du har brug for den til fokus, ellers så drop state og lytter helt (mindste ændring).
   - Efter udgang af fuldskærm: kald `window.focus()` i `fullscreenchange` når `document.fullscreenElement === null`, så Enter/1/2/Escape igen når `QuestionScreen`s `window`-lytter (fokus kan ellers blive i iframen).
3. `src/questionTypes/index.tsx`: importér `EmbedBody` og tilføj `case "embed":` efter `video`:
   body `<EmbedBody url={spec.question.url} {...(spec.question.text !== undefined && { text: spec.question.text })} />`, answer `<SlideView slide={spec.answer} />`, `preload: [...slideMedia(spec.answer)]`, `...common`. (Svarsidens medier forudindlæses som i `video`-casen; selve URL'en ikke.)
4. `CLAUDE.md`: tilføj `embed` i typelisten ("`embed` (iframe til en https-URL med fuldskærmsknap; svar som `standard`)") og ret ellers ingenting.
5. Midlertidig testpakke (SLETTES før sidste commit): opret `src/quizzes/embedtest/quiz.ts` (kopi af `gg26/quiz.ts`; fjern ikke-eksisterende musikstier ved at pege på samme `/quizzes/gg26/audio/…`-filer) og `src/quizzes/embedtest/questions/01-embed.tsx` med `type: "embed"`, `question: { url: "https://example.com", text: "Test" }`, `answer: { text: "Svar" }`. Kør `npm run dev` i baggrunden og åbn `http://localhost:3000/julequiz/embedtest` med Playwright (`require('playwright')`, chromium).

## Traps

- **Tilføj ingen `default` til `switch` i `toQuestion`.** Den er udtømmende med vilje, så en ny type giver kompileringsfejl; `embed` skal være en eksplicit case.
- **Skriv ikke `text: undefined` eller `caption`-lignende undefined-felter.** `exactOptionalPropertyTypes` afviser det; brug spread-mønstret fra `video`-casen.
- **Kald ikke hooks i `toQuestion`.** Den kører ved modulindlæsning; `useRef`/`useState`/`useEffect` hører kun i `EmbedBody`.
- **Kald ikke `requestFullscreen()` på kortet eller `document.documentElement`.** Kravet er, at iframe-elementet selv går i fuldskærm; det kræver `allow="fullscreen"` på iframen.
- **Brug ikke `vw`/`vh`, rå hex eller paletteklasser** (`bg-white`, `gray-`): kun token-utilities (`bg-paper-lit`, `text-ink`), px på 1920×1080-scenen.
- **Window-lytteren i `QuestionScreen` kalder `preventDefault` på alle taster**, og tastaturet ender inde i iframen, når man klikker i den. Rør ikke `QuestionScreen.tsx` (uden for Owns); håndtér kun fokus med `window.focus()` ved fuldskærmsudgang. At "Vis svaret" kræver et klik, hvis fokus ligger i iframen, er kendt og accepteret.
- **Glem ikke at slette `src/quizzes/embedtest/`** før sidste commit: en ekstra pakkemappe udgives med det samme til GitHub Pages. Tjek med `git status` og `ls src/quizzes` (kun `gg26`, `jul-2025`, `index.ts`).
- Kommentarer skal tilføje værdi: kun et ikke-oplagt hvorfor, og højst én linje på dansk. Her fortjener kun `window.focus()` ved fuldskærmsudgang en kommentar (fokus kan blive i iframen og sluge tastetryk); alt andet kræver ingen.

## Verification

Ingen enhedstest (ingen testopsætning, og logikken er triviel). `npm run check` skal passere. Derefter i browseren på testpakken (Playwright mod `npm run dev`):

1. Åbn låge 1: iframen vises med teksten over og knappen "Fuldskærm" nedenunder, uden at noget løber ud af kortet.
2. Klik "Fuldskærm": `document.fullscreenElement` er iframe-elementet. Headless chromium kan kræve en brugerhandling; brug `page.click`. Afslut med `document.exitFullscreen()` (eller Escape): `fullscreenElement === null`, og derefter virker Enter (viser svaret).
3. Klik "Vis svaret": iframen er afmonteret (`document.querySelector('iframe')` er `null`) og svarteksten "Svar" vises; derefter kan lågen gives til Hold 1 med musen (pillen med holdnavnet), og lågen lukker med point.
4. Hvis sandkassen ikke kan nå `https://example.com`, ruteret `page.route('https://example.com/**', …)` med et lille HTML-svar; fuldskærm og afmontering kan stadig bevises.
5. Slet `src/quizzes/embedtest/`, stop devserveren, kør `npm run check` igen, og commit på den eksisterende gren (dansk besked, aldrig `main`, ingen push).

## Autonomous decisions

- Svarsiden: genbrug `SlideView` direkte og forudindlæs kun svarets medier. Afvist: ingen preload overhovedet (svarvideo ville ellers ikke være cachet).
- Iframe-mål: faste px (1100×560, 460 høj med tekst), finjusteres i browseren. Afvist: `cqmin`/procent af kortet.
- Fuldskærmsknap uden `keyHint`, tekst "Fuldskærm". Afvist: egen tastaturgenvej (Enter/mellemrum er optaget af "Vis svaret").
- Fokus efter fuldskærmsudgang: `window.focus()` i `Embed.tsx`. Afvist: ændring af `QuestionScreen`s tastelytter (uden for Owns).
- Testdør som midlertidig pakke `embedtest`. Afvist: midlertidig låge i `gg26` (ville blande sig med den rigtige pakke og dens `shuffle`).
- Valgfri `text` over iframen med eget størrelsestrin. Afvist: genbrug af `textSize` (for stor til at dele plads med iframen).
