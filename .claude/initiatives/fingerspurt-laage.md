# Fingerspurt-lågen: tilskuervært, /host og en embed-låge i julequizzen

> Status: derived from git, not tracked here — see Status below.
>
> Tværgående initiativ over to repoer. Filen ligger ens i `tap-racer/.claude/initiatives/` og
> `julequiz/.claude/initiatives/`; ret begge, hvis den ændres. Hver opgave har en **Repo**-linje og
> køres med `/branch` i det repo.

## Goal

En låge i gg26-julequizzen åbner et Fingerspurt-løb på storskærmen. Lågen viser en side fra
fingerspurt.app i en iframe. Siden opretter selv et nyt rum, hvor storskærmen er vært, men løber ikke
med: den viser en kæmpe QR-kode, folk i lokalet scanner den med telefonen og joiner, quizmasteren
starter løbet, og storskærmen viser heatet live som tilskuer, derefter replayet og en resultatliste.
Quizmasteren aflæser vinderen og giver lågen til et hold med 1/2 som altid.

Undervejs får Fingerspurt to generelle funktioner: en **tilskuervært** (en vært, der har alle
værtsknapperne, men ser løbet i stedet for at løbe; kan også vælges i en almindelig lobby) og det
**magiske link** `https://fingerspurt.app/host`, der kan bruges til enhver storskærm, fx på en
konference. Julequizzen får en genbrugelig spørgsmålstype `embed`.

## Out of scope

- Al dataudveksling mellem Fingerspurt og julequizzen: ingen `postMessage`, ingen automatisk vinder,
  ingen holdtilknytning af løbere. Vinderen afgøres manuelt.
- Et nyt e2e-scenarie. Der rettes kun i `.claude/e2e/forventet-adfaerd.md`.
- Resultatkort for almindelige tilskuere (de har fortsat kun replayet). Kun tilskuerværten får det.
- Fuldskærm i Fingerspurt. Julequizzen ejer fuldskærmen.
- Smid ud/kick, værtsoverdragelse til en anden spiller eller tilskuer, flere tilskuerværter i ét rum.
- `/host`-parametre ud over `distance`, `bots`, `verden` og `haekke` (fx `banned`, `public`, `nearby`).
- En `/en/host`-variant; sproget følger den almindelige detektion.
- Ændringer af QR-indholdet: det er stadig `inviteUrl(code)`, og gæster joiner via `/invite/KODE`.
- Tilskuervært i trial, i bot-simen eller i klip-simen.

## Architecture decisions

- Hvor bor tilskuerværten på serveren? → **I `room.spectators`, og `room.hostId` må pege på en
  tilskuer.** Alt løbsrelateret (start, baner, replay, film, kollision, bots, placering) filtrerer
  allerede tilskuere fra og forbliver urørt. Afvist: værten som medlem med et "sidder over"-flag; hver
  løkke over `room.members` ville skulle filtrere hende fra, og én glemt løkke er en fejl.
- Hvordan kendes en tilskuervært? → **`RoomSettings.hostSpectates?: boolean`**, læst som `?? false`
  overalt (som `nearby`). Det er den eneste kilde: er den sand, står værten i `room.spectators` og ikke i
  `room.members`. Klienten afleder "jeg er tilskuervært" af `settings.hostSpectates && hostId === myId`.
  `sanitizeRoom()` i `net.ts` skal tage feltet med.
- Hvordan bliver man tilskuervært? → På to måder: `{type:'create', …, hostSpectates: true}` opretter
  rummet med værten direkte i `spectators` (rummet har da nul medlemmer og må ikke lukke af den grund),
  og en almindelig vært skifter med `hostSpectates` i den almindelige `settings`-besked
  (løbsindstillingerne). Skiftet flytter værten mellem `members` og `spectators`.
- Hvornår må man skifte? → **Kun uden et heat i gang**: intet medlem har `inRace`. Serveren ignorerer
  stille et skift ellers (resten af `settings` gælder stadig). Ingen løber forsvinder midt i et heat.
