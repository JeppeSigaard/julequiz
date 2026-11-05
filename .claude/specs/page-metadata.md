# Sidemetadata: titel, beskrivelse, ikoner og delingsbillede

> Status: in progress — claude/brave-ramanujan-pidlf9

## Goal

The app has no `<title>`, its description says only "Julequiz", and the favicon is a torii-gate
emoji (`public/images/favicon.png`, 64×64) that has nothing to do with the quiz. Give the page a
proper title, "Den Store Julequiz", plus a Danish description, a Christmas-door icon (SVG
favicon, PNG fallback, apple touch icon, manifest icons), a web app manifest, `theme-color`,
`lang="da"`, and Open Graph/Twitter tags with a sharing image taken from the real board. Also
capitalize the jul-2025 pack's title, which is the big heading on the board.

## Out of scope

- Do not make `<title>` follow the selected pack. It is static.
- No service worker and no offline/PWA behaviour beyond the manifest.
- No per-pack icons or sharing images.
- Do not commit the scripts that render the PNGs, and do not add an npm dependency or npm script
  for them.
- No changes to `Stage`, `BoardHeader`, `decor.tsx`, `styles.css` or any component's layout.
- Do not edit `src/pages.gen.ts`.

## Decisions made

- Title → `Den Store Julequiz`, in `<title>`, `og:title` and the manifest `name`. The jul-2025
  pack's `title` also becomes `"Den Store Julequiz"` (it was `"den store julequiz"`).
- Description → `Julekalender-quiz for to hold med 24 låger, musik og gåder.`, used verbatim
  for `meta description`, `og:description` and the manifest `description`.
- Icon → the hand-drawn SVG door below. The SVG is the favicon, and Chromium renders the PNGs.
- Sharing image → a screenshot of the real, empty board, 1200×630.
- Extras → `lang="da"` (via a new `src/pages/_root.tsx`), `theme-color` `#0e2c22`, and a web
  app manifest with 192 and 512 icons.
- Canonical site URL → `https://jeppesigaard.github.io/julequiz/` (checked: 200). Open Graph needs
  absolute URLs for `og:url` and `og:image`.

## Architecture facts (verified)

- `src/pages/_layout.tsx` is an async server component. It renders `<meta>`/`<link>` inside a
  `<div className="font-body">`, and React 19 hoists them into `<head>` in the prerendered
  `dist/public/index.html`. `<title>` hoists the same way. Keep putting head tags there.
- There is no `src/pages/_root.tsx` today. Waku's default root
  (`node_modules/waku/dist/router/create-pages.js` ~line 33) is
  `<ErrorBoundary><html><head></head><body>{children}</body></html></ErrorBoundary>`, with
  `ErrorBoundary` from `waku/router/client` (an exported subpath; the class is declared in
  `node_modules/waku/dist/router/client.d.ts:58`). The fs-router picks up `_root.tsx` and renders
  it statically (`node_modules/waku/dist/router/fs-router.js` ~line 84). README section "Root
  element": `node_modules/waku/README.md` ~line 613.
- `asset()` (`src/asset.ts`) prefixes `import.meta.env.BASE_URL` (`/julequiz/`) onto a public
  path. Use it for every relative `href` in `_layout.tsx`. Absolute `https://` URLs must not go
  through it.
- `src/config.ts` holds only `export const DEFAULT_QUIZ = "jul-2025";`.
- `src/quizzes/jul-2025/quiz.ts:4` is `title: "den store julequiz",`. The heading shows it via
  `src/pages/index.tsx:232` → `BoardHeader` (`text-[125px]`, `font-display`).
- `.github/workflows/deploy.yml` publishes `dist/public`. Everything in `public/` lands at
  `/julequiz/<path>`.
- The pack's background colour is `#0e2c22` (`quiz.ts` `colors.background`, and the `:root`
  default `--quiz-background` in `src/styles.css:5`).
- `npm start` serves on **http://localhost:8080/julequiz/**, not the 3000 that `CLAUDE.md` says
  (seen in its own output). `npm run dev` uses 3000.

## Implementation steps

