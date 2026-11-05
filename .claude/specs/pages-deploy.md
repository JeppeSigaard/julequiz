# Deploy til GitHub Pages

> Status: merged — 4ec201b

## Goal

Every push to `main` (which in practice means every merged PR) builds the quiz and publishes it to
GitHub Pages at `https://jeppesigaard.github.io/julequiz/`. The quiz can then be opened on the
big screen from any browser without running a local server. Because Pages serves the repo under
the `/julequiz/` subpath, the app is given the base path `/julequiz/` everywhere: in production,
in `npm run dev` and in `npm start`. Every hand-written media path has to respect that base.

## Out of scope

- CI on pull requests. No `pull_request` trigger and no separate check workflow.
- Custom domain, `CNAME` file, DNS.
- Turning GitHub Pages on in the repo settings (Settings → Pages → Source: "GitHub Actions"). The
  user does this by hand, and the workflow must not try to (`enablement: true` is not used).
- Moving media from `public/` into `src/` as module imports, renaming media files, or converting
  `trille.mov`.
- Other changes to quiz content, layout or behaviour. The one exception is the stray-comma fix
  decided after review (see Decisions made). The unused `Answer` components in Question15/19 stay.
- Adding `getConfig`/`render: 'static'` to pages. The build is already fully static (see facts).

## Decisions made

- After review → also remove the stray `,` after `<audio … />` in `Question15.tsx` (~line 42)
  and after `<video … />` in `Question19.tsx` (~line 52). JSX renders it as a visible "," on the
  answer screen. In CLAUDE.md: realign the `npm run dev` table row to the table width, mention
  `public/audio/` alongside images/video in the Medier `asset()` sentence, and give the
  `npm start` row the `/julequiz/` URL as well.
- Hosting URL → project subpath `/julequiz/`, no custom domain.
- Where the base path applies → always, via `basePath: "/julequiz/"` in `waku.config.ts`. Dev
  runs at `http://localhost:3000/julequiz/`. No env-var switch.
- Workflow triggers → `push` to `main` plus `workflow_dispatch`. Nothing on PRs.
- Gate before deploy → the workflow runs `npm run check` (tsc + `waku build`) and uploads
  `dist/public`. A type error stops the deploy.
- Prefixing media paths → one small helper, `asset()`, in a new file `src/asset.ts`, used at
  every hand-written `/images/`, `/video/` and `/audio/` path.
- Publishing → the official Pages actions (`upload-pages-artifact` + `deploy-pages`), not a
  `gh-pages` branch.

## Architecture facts (verified)

- `waku.config.ts` currently has only a `vite` key. Waku 0.27's `Config` has `basePath?: string`,
  which must end in `/` or the build throws (`node_modules/waku/dist/lib/vite-rsc/plugin.js:28`).
  Waku passes `basePath` on as Vite's `base` and defines `WAKU_CONFIG_BASE_PATH`
  (`node_modules/waku/dist/lib/vite-plugins/main.js:12-15`).
- With `basePath: "/julequiz/"` (tested during planning):
  - The bundled JS, CSS and imported mp3s (`src/audio/`, `src/sfx/`) get the `/julequiz/assets/…`
    prefix automatically.
  - Hand-written strings such as `"/images/favicon.png"` are **not** rewritten, so they 404 on
    Pages.
  - `waku dev` serves `public/` under `/julequiz/`: `/julequiz/images/favicon.png` returns 200 and
    `/images/favicon.png` returns 404.
- `import.meta.env.BASE_URL` is available and typechecks under the current `tsconfig.json`
  (tested). It holds Vite's `base`, i.e. `"/julequiz/"` with a trailing slash. It works in both
  client components and the server component `src/pages/_layout.tsx`.
- `npm run build` already produces a static site: `dist/public/index.html`,
  `dist/public/RSC/R/_root.txt`, `assets/`, plus copies of `public/images`, `public/video` and
  `public/audio`. That is about 202 MB with no file over 50 MB, well inside Pages' limits (1 GB
  site, 100 MB per file). `dist/public` is what gets uploaded.
- The hand-written absolute media paths are all of these, and only these:
  - `src/pages/_layout.tsx:11` (`href` on the favicon `<link>`)
  - `src/components/GuessThatCat.tsx:6-14` (the `IMG_SOURCES` array, 9 strings)
  - `src/questions/Question1.tsx:9,15`
  - `src/questions/Question3.tsx:6,15`
  - `src/questions/Question4.tsx:6,11`
  - `src/questions/Question10.tsx:12`
  - `src/questions/Question11.tsx:14,39`
  - `src/questions/Question12.tsx:6,14`
  - `src/questions/Question14.tsx:10,19`
  - `src/questions/Question15.tsx:14,41` (`/video/trille.mov` and `"/audio/Valdes Jul.mp3#t=00:00:50"`)
  - `src/questions/Question17.tsx:10,32`
  - `src/questions/Question18.tsx:8,11`
  - `src/questions/Question19.tsx:12,36,51`
  - `src/questions/Question22.tsx:8,11`
  - `src/questions/Question24.tsx:8,11`

  Re-run `grep -rnE '"/(images|video|audio)/' src` afterwards. It must return nothing.
- The repo has no `.github/` directory, no `.nvmrc` and no `engines` field. Node 22 is used
  locally and the lockfile is `package-lock.json` (so `npm ci`).
- CLAUDE.md: the Medier section (around line 54) says media "refereres med absolut sti
  (`/images/…`)", and the commands table (line 15) says the devserver is on "port 3000". Both
  become wrong after this change.

## Implementation steps

1. **`waku.config.ts`**: add `basePath: "/julequiz/",` as the first key in the object passed to
   `defineConfig`, before `vite`.