- Rummets levetid → Rummet lukker, når det hverken har medlemmer eller en tilstedeværende
  tilskuervært. **Forsvinder tilskuerværten for alvor** (`leave`, `unspectate`, eller udløbet
  nådeperiode), **lukker rummet for alle**: medlemmerne får den nye `{type:'roomClosed'}` og lander i en
  frisk, egen lobby med en snack, tilskuerne får det eksisterende `spectating ok:false, race_over`, og
  `roomClosingHandler` kaldes som i dag. Det gælder også et almindeligt rum, hvor værten har skiftet
  til at se på. Afvist: at lade værten gå videre til en spiller. Storskærmen er rummets anker.
- Genopkobling → Tilskuerværten får **samme nådeperiode (`GRACE_MS`) og `rejoin`-token som et medlem**:
  `afbrudt` under perioden, holdt tilskuerplads og værtsrolle, `rejoin ok:true` sætter hende tilbage
  som tilskuervært. Almindelige tilskuere ryddes stadig straks ved socket-luk. Den eksisterende
  genvinding med `create` + kode (samme `clientId`, afbrudt vært) virker også for tilskuerværten, så
  en genindlæsning inden for nådeperioden genvinder rummet.
- Tilskuernes allow-liste → Tilskuerværten må desuden sende `settings`, `start`, `abort`,
  `publicList` og `leave`. Almindelige tilskuere er uændrede.
- Startkrav → Med `hostSpectates` kræver `canStart()` og rematch-starten **mindst ét menneskeligt,
  ikke-afbrudt medlem** (bots tæller ikke som minimum, men må gerne være med), og alle ikke-afbrudte
  medlemmer skal have meldt klar. Uden `hostSpectates` er reglen uændret.
- Protokol → `PROTOCOL_VERSION` bumpes én gang (i opgaven `server`), fordi `roomClosed` er en ny
  `ServerMessage`, som en cachet gammel klient ellers ville ignorere og blive hængende i et dødt rum.
- Tilskuerværtens skærme (klient) → Lobbyen (`'lobby'`) med værtsknapperne og uden egen løber →
  ved `'start'` live-tilskuervisningen (`'spectate'`, Følg forreste) med en værts-only "Afbryd" →
  efter heatet det delte replay **med resultatkortet** (placeringer og tider, som løberne ser efter mål)
  og en knap tilbage til lobbyen. Næste heat startes fra lobbyen. Gæster ser i lobbyen, at værten ser
  på, i stedet for en række for værten.
- Det magiske link → **`/host`**, serveret som `index.html` ligesom `/invite/:code`. Hver frisk
  åbning opretter et nyt rum med åbneren som tilskuervært. Valgfrie parametre `distance`
  (100/200/400), `bots` (0-15), `verden` (et verdensnavn) og `haekke` (4/6/8/10) bliver rummets
  startindstillinger: `distance` går med i `create`, resten i én almindelig `settings`-besked bagefter,
  så serverens eksisterende validering (fx `verdenIPuljen()`) gælder. Ugyldige værdier ignoreres stille.
- Opstart på `/host` → Splashens "tryk start" bliver stående (den låser lyden op). Musadvarslen og
  bevægelsesdialogen springes over, som på `/spectate`. Et husket rum genoptages ikke.
- Storskærmslayout → **En dokumenteret undtagelse fra telefonboksen**, kun i en session startet via
  `/host`: et liggende layout med en kæmpe QR-kode, rumkoden og linket ved siden af spillerlisten og
  værtsknapperne, i designsproget fra `design.md`. En vært, der skifter til at se på i en almindelig
  lobby, beholder telefonboksens lobby.
- Julequizzens låge → **Ny spørgsmålstype `embed`** i `QuestionSpec` og `toQuestion` med egen renderer:
  en iframe (`allow="fullscreen; autoplay"`) til en URL og en fuldskærmsknap, der gør selve
  iframe-elementet fuldskærm fra julequizzen. Svarsiden følger `standard`s svarform. Når svaret
  vises, afmonteres iframen, og Fingerspurt-rummet lukker (efter nådeperioden).
- Fuldskærm → Julequizzen ejer den. Fingerspurt får ingen fuldskærmsknap.
- Testindsats → Intet nyt e2e-scenarie. Hver Fingerspurt-opgave retter
  `.claude/e2e/forventet-adfaerd.md` og verificeres i browseren via preview-værktøjet med en værtsfane
  og mindst én spillerfane.

## Constraints inherited by every task

