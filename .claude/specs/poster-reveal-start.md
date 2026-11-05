# Plakatlåge: start-knap afslører udsnittet, svaret viser hele plakaten

> Status: in progress — claude/amazing-hawking-2atzd0

## Goal

Lågetypen `posterReveal` ("Gæt en julefilm", døre 18, 22, 24 i `jul-2025`) deles i dag forkert:
spørgsmålssiden viser kun prompten, "Vis svaret" viser udsnittet, og et klik på udsnittet viser hele
plakaten. Fremover viser spørgsmålssiden prompten og en start-knap; knappen erstatter prompten med
udsnittet, så holdene kan gætte. "Vis svaret" (Enter/mellemrum) viser hele plakaten direkte.

## Out of scope

- Ingen ændring af `QuestionScreen.tsx`, `decor.tsx`, `MusicBox.tsx`, `types.ts` eller pakkens
  spørgsmålsfiler (`src/quizzes/jul-2025/questions/*-plakat-*.tsx`). `QuestionSpec` er uændret.
- Ingen ny tastaturgenvej til start-knappen.
- Ingen bevarelse af afsløret tilstand, når Escape går fra svaret tilbage til spørgsmålet.
- Ingen nye animationer (CLAUDE.md: bevægelse ud over de eksisterende er ikke ønsket).

## Decisions made

- Skal prompten blive stående over udsnittet? → Nej. Efter klik forsvinder prompt og knap, og
  udsnittet vises alene i samme størrelse som i dag (`h-[520px]`, `-rotate-1`, `mediaFrame`).
- Knaptekst → "Start" med Material-ikonet `play_arrow`, som start-knappen i `MusicBox`
  (`PillButton variant="team-1"`).
- Escape fra svaret tilbage til spørgsmålet → start-knappen vises igen (body genmonteres og
  nulstiller sin tilstand; samme opførsel som musikquizzen). Intet ekstra.
- Svaret → kun hele plakaten, ingen prompt, ingen klik-interaktion.

## Architecture facts (verified)

- `src/questionTypes/PosterReveal.tsx` eksporterer i dag kun `PosterAnswer` (`prompt`, `cropped`,
  `full`), som har `useState`-skiftet udsnit → fuld plakat. Begge stier er allerede kørt gennem
  `asset()` inde i komponenten (`asset(full)`, `asset(cropped)`).
- `src/questionTypes/index.tsx:52-63`, `case "posterReveal"`: `body` er et inline `<p>` med
  `spec.prompt` (klasser `max-w-300 text-center font-display text-[110px] font-bold leading-none
  text-ink`), `answer` er `<PosterAnswer … />`, `preload: [spec.cropped, spec.full].map(asset)`.
- `QuestionScreen.tsx` renderer `{hasAnswered ? question.answer : question.body}` inde i
  `<main className="… flex-col items-center justify-center gap-[26px] …">` (ca. 650 px højt). Body
  og answer er altså søskende-alternativer: body afmonteres, når svaret vises, og genmonteres ved
  Escape. Tastaturhandleren kalder `preventDefault` på alle taster, så Enter/mellemrum klikker ikke
  en fokuseret knap.
- `MediaPreload` monterer `question.preload` skjult, så længe lågen er åben (også på
  spørgsmålssiden), så udsnittet ligger i cachen, før der trykkes Start.
- Mønster for knappen: `src/components/MusicBox.tsx:63-73` —
  `<PillButton variant="team-1" onClick={…}><span className="material-symbols-outlined
  text-[44px]">play_arrow</span>Start</PillButton>`. `PillButton` importeres fra
  `../components/decor`.
- Mønster for en body-komponent med `useState` i `src/questionTypes/`: `VideoBody` i `Video.tsx`
  (ingen `"use client"`-direktiv i filerne under `questionTypes/`; de importeres kun af klientkode).

## Implementation steps

