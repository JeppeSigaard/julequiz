# Fingerspurt-lågen i gg26

> Status: in progress — fingerspurt-laage-gg26-laagen (verificeret i browseren)
> Branch: `claude/gg26-julequiz-spectator-gate-t7du9e`

## Goal

gg26 får Fingerspurt-lågen: storskærmen viser det udrullede `fingerspurt.app/host` i en iframe, telefoner joiner via QR-koden og løber, og quizmasteren giver lågen til vinderens hold.

## The file

`src/quizzes/gg26/questions/22-fingerspurt.tsx` (ny). Intet andet røres.

## Exact spec content

```ts
{
  type: "embed",
  question: { url: "https://fingerspurt.app/host?distance=100", text: "Scan koden og løb med!" },
  answer: { text: "Hvem vandt løbet? Giv lågen til vinderens hold." },
  backgroundVolume: 0,
}
```

## Autonomous decisions

- Tekst over iframen: "Scan koden og løb med!". Afvist: ingen tekst (iframen har ellers ikke en opfordring).
- Svarsiden er ren tekst uden billede. Afvist: et billede (slide-formen kræver intet).
- `distance=100`. Afvist: 200/400 (kortere løb passer til en låge).
- `shuffle` ændres ikke; lågen får plads 22 i filrækkefølgen. Afvist: at rette `quiz.ts`.

## Verification

`npm run check` skal passere. I browseren (Playwright mod `npm run dev`): find lågen, se iframe, "Fuldskærm"-knap og svarsiden.