- **Fingerspurt** (`tap-racer`): `npm run check` skal passere. Serveren er stadig ikke autoritativ
  over fysikken; tilskuerværten udvider ingen af de syv undtagelser. Ny besked eller nyt felt står i
  `src/shared/protocol.ts` og implementeres i begge ender i samme opgave; alt indkommende clampes.
  Serveren sender koder, aldrig UI-tekst. UI-tekst går gennem `i18n/` på dansk og engelsk, uden
  tankestreger. Chrome er Preact i `src/client/ui/`, synlighed kun i `syncChrome()`, skærmskift kun via
  `showScreen()`, ark kun via `openSheet()`. Ingen hex inline. Kommentarer på dansk, højst én linje.
- Tilskuerværten er en tilskuer: hun må aldrig optræde i `room.members`, i `Room.players`, i baner,
  replay, film, placering eller leaderboard. Invarianten "tilskuere tæller ikke" i `server.md` gælder
  fortsat for alle andre tilskuere.
- `RoomSettings.hostSpectates` læses altid som `?? false`. `roomClosed` og `hostSpectates` staves
  præcis sådan i alle opgaver.
- Hold `.claude/rules/` ved lige i samme opgave: opgaven `server` opretter
  `.claude/rules/tilskuervaert.md` (med `paths:`) og indekslinjen i `CLAUDE.md`; senere opgaver
  udvider den fil. Opgaven `host-link` opretter sin egen `.claude/rules/host-link.md` og indekslinje.
- **Julequiz**: `npm run check` skal passere, og lågen afprøves i browseren. Kun token-utilities, ingen
  rå hex eller paletteklasser; layout i px på 1920×1080-scenen. `switch` i `toQuestion` får ingen
  default. Dansk tekst, kommentarer og commits.
- Commit aldrig på `main`. Hvert push til `main` udrulles (fingerspurt.app via Render,
  julequizzen via GitHub Pages), så en opgave må ikke efterlade noget brugervendt halvfærdigt.

## Pinned contracts

```ts
// src/shared/protocol.ts (tap-racer)
| { type: 'create'; code: string; distance?: RaceDistance; hostSpectates?: boolean } // ClientMessage
| { type: 'roomClosed' }                                                            // ServerMessage
interface RoomSettings { /* … */ hostSpectates?: boolean }                          // ?? false
```

```text
https://fingerspurt.app/host[?distance=100|200|400][&bots=0..15][&verden=<navn>][&haekke=4|6|8|10]
```

```ts
// src/types.ts (julequiz), QuestionSpec-medlem; svarsiden har standard's svarform
| { type: "embed"; question: { url: string; text?: string }; answer: /* som standard */; backgroundVolume?: number }
```

## Task graph

### server

- **Repo**: tap-racer
- **Branch**: `fingerspurt-laage-server`
- **Depends on**: nothing
- **Goal**: Serveren og protokollen kan bære et rum med en tilskuervært.
- **Scope**: Det pinnede protokol-skelet og `PROTOCOL_VERSION`-bump. `create` med `hostSpectates`;
  skiftet via `settings` (kun uden heat i gang); rummets levetid uden medlemmer; luk for alle med
  `roomClosed` og `race_over`, når tilskuerværten forsvinder; nådeperiode, `rejoin` og
  `create`-genvinding for tilskuerværten; allow-listen; startkravet i `canStart()` og rematch.
  Klientens minimum: `sanitizeRoom()` tager `hostSpectates` med, og `roomClosed` sender til en frisk
  lobby med en snack (dansk og engelsk). Regelfilen `tilskuervaert.md`, indekslinjen i `CLAUDE.md`,
  opdatering af `server.md`, `genopkobling.md` og `forventet-adfaerd.md`. Ingen UI sender endnu
  `hostSpectates`: serverdelen er bevidst inert, til `klient` lander.
- **Out of scope**: Toggle i løbsindstillingerne, lobby, tilskuervisning og resultatkort (`klient`);
  `/host`-ruten og storskærmen (`host-link`).
- **Owns**: `src/shared/protocol.ts`, `src/shared/constants.ts`, `src/server/handlers.ts`,
  `src/server/rooms.ts`, `src/server/main.ts`, `src/client/net.ts`, `src/client/i18n/strings/net.ts`,
  `.claude/rules/tilskuervaert.md` (ny), `.claude/rules/server.md`, `.claude/rules/genopkobling.md`,
  `.claude/e2e/forventet-adfaerd.md`, `CLAUDE.md`.