2. **New file `src/asset.ts`**:
   ```ts
   // Filer i public/ serveres under basePath (/julequiz/), som Vite ikke selv sætter foran
   // håndskrevne stier.
   export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, "");
   ```
   No other exports.
3. **Replace every path in the list under Architecture facts.** Import `asset` with the relative
   path the file needs (`../asset`) and wrap the string in place:
   - JSX attribute: `src="/images/x.jpg"` → `src={asset("/images/x.jpg")}`. The same goes for
     `href` in `_layout.tsx`.
   - `GuessThatCat.tsx`: wrap each string in `IMG_SOURCES` with `asset(...)`. Keep it as an
     array literal and change nothing else in the file.
   - `Question15.tsx:41`: `src={asset("/audio/Valdes Jul.mp3#t=00:00:50")}`. Keep the space and
     the `#t=` fragment exactly as they are.

   Keep all other attributes, classes and formatting as they are.
4. **CLAUDE.md**:
   - Commands table, `npm run dev` row: change "(port 3000)" to "(http://localhost:3000/julequiz/)".
   - Medier section: replace "refereres med absolut sti (`/images/…`)" with a sentence saying
     they are referenced through `asset("/images/…")` from `src/asset.ts`, because the site runs
     under the `/julequiz/` base path on GitHub Pages.
   - Add a line in the Kommandoer or Arbejdsgang section: each push to `main` is deployed to
     GitHub Pages by `.github/workflows/deploy.yml`.

   Write it all in Danish.
5. **New file `.github/workflows/deploy.yml`**:
   - `name: Deploy til GitHub Pages`
   - `on: push: branches: [main]` and `workflow_dispatch:`
   - `permissions: { contents: read, pages: write, id-token: write }`
   - `concurrency: { group: pages, cancel-in-progress: false }`
   - job `build` (`runs-on: ubuntu-latest`) with these steps:
     1. `actions/checkout@v4`
     2. `actions/setup-node@v4` with `node-version: 22` and `cache: npm`
     3. `npm ci`
     4. `npm run check`
     5. `actions/configure-pages@v5`
     6. `actions/upload-pages-artifact@v4` with `path: dist/public`
   - job `deploy`: `needs: build`, `runs-on: ubuntu-latest`,
     `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`, and one
     step `actions/deploy-pages@v4` with `id: deployment`.
6. Commit in Danish, e.g. "Deploy quizzen til GitHub Pages ved push til main", with the session's
   co-author trailer.

## Traps

- **Do not just prefix the strings with `"/julequiz"` by hand.** The base then lives in two
  places, and the next new question will copy a plain `/images/` path from a sibling and break
  only on Pages. Always use `asset()`, which reads `import.meta.env.BASE_URL` from the one
  `basePath` setting.
- **Do not use relative paths (`"images/x.jpg"`) instead of `asset()`.** They happen to work on
  `/julequiz/` today, but they resolve against the current URL, so they break the moment the
  router serves anything other than the root. `asset()` gives an absolute, base-correct path.
- **Do not remove the trailing slash from `basePath`.** Waku throws `basePath must end with /` at
  build time. `asset()` also assumes `BASE_URL` ends in `/`, which is why it strips the leading
  `/` from its argument.
- **Do not copy `"/images/…"` from the existing question files as a pattern.** Those are exactly
  the lines this task rewrites. Any new path you add in this change goes through `asset()`.
- **Do not touch `import … from "../audio/…mp3"` or `"../sfx/…"` imports.** Vite already gives
  them the base prefix, and wrapping them would double it.
- **Do not add `.nojekyll`, a `gh-pages` branch or `peaceiris/actions-gh-pages`.** The
  artifact + `deploy-pages` route does not run Jekyll, so files starting with `_` (such as
  `RSC/R/_root.txt` and `_layout-*.css`) are served as they are.
- **Do not upload `dist/` or run `npm run build` again after `check`.** `check` already runs
  `waku build`, and only `dist/public` is the site. `dist/server` must not be published.
- **Do not edit `src/pages.gen.ts`.** It is generated.
- Comments: the only comment in this change is the one on `asset` in `src/asset.ts`, which says
  why it exists. The workflow and the replacements need none. Comments are in Danish.

## Verification

No new tests: the repo has none, and the logic is a one-line string join that is visible on
read.

1. `npm run check` passes.
2. `grep -rnE '"/(images|video|audio)/' src` returns nothing.
3. `grep -o 'href="[^"]*favicon[^"]*"' dist/public/index.html` shows
   `/julequiz/images/favicon.png`.
4. Simulate Pages: serve the build under the subpath, e.g.
   `mkdir -p /tmp/pages && rm -rf /tmp/pages/julequiz && cp -r dist/public /tmp/pages/julequiz && npx -y serve /tmp/pages -l 4321`
   (or `python3 -m http.server 4321 -d /tmp/pages`). Open `http://localhost:4321/julequiz/` with
   Playwright (pre-installed) and check:
   - the door grid is shown and the console has no 404 errors;
   - opening a door with an image (for example the one showing Question4's `ukraine.webp`; the
     order is shuffled, so find it by clicking around or check that
     `/julequiz/images/ukraine.webp` returns 200) loads the image;
   - `/julequiz/images/favicon.png`, `/julequiz/video/letgo.mp4` and
     `/julequiz/audio/Valdes%20Jul.mp3` all return 200.

   Report the results verbatim. Stop the server afterwards.
5. Validate the workflow YAML with `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))"`
   if PyYAML is installed. Otherwise read the file back and check the indentation, the three
   `permissions` and `needs: build` by eye.