1. I `src/questionTypes/PosterReveal.tsx`, erstat `PosterAnswer` med to komponenter:
   - `PosterBody({ prompt, cropped }: { prompt: string; cropped: string })` med
     `const [revealed, setRevealed] = useState(false)`.
     - Ikke afsløret: returnér et fragment med det `<p>`, der i dag står inline i `index.tsx`
       (præcis samme klasser og `{prompt}`), efterfulgt af
       `<PillButton variant="team-1" onClick={() => setRevealed(true)}>` med
       `<span className="material-symbols-outlined text-[44px]">play_arrow</span>` og teksten
       `Start` — kopieret fra `MusicBox.tsx:63-73`, men uden `disabled`/`className`.
     - Afsløret: `<div className="p-4"><img src={asset(cropped)} alt={prompt}
       className={`h-[520px] w-auto -rotate-1 ${mediaFrame}`} /></div>` — samme `img` som den
       nuværende udsnitsgren, men i en `div` i stedet for en `button`.
   - `PosterAnswer({ prompt, full }: { prompt: string; full: string })` uden state: returnér den
     nuværende fuld-plakat-gren uændret: `<div className="p-4"><img src={asset(full)} alt={prompt}
     className={`max-h-[520px] w-auto ${mediaFrame}`} /></div>`.
   - Importér `PillButton` fra `"../components/decor"`. `useState` bruges nu kun i `PosterBody`.
2. I `src/questionTypes/index.tsx`, `case "posterReveal"`:
   - `body: <PosterBody prompt={spec.prompt} cropped={spec.cropped} />`
   - `answer: <PosterAnswer prompt={spec.prompt} full={spec.full} />`
   - `preload` forbliver `[spec.cropped, spec.full].map(asset)`.
   - Opdatér importen fra `"./PosterReveal"` til `{ PosterAnswer, PosterBody }`.
3. Kør `npm run check`.
4. Commit på den aktuelle gren med en dansk besked i bydeform, fx
   "Plakatlågen: start-knap viser udsnittet, svaret viser hele plakaten".

## Traps

- **Kald ikke `asset()` i `index.tsx` på `cropped`/`full` til komponenterne.** `PosterBody` og
  `PosterAnswer` kalder selv `asset()` (som i dag); et ekstra kald giver `/julequiz/julequiz/…`,
  der 404'er på GitHub Pages. Kun `preload` kører `asset()` i `toQuestion`.
- **Fjern ikke `spec.cropped` fra `preload`,** selvom udsnittet nu hører til spørgsmålssiden.
  `MediaPreload` er monteret, mens lågen er åben, og det er det, der gør, at udsnittet står fremme
  med det samme ved klik på Start.
- **Gør ikke udsnittet klikbart eller læg en `button` om det.** Det gamle skift udsnit → plakat
  skal væk; svaret vises kun via "Vis svaret"/Enter i `QuestionScreen`.
- **Behold ikke prompten over udsnittet,** og skru ikke på `h-[520px]`. Prompt (110 px) + udsnit
  (520 px + p-4) er højere end `main` (ca. 650 px) og ville flyde ud over kortets fod.
- **Kald ikke hooks i `toQuestion`.** Den kører ved pakkeindlæsning; `useState` hører i
  `PosterBody`.
- **Rør ikke `QuestionScreen.tsx` for at bevare tilstanden ved Escape.** Det er besluttet, at
  start-knappen vises igen, og footeren/skiftet deles af alle lågetyper.
- **Ingen dynamiske Tailwind-klasser, rå hex eller paletteklasser** (`gray-`, `red-` …). Brug de
  bogstavelige klasser ovenfor.
- Kommentarer skal tilføje værdi: denne ændring kræver ingen. Skriv ikke kommentarer, der forklarer,
  hvad koden gør.

## Verification

Ingen tests (projektet har ingen). `npm run check` skal passere. Åbn derefter en plakatlåge i
browseren (`npm run dev`, http://localhost:3000/julequiz/, fx med Playwright; nulstil `localStorage`
mellem scenarier, så gemt tilstand ikke lækker):

- Lågen åbner med "Gæt en julefilm" og en rød "Start"-knap med play-ikon; intet billede.
- Klik på Start: prompt og knap forsvinder, udsnittet står let skråt i ramme og holder sig inden for
  kortet (ikke over footerens "Vis svaret").
- "Vis svaret" (klik eller Enter) — både før og efter Start — viser hele plakaten; klik på plakaten
  gør intet; holdknapperne står i footeren som før.
- Escape fra svaret: tilbage til prompten med Start-knappen.
- Tjek alle tre plakatlåger (18, 22, 24), da billederne har forskellige formater.