- **Done when**: `npm run check` passerer; et manuelt skrevet `create` med `hostSpectates: true`
  (fx fra browserkonsollen) giver et rum med værten i `spectators`, gæster kan joine og melde klar,
  værten kan starte med én gæst, og en lukket værtsfane lukker rummet for gæsten efter nådeperioden;
  almindelige rum opfører sig som før.

### klient

- **Repo**: tap-racer
- **Branch**: `fingerspurt-laage-klient`
- **Depends on**: server
- **Goal**: En almindelig vært kan vælge at se på, og tilskuerværtens hele forløb virker i klienten.
- **Scope**: "Se på som vært" i løbsindstillingerne (kun vært, kun uden heat i gang). Tilskuerværtens
  lobby uden egen løber og med startknappen efter det nye startkrav; gæsternes lobby viser, at værten
  ser på. Ved `'start'` live-tilskuervisningen med en værts-only "Afbryd"; efter heatet replayet med
  resultatkortet og en knap tilbage til lobbyen. i18n på dansk og engelsk. `tilskuervaert.md`,
  `tilskuer.md`, `loebsindstillinger.md` og `forventet-adfaerd.md` opdateres.
- **Out of scope**: Protokol og server (`server`, allerede landet, rør dem ikke); `/host`, parametre,
  opstartsdialoger og storskærmslayout (`host-link`).
- **Owns**: `src/client/lobby.ts`, `src/client/ui/lobby/**`, `src/client/chrome/raceSettings.ts`,
  `src/client/ui/raceSettings/**`, `src/client/chrome/overlay.ts`, `src/client/ui/overlay/**`,
  `src/client/spectate/**`, `src/client/ui/spectate/**`, `src/client/chrome/spectate.ts`,
  `src/client/ui.ts`, `src/client/run.ts`, `src/client/net.ts`, `src/client/state.ts`,
  `src/client/i18n/strings/**`, `.claude/rules/tilskuervaert.md`, `.claude/rules/tilskuer.md`,
  `.claude/rules/loebsindstillinger.md`, `.claude/rules/ui.md`, `.claude/e2e/forventet-adfaerd.md`.
- **Done when**: I preview-værktøjet skifter en vært til at se på i lobbyen, en spillerfane joiner og
  melder klar, værten starter, ser heatet live, kan afbryde, ser replay og resultatkort efter målgang
  og kommer tilbage til lobbyen og kan starte igen; skiftet tilbage til at løbe virker; `npm run check`
  passerer.

### host-link

- **Repo**: tap-racer
- **Branch**: `fingerspurt-laage-host-link`
- **Depends on**: klient
- **Goal**: `https://fingerspurt.app/host` åbner en storskærm, der er tilskuervært for et nyt rum.
- **Scope**: Ruten `/host` i serveren; bootgrenen i `main.ts` (splash bevares, musadvarsel og
  bevægelsesdialog springes over, intet husket rum genoptages); `create` med `hostSpectates` og
  parametrene efter den pinnede URL; genindlæsning inden for nådeperioden genvinder rummet;
  storskærmslayoutet med kæmpe QR-kode (genbrug `uqr` og `inviteUrl()`), rumkode, link, spillerliste
  og værtsknapper, kun i en `/host`-session. Ny regelfil `host-link.md` med indekslinje i `CLAUDE.md`,
  undtagelsen fra telefonboksen dokumenteret i `design.md`/`ui.md`, `forventet-adfaerd.md` opdateret.
  Siden skal virke i en cross-site iframe (ingen header, der forbyder indlejring).
- **Out of scope**: Ændringer i tilskuerværtens spilforløb (`klient`); serverens rumlogik (`server`);
  alt i julequizzen.
- **Owns**: `src/server/main.ts`, `src/client/main.ts`, `src/client/consent.ts`, `src/client/mouse.ts`,
  `src/client/lobby.ts`, `src/client/ui/lobby/**`, en ny region `src/client/ui/storskaerm/**` hvis den
  vælges, `src/client/ui/App.tsx`, `src/client/i18n/strings/**`, `.claude/rules/host-link.md` (ny),
  `.claude/rules/design.md`, `.claude/rules/ui.md`, `.claude/rules/naerhed.md`,
  `.claude/e2e/forventet-adfaerd.md`, `CLAUDE.md`.
