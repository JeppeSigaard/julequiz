# Redesign: integrationsrettelse

> Status: in progress — redesign-integration-fix

## Goal

Efter at alle redesign-opgaver er merget, fandt integrationstjekket to fejl. (1) På en bred gittercelle (fx en pakke med 3 låger, 2+1 kolonner) svulmer den åbne långes venstre blad (`w-[40%]`, `rotateY(-62deg)`, perspektiv 500) op til et stort gråt trapez, der dækker headeren og nabocellerne. Bladet skal blive inden for sin egen lågecelle for alle lågeantal (lille overhæng som ved 24 låger er ok). (2) Et overskydende `console.log(bgsound)` i `pickQuestion`.

Basegren: `claude/sweet-mendel-p0gtn1` (ikke `main`). PR'en målrettes den.

## Out of scope

Alt andet: FoxChickenGrain-pillen, WordPuzzle-tasten, dekorationsgrænser, preload-advarslen, andre filer end Owns. Ingen nye afhængigheder, ingen abstraktioner, ingen testframework, ingen committede screenshot-scripts. Spørgsmål, tastatur, point og `src/quizState.ts` røres ikke.

## Owns (hård grænse)

- `src/components/QuestionCard.tsx`
- `src/pages/index.tsx` (kun `console.log`-linjen)

Må ikke redigere `styles.css`, `decor.tsx`, `CLAUDE.md`, `pages.gen.ts`.

## Decisions made / settled inputs

- Svingeanimationen (`motion`, `rotateY` 0 til -62, 0.7 s easeOut) beholdes. Rosette og label bliver til højre for bladet og males over det (bladet er før indholdet i DOM).
- Tokens kun (`bg-paper-edge` osv.), ingen rå hex, intet `vw`/`vh`, intet der antager 24 låger. Typer/mål følger lågens størrelse via container-enheder (`[container-type:size]` på wrapperen, allerede på plads).
- Kommentarer på dansk, kun for ikke-oplagt hvorfor.

## Architecture facts (verified)

- `src/components/QuestionCard.tsx`, åben-gren (nederst): `motion.div` med `className="absolute inset-y-0 left-0 w-[40%] origin-left rounded-l-[19px] bg-paper-edge shadow-[6px_0_14px_rgb(0_0_0/0.45)]"` og `style={{ transformPerspective: 500 }}`. Indholdsdiv efter den: `absolute inset-y-0 left-[40%] right-0 flex ...`.
- Årsag: bladets bredde er 40 % af cellen, mens perspektivet er fast 500px. Ved bred celle (fx ~900px) er bladets frie kant ~360px bred, rotation bringer den ca. 320px mod beskueren, og skaleringen 500/(500-z) bliver stor. Ved 24 låger (~273×143) er bladet ~109px og effekten lille.
- Wrapperen er `relative h-full w-full [container-type:size]`; `cqmin` er min(bredde, højde) af cellen. Ved 24 låger er 40 % af bredden = ca. 76 % af højden.
- `src/pages/index.tsx:75`: `console.log(bgsound);` inde i `if (question.setVolume && bgsound) { ... }`. `bgsound.volume(...)` på næste linje skal blive.
- Gitter: `gridColumns(count)` i `index.tsx:36`, celler `minmax(0, 1fr)`.

## Implementation steps