1. **Icon source.** Create `public/images/icon.svg` with exactly this content:

   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
     <rect width="64" height="64" rx="14" fill="#0e2c22"/>
     <rect x="13" y="9" width="38" height="46" rx="5" fill="#f6ecd9"/>
     <rect x="17" y="13" width="30" height="38" rx="3" fill="none" stroke="#d2393f" stroke-width="1.5" stroke-dasharray="3 2.5"/>
     <path d="M32 21.5l3.1 6.3 6.9 1-5 4.9 1.2 6.9L32 37.3l-6.2 3.3 1.2-6.9-5-4.9 6.9-1z" fill="#d2393f"/>
     <circle cx="43" cy="32" r="2" fill="#f2c14e"/>
   </svg>
   ```

2. **Render the PNG icons** with a throwaway Node script in a scratch directory outside the repo,
   using the pre-installed Playwright (`require('playwright')`, `chromium.launch()` with no
   options). For each size, open a page with viewport `size×size` and deviceScaleFactor 1, and
   `setContent` an `<img width=size height=size>` of the SVG as a base64 data URL, with
   `*{margin:0}`. Then `screenshot` with `omitBackground: true`. Write:
   - `public/images/favicon.png`: 32×32 (overwrite the torii gate).
   - `public/images/icon-192.png`: 192×192.
   - `public/images/icon-512.png`: 512×512.
   - `public/images/apple-touch-icon.png`: 180×180, rendered from a copy of the SVG where the
     first `<rect>` has **no** `rx` (full-bleed square, see Traps).
   Check each with `file` (dimensions) and look at the 180 and 32 renders.

3. **`src/config.ts`**: add `export const SITE_URL = "https://jeppesigaard.github.io/julequiz/";`
   below `DEFAULT_QUIZ`.

4. **`public/site.webmanifest`** (JSON), with paths relative to the manifest so the base path
   stays in one place:
   `name` "Den Store Julequiz", `short_name` "Julequiz", `description` (the decided text),
   `lang` "da", `start_url` "./", `scope` "./", `display` "fullscreen", `background_color` and
   `theme_color` "#0e2c22", `icons`: `images/icon-192.png` (192x192, image/png) and
   `images/icon-512.png` (512x512, image/png).

5. **`src/pages/_root.tsx`**: a new async server component modelled on Waku's DefaultRoot:
   `<ErrorBoundary><html lang="da"><head></head><body>{children}</body></html></ErrorBoundary>`,
   importing `ErrorBoundary` from `"waku/router/client"`, typed `{ children: ReactNode }` like
   `RootLayoutProps` in `_layout.tsx`. Export
   `getConfig = async () => ({ render: "static" }) as const`, as the README shows.

6. **`src/pages/_layout.tsx`**: import `SITE_URL` from `"../config"`. Replace the old
   `description` meta and favicon link with, in this order before the font links:
   - `<title>Den Store Julequiz</title>`
   - `meta name="description"` (the decided text)
   - `meta name="theme-color" content="#0e2c22"`
   - `link rel="icon" type="image/svg+xml" href={asset("/images/icon.svg")}`
   - `link rel="icon" type="image/png" sizes="32x32" href={asset("/images/favicon.png")}`
   - `link rel="apple-touch-icon" href={asset("/images/apple-touch-icon.png")}`
   - `link rel="manifest" href={asset("/site.webmanifest")}`
   - `meta property=` `og:type` "website", `og:site_name` and `og:title` "Den Store Julequiz",
     `og:description` (the decided text), `og:locale` "da_DK", `og:url` `{SITE_URL}`,
     `og:image` `` {`${SITE_URL}images/og-image.png`} ``, `og:image:width` "1200",
     `og:image:height` "630", `og:image:alt` "Julekalenderen med 24 låger og to holds pointtavler".
   - `meta name="twitter:card" content="summary_large_image"`
   Pull the repeated title and description strings into two module-level consts in
   `_layout.tsx`.

7. **`src/quizzes/jul-2025/quiz.ts:4`**: `title: "Den Store Julequiz",`.

8. **Sharing image.** Run `npm run build`, then `npm start` in the background. With a throwaway
   Playwright script (scratch dir), open `http://localhost:8080/julequiz/` at viewport 1200×630,
   deviceScaleFactor 1, in a fresh context (empty localStorage, so the board is empty). Wait for
   `document.fonts.ready` plus ~2 s, then screenshot to `public/images/og-image.png`. Look at it:
   the garland, the "Den Store Julequiz" heading, both plaques and all 24 doors must be visible
   in Mountains of Christmas, not a fallback font. Stop the server.

