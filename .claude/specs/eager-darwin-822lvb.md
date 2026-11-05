# Lågerne vugger synligt, ikke kun i devtools

> Status: in progress — claude/eager-darwin-822lvb

## Goal

Lågerne på brættet skal vugge i pærernes 2,4 s-takt, mens musikken spiller (`sway={started}`).
I Chrome vugger kun wrapper-div'ens computed `rotate` (devtools-overlayet bevæger sig), mens de
malede låger står stille. Årsag, målt i Chromium under planlægningen: `rotate` i `@keyframes sway`
animeres på compositoren, som fastfryser `var(--sway)` til `0deg`, da animationen startede ved
mount. Når `--sway` senere glider op til ~2,5°, følger compositoren ikke med. Rettelsen flytter
animationen over på et registreret tal, så `rotate` beregnes på main thread hver frame.

## Out of scope

- Udsvingets størrelse (`swayAmount`-formlen), takten (2,4 s), `SWAY_PHASES`, `animationDelay`,
  `origin-top`, den faste `tilt` og hvornår der vugges (`sway &&`, `status !== "skip"`,
  `sway={started}` i `src/pages/index.tsx`).
- `@property --sway` og `transition-[--sway] duration-1000` — de bevares uændret, så udsvinget
  stadig glider ind og ud.
- `animate-twinkle`, `animate-glow`, `Garland` og alle andre komponenter.

## Decisions made

- Mekanisme → `@keyframes sway` animerer et nyt registreret `<number>`-property `--sway-swing`
  (1 → −1 → 1); wrapperen får `rotate: calc(var(--sway) * var(--sway-swing))` som inline style.
  Animationen genstartes ikke ved toggle (det ville bryde takten med `Garland`).
- CLAUDE.md → ja, en kort faldgrube om `var()` i keyframes for composited properties.

## Architecture facts (verified)

- `src/styles.css:14-19`: `@property --sway { syntax: "<angle>"; inherits: false; initial-value: 0deg; }`
  med kommentar over. `@property` står uden for `@theme`.
- `src/styles.css:60`: `--animate-sway: sway 2.4s ease-in-out infinite;` inde i `@theme inline`.
- `src/styles.css:73-81`: `@keyframes sway` sætter `rotate: var(--sway)` ved 0 %/100 % og
  `rotate: calc(var(--sway) * -1)` ved 50 %.
- `src/components/QuestionCard.tsx:71-79`: `swayAmount`, `wrapper`-klassen (`animate-sway
  transition-[--sway] duration-1000 …`) og `style`-objektet med `transform: rotate(tilt)`,
  `"--sway"` og `animationDelay`, castet `as CSSProperties`. `wrapper`/`style` bruges af alle tre
  grene (closed, skip, opened).
- `animate-sway` bruges kun i `QuestionCard.tsx`.
- CSS-egenskaben `rotate` og `transform` komponeres (individuel `rotate` anvendes før
  `transform`), præcis som da keyframes satte `rotate` — det visuelle resultat er det samme.
- Rettelsen er afprøvet ved at injicere CSS i Chromium: `--sway-swing` svinger, computed `rotate`
  følger med, og skærmbilleder viser lågen tippet begge veje. Uden rettelsen er skærmbilleder ved
  `rotate` 0,82° og 2,45° pixel-identiske.

## Implementation steps

1. `src/styles.css`: tilføj lige under `@property --sway`-blokken (efter linje 19) en ny blok
   ```css
   @property --sway-swing {
     syntax: "<number>";
     inherits: false;
     initial-value: 0;
   }
   ```
   med en dansk kommentar over, der siger hvorfor: keyframes animerer dette tal i stedet for
   `rotate`, fordi Chrome kører en `rotate`-animation på compositoren med `var(--sway)` fastfrosset
   fra animationens start, så lågerne ikke ville følge med, når `--sway` skrues op.
2. `src/styles.css:73-81`: lav `@keyframes sway` om, så 0 %/100 % sætter `--sway-swing: 1;` og
   50 % sætter `--sway-swing: -1;`. Behold navnet `sway` og `--animate-sway` uændret.
3. `src/components/QuestionCard.tsx`: tilføj `rotate: "calc(var(--sway) * var(--sway-swing))"` i
   `style`-objektet (linje 75-79), lige efter `"--sway"`. Intet andet i filen ændres.
4. `CLAUDE.md`: i bulletten om animationer (linje 100-104) tilføj efter `animate-sway`-parentesen
   en kort sætning, fx: "`sway` animerer det registrerede tal `--sway-swing`, og wrapperen ganger
   det på `--sway`: brug aldrig `var()` i keyframes for `rotate`/`transform`/`opacity`, for Chrome
   kører dem på compositoren med variablens værdi fra animationens start." Hold linjerne under
   ~100 tegn som resten af filen, og ombryd pænt.

## Traps

- **Sæt ikke `rotate` (eller `transform`) i keyframes igen, heller ikke med `calc()`.** Enhver
  keyframe-værdi for en composited egenskab, der bruger `var()`, fastfryses af Chrome ved start;
  det er præcis fejlen. Kun `--sway-swing` må animeres.
- **Registrér `--sway-swing` med `@property`.** Et uregistreret custom property interpoleres ikke
  (det skifter diskret ved 50 %), så lågerne ville hoppe mellem yderpunkterne i stedet for at
  glide.
- **Genstart ikke animationen ved toggle** (fx `key` eller at sætte `animate-sway` betinget). Den
  skal køre fra mount for at holde takt med `Garland`; `--sway` styrer kun udsvinget.
- **Flyt ikke den faste `tilt` ind i `rotate`.** `transform: rotate(tilt)` bliver, så tilt og
  vug stadig komponeres som før.
- **Fjern ikke `transition-[--sway] duration-1000`** — den lader udsvinget glide ind og ud, og
  den virker nu også på de malede låger, fordi `rotate` genberegnes hver frame.
- Kommentarer: kun den ene over `@property --sway-swing` (hvorfor). Den eksisterende kommentar
  over `swayAmount` i `QuestionCard.tsx` gælder stadig; tilføj ingen andre.

## Verification

Ingen nye tests (projektet har ingen, og ændringen er CSS). Kør `npm run check`.

Visuel kontrol i Chromium (påkrævet, fordi fejlen kun ses i malede pixels):

1. `npm run dev`, åbn `http://localhost:3000/julequiz/` med Playwright i 1920×1080, klik på titlen
   (starter musik og vug), vent ~2,5 s, og injicér `canvas{display:none!important}`, så sneen
   ikke forstyrrer.
2. Tag 4 skærmbilleder af låge 1 (clip ca. `x:40, y:300, w:360, h:220`) med 600 ms mellemrum, og
   log wrapperens computed `rotate` og `--sway-swing` ved hvert. Forvent: `--sway-swing` svinger
   mellem −1 og 1, `rotate` mellem ca. −2,5° og 2,5°, og billederne viser lågen tydeligt tippet
   til hver side (se på dem). Et eksempelscript ligger i
   `/tmp/claude-0/-home-user-julequiz/dd329936-1493-5a0b-8f4a-b12fb4bba485/scratchpad/pw/sway.js`
   (det injicerer ingen rettelse; brug det som det er mod den rettede kode).
3. Klik på titlen igen (stop): udsvinget glider ned til 0 over ~1 s, og lågerne står stille.
4. En låge med `skip`-status vugger ikke; en åbnet låge vugger med.
5. Stop devserveren bagefter.