- **Done when**: `/host?distance=100&bots=2` i preview-værktøjet viser storskærmen med en scanbar
  QR-kode efter "tryk start"; en spillerfane, der åbner QR-linket, står i listen; et heat kan startes,
  ses og afsluttes med resultatkort; siden virker også indlejret i en iframe på en anden origin;
  `npm run check` passerer.

### embed

- **Repo**: julequiz
- **Branch**: `fingerspurt-laage-embed`
- **Depends on**: nothing
- **Goal**: Julequizzen har spørgsmålstypen `embed`: en iframe med fuldskærmsknap.
- **Scope**: `embed` i `QuestionSpec` efter den pinnede form og i `toQuestion`; ny renderer i
  `src/questionTypes/` med iframe (`allow="fullscreen; autoplay"`), fuldskærmsknap, der gør
  iframe-elementet fuldskærm, og `standard`s svarside. Ingen medier at forudindlæse. `CLAUDE.md`s
  typeliste opdateres. Ingen gg26-låge endnu.
- **Out of scope**: Selve gg26-lågen (`gg26-laagen`); alt i Fingerspurt.
- **Owns**: `src/types.ts`, `src/questionTypes/index.tsx`, `src/questionTypes/Embed.tsx` (ny),
  `CLAUDE.md`.
- **Done when**: En midlertidig testlåge (slettes igen før merge) med en vilkårlig indlejrbar
  https-side viser iframen, fuldskærm går ind og ud, svaret vises og lågen kan gives til et hold med
  musen; `npm run check` passerer.

### gg26-laagen

- **Repo**: julequiz
- **Branch**: `fingerspurt-laage-gg26-laagen`
- **Depends on**: embed, host-link (merget og udrullet til fingerspurt.app)
- **Goal**: gg26 får Fingerspurt-lågen.
- **Scope**: Én ny fil i `src/quizzes/gg26/questions/` med en `embed`-spec, der peger på
  `https://fingerspurt.app/host` med de ønskede parametre (standard `distance=100`),
  `backgroundVolume: 0` og en svarside, der beder quizmasteren give lågen til vinderens hold.
- **Out of scope**: Ændringer af `embed`-rendereren (`embed`); alt i Fingerspurt.
- **Owns**: `src/quizzes/gg26/questions/<nn>-fingerspurt.tsx` (ny).
- **Done when**: I gg26 åbner lågen storskærmen fra den udrullede fingerspurt.app, en telefon kan
  joine via QR-koden og løbe, og lågen kan gives til et hold; `npm run check` passerer.

## Waves

- **Wave 1**: server (tap-racer), embed (julequiz)
- **Wave 2**: klient
- **Wave 3**: host-link
- **Wave 4**: gg26-laagen (først når host-link er udrullet til fingerspurt.app)

## Integration check

På den udrullede fingerspurt.app og den udrullede julequiz, med en bærbar på en storskærm og
mindst to telefoner:

1. Åbn gg26, åbn Fingerspurt-lågen, klik "tryk start", skift til fuldskærm. QR-koden er stor og
   scanbar fra lokalet.
2. To telefoner scanner, joiner og melder klar; storskærmen viser dem. Start fra storskærmen.
3. Storskærmen viser heatet live, derefter replay og resultatkort med den rigtige vinder.
4. Tilbage til lobbyen, kør et heat mere; prøv også "Afbryd" midt i et heat.
5. Forlad fuldskærm, vis svaret, giv lågen til et hold med 1/2. Telefonerne får "rummet er lukket"
   efter nådeperioden.
6. Regression: et almindeligt multiplayer-rum (vært løber selv), "Se på" via kode og `/spectate/<kode>`
   virker som før; kør e2e (`/e2e`, efter brugerens ja) når wave 3 er landet.

## Status

Not tracked in this file — derive it, i hvert repo:

- merged: `gh pr list --state merged --search "fingerspurt-laage-"`
- open: `gh pr list --state open --search "fingerspurt-laage-"`
- started but unmerged: `git branch -a --list "*fingerspurt-laage-*"`