9. **`CLAUDE.md`**: line 33, change "(fonte, favicon, `styles.css`)" to
   "(fonte, `<title>`, meta/OG-tags, ikoner, `styles.css`); `_root.tsx` sætter kun
   `<html lang="da">` og bevarer Waku's `ErrorBoundary`". Line 105, change
   "(`public/images/` rummer kun favicon)" to "(`public/images/` rummer kun ikoner og
   delingsbilledet; kilden er `icon.svg`)". Keep the Danish style.

10. Run `npm run check`. Commit in Danish, e.g. "Tilføj sidetitel, beskrivelse, ikoner og
    delingsbillede".

## Traps

- **Do not write `_root.tsx` without `ErrorBoundary`.** Waku's DefaultRoot wraps `<html>` in it.
  A custom root replaces DefaultRoot entirely, so leaving it out silently drops the app's
  top-level error boundary. Copy the DefaultRoot structure exactly and add only `lang="da"`.
- **Do not move the head tags into `_root.tsx`'s `<head>`.** Keep them in `_layout.tsx`, where
  the font links already prove that hoisting works. One place for head content.
- **Do not run `og:image`/`og:url` through `asset()` or make them relative.** Facebook, Slack and
  iMessage ignore relative OG image URLs. They must be the absolute `SITE_URL`-based strings.
  Every *relative* `href` (icons, manifest), however, must go through `asset()`. A bare
  `/images/…` 404s on Pages, because the site lives under `/julequiz/`.
- **Do not use `/julequiz/…` or `asset()` paths inside `site.webmanifest`.** It is static JSON
  that never passes through Vite. Relative paths resolve against the manifest's own URL
  (`/julequiz/site.webmanifest`), which is correct in dev, in `start` and on Pages.
- **Do not give the apple touch icon transparent rounded corners.** iOS fills transparency with
  black and applies its own mask, so `rx="14"` would show black corners. Render it full-bleed
  (no `rx`). The favicon and manifest icons keep the rounded version.
- **Do not take the screenshot at 1920×1080 and resize or crop it.** Cropping cuts the garland or
  the footer, and resizing needs a tool we don't have. A 1200×630 viewport makes `Stage` scale
  the scene itself (letterboxed on the sides), which is fine.
- **Do not take the screenshot from `npm run dev`.** Dev injects Vite's client and can show an
  error overlay. Use the built site.
- **Do not replace the `#0e2c22` hex in `theme-color`/the manifest with a token.** Meta content
  cannot read CSS variables. The CLAUDE.md rule against raw hex applies to class utilities, which
  this change adds none of.
- **Do not edit the `<title>` via `document.title` or a client component.** The page is
  prerendered, and crawlers read the static HTML.
- Comments: only one is warranted, a one-line Danish comment in `_root.tsx` saying it exists
  only for `lang` and must keep Waku's `ErrorBoundary`. Everything else needs none.

## Verification

No tests (none exist, and this is static markup). After `npm run check`:

- `dist/public/index.html` contains `<html lang="da">`, exactly one `<title>Den Store
  Julequiz</title>`, exactly one `name="description"` with the decided text, the icon/manifest
  links with `/julequiz/` prefixes, and `og:image` =
  `https://jeppesigaard.github.io/julequiz/images/og-image.png`. Show the `grep -o` output.
- `dist/public/site.webmanifest`, `dist/public/images/{icon.svg,favicon.png,apple-touch-icon.png,icon-192.png,icon-512.png,og-image.png}`
  exist. `file` reports the expected dimensions (og-image 1200 x 630).
- With `npm start`, every icon URL and the manifest return 200 at `http://localhost:8080/julequiz/…`.
- Screenshot the board at 1920×1080: the heading reads "Den Store Julequiz" and still fits
  between the two plaques without overlapping them.
- Open `?quiz=findes-ikke`: the pack list still renders (the root change must not break it).