1. `index.tsx`: slet linjen `console.log(bgsound);` (og intet andet; if-blokken beholdes med `bgsound.volume(question.setVolume);`).
2. `QuestionCard.tsx`: gør bladets bredde og perspektiv proportionale med lågens mindste side i stedet for cellens bredde:
   - Flyt perspektivet fra bladets `style={{ transformPerspective: 500 }}` til et perspektiv på forælderen, så det kan skaleres med container-enheder: sæt `[perspective:350cqmin]` på den omsluttende `absolute inset-0`-div (den med `aria-label`). (350cqmin svarer til ca. 500px ved 24 låger, hvor cellen er ~143px høj.) Fjern `transformPerspective` fra `style`. Hvis perspektivet på forælderen ikke virker med `motion`-elementet (bladet er et direkte barn, så det bør), brug i stedet `transformPerspective` med inline `style` og en `calc`-streng kun hvis det ikke kan undgås; prøv forælder-varianten først.
   - Bladbredde: erstat `w-[40%]` med `w-[min(40%,76cqmin)]`.
   - Indholdsdiv: erstat `left-[40%]` med `left-[min(40%,76cqmin)]`, så indholdet stadig starter lige til højre for bladet.
   - Ved 24 låger giver det identisk resultat som før (40 % = ca. 76cqmin); ved bredere celler bliver bladet højst 76 % af højden bred, og perspektivskaleringen bliver den samme som ved 24 låger.
   - Hvis screenshots stadig viser bladet ude over cellen, sænk i denne rækkefølge: bladbredden til `min(40%,60cqmin)` (og `left` tilsvarende), derefter rotationen. Ændr ikke andet.
   - Tilføj én dansk enlinjes kommentar ved bladet: bredde og perspektiv følger lågens mindste side, så bladet ikke svulmer op i brede celler.

## Traps

- **Byg ikke klasser dynamisk** (`w-[${x}cqmin]`). Tailwind 4 scanner kildetekst; brug hele strenge.
- **Brug ikke `overflow-hidden` på den omsluttende div for at klippe bladet.** Det fjerner det lille tilladte overhæng og skygge, og klipper den indre skygge/ring. Løs årsagen (bredde og perspektiv).
- **Rør ikke `styles.css`, `decor.tsx` eller `[container-type:size]`-wrapperen.** Typen bruger `cqmin` og kræver en definit størrelse.
- **Fjern ikke `rotate(${tilt}deg)` på wrapperen** og lad ikke perspektivet flytte sig til wrapperen: så ændres stacking/3D-kontekst for lukkede låger.
- **Slet ikke `bgsound.volume(...)`** sammen med `console.log`.
- Kommentarer: kun den ene nævnte; resten behøver ingen.

## Verification

1. `npm run check` skal passere (kør i worktree'et).
2. Playwright (script uden for repoet, f.eks. i scratchpad; fortrukket Chromium; viewport 1920×1080) mod `npm run dev` på `http://localhost:3000/julequiz/`. Sæt halvt spillet bræt ved at seede `localStorage` (nøgle og form i `src/quizState.ts`) eller ved at spille låger (`1`/`2`/`q` på åben låge) og tag screenshots:
   - midlertidig pakke med 3 låger (lav en pakke i den mappe, hvor eksisterende pakker ligger, og vælg den som i quiz-packs; mappe/form findes ved at se hvordan `index.tsx` indlæser pakker),
   - midlertidig pakke med 9 låger,
   - den rigtige 24-låge-pakke.
   Åbn mindst 2-3 låger i hver (en til hvert hold og en til ingen). Tjek visuelt: hvert åbent blad ligger inden for sin celle (lille overhæng ok), headeren og naboceller er ikke dækket, rosette og label er til højre for bladet og ovenpå.
3. Slet de midlertidige pakker (og `git status` skal kun vise de to ejede filer plus specfilen) og luk devserveren.
4. Ingen commit i denne fase; ingen nye filer i repoet.

## Autonomous decisions

- Perspektiv flyttes til forælderen med `cqmin`-enhed → afvist: fast px-perspektiv med `clamp`, som ikke kan følge cellens størrelse.
- Bladbredde `min(40%,76cqmin)` → afvist: fast px-bredde (antager et lågeantal) eller `overflow-hidden` (fjerner tilladt overhæng).
- Faldback er at snævre bladbredden ind frem for at ændre rotationen → afvist: at fjerne svingeanimationen.
- Midlertidige pakker oprettes af executoren ved at kopiere en eksisterende pakkes form → afvist: at committe et pakkeværktøj.
