# X3R0 TROPHIES

Every Trophy. Every Secret. One Complete Guide.

X3R0 TROPHIES is a static website of PlayStation trophy guides. Every guide has:

- a **Platinum Route**: the order to play, stage by stage, so you earn every trophy with the fewest playthroughs;
- **missable warnings** before each point of no return;
- a **full walkthrough** for every trophy, in route order, with steps, tips, common mistakes, images and sources;
- a **checklist** that saves your ticks in the browser, with progress by grade and by stage, and a reset button.

The site has no backend, no accounts and no tracking. It's hosted free on GitHub Pages.

Guides so far:

- **Tom Clancy's The Division** (PS4 list, also used on PS5): 51 base trophies plus 15 DLC trophies.
- **Tom Clancy's Ghost Recon Wildlands** (PS4 list, also used on PS5): 44 base trophies plus 14 DLC trophies.
- **Immortals Fenyx Rising** (separate PS5 and PS4 lists with the same trophies): 51 base trophies plus 18 DLC trophies.
- **Watch Dogs** (PS4 list, also used on PS5): 40 base trophies plus 10 Bad Blood trophies.
- **Astro's Playroom** (PS5): 43 base trophies plus 8 in two free add-on groups.
- **Watch Dogs 2** (PS4 list, also used on PS5): 50 base trophies plus 6 DLC trophies (Human Conditions, No Compromise, Showd0wn).
- **Astro Bot** (PS5): 44 base trophies plus 19 from four free updates (Stellar Speedway, Winter Wonder, Vicious Void 1 and 2).

> The repository also contains a **fictional demo guide** ("Sample Game") that shows every part of the template. It's hidden by `"showDemo": false` in `data/site.json`; set it to `true` to see it.

---

## Contents

1. [Project structure](#project-structure)
2. [Run it on your computer](#run-it-on-your-computer)
3. [Publish it on GitHub Pages](#publish-it-on-github-pages)
4. [Add a game](#add-a-game)
5. [Update trophy data](#update-trophy-data)
6. [Add images and credits](#add-images-and-credits)
7. [What the build checks](#what-the-build-checks)
8. [Limitations](#limitations)
9. [Why there's a build step](#why-theres-a-build-step)

---

## Project structure

```
x3r0-trophies/
├── data/
│   ├── site.json              Site name, tagline, URL, demo switch
│   └── games/
│       ├── _template.json     Blank guide (copied by the new-game tool)
│       └── sample-game.json   Fictional demo guide
├── src/
│   ├── static/                Copied into the site as-is
│   │   ├── css/               Design tokens and styles (bundled into css/site.css)
│   │   ├── js/                Browser modules: search, filters, checklist, progress
│   │   └── assets/            Font, icons, social image, per-game images
│   └── templates/             Page templates (home, guide, about, 404)
├── tools/
│   ├── build.mjs              Validates data, builds _site/, checks every link
│   ├── check.mjs              Validates data and prints a completeness report
│   ├── new-game.mjs           Creates a new draft guide
│   ├── serve.mjs              Local preview server
│   └── lib/                   Data model, validator, link checker
├── docs/
│   ├── DATA-SCHEMA.md         Every field in a guide file, explained
│   └── ADDING-A-GAME.md       Step-by-step, including a research prompt for AI tools
├── .github/workflows/deploy.yml   Builds and publishes to GitHub Pages
└── package.json               Shortcuts for the commands below (no dependencies)
```

Content lives in `data/`, presentation in `src/`. Adding a game means adding one JSON file; no page code changes.

---

## Run it on your computer

You need [Node.js](https://nodejs.org/) 18 or newer. Nothing else is installed: the tools use only Node's built-in modules.

```bash
node tools/build.mjs     # builds the site into _site/
node tools/serve.mjs     # serves it at http://localhost:8080/
```

Or with npm: `npm run build`, `npm run serve`, or `npm start` for both.

Opening `_site/index.html` directly from your file system shows the pages, but browsers block the scripts there, so ticking trophies and search only work through the local server or the live site.

---

## Publish it on GitHub Pages

### 1. Create the repository

1. Sign in to [GitHub](https://github.com/) and choose **New repository**.
2. Name it, for example `x3r0-trophies`. Make it **Public** (GitHub Pages is free for public repositories).
3. Don't add a README or licence; this project has its own.

### 2. Upload the project

**With Git** (from inside this folder):

```bash
git init
git add .
git commit -m "Initial X3R0 TROPHIES site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/x3r0-trophies.git
git push -u origin main
```

**Without Git:** on the new repository page choose **uploading an existing file**, drag in everything in this folder (including the hidden `.github` folder: on macOS press Cmd+Shift+. in Finder to show it), and commit to `main`.

### 3. Turn on Pages

1. In the repository go to **Settings > Pages**.
2. Under **Build and deployment > Source**, choose **GitHub Actions**.
3. Open the **Actions** tab. The "Build and deploy" workflow runs on every push to `main`; the first run may need you to re-run it after changing the Pages source.
4. When it finishes, your site is live at `https://YOUR-USERNAME.github.io/x3r0-trophies/`.

### 4. Tell the site its address

Edit `data/site.json`:

```json
"url": "https://YOUR-USERNAME.github.io/x3r0-trophies/",
"repository": "https://github.com/YOUR-USERNAME/x3r0-trophies"
```

Commit the change. This turns on canonical links, the sitemap, social preview images, the "Report a problem" link, and makes the 404 page link correctly from the `/x3r0-trophies/` subpath.

### Other free hosts

Netlify and Cloudflare Pages work too. Set the build command to `node tools/build.mjs` and the output directory to `_site`. You can also run the build yourself and upload the `_site` folder to any static host.

---

## Add a game

Full instructions, including a research prompt you can give an AI assistant, are in [docs/ADDING-A-GAME.md](docs/ADDING-A-GAME.md). In short:

```bash
node tools/new-game.mjs "Game Title" --platform PS5
```

This creates `data/games/game-title.json` as a **draft** (drafts are never published and never block the build) and an image folder at `src/static/assets/games/game-title/`.

1. Fill in the guide following [docs/DATA-SCHEMA.md](docs/DATA-SCHEMA.md).
2. Run `node tools/check.mjs` and fix anything it reports.
3. Set `"status"` to `"in-progress"` (shows a "still being written" notice) or `"complete"`.
4. Commit and push. The site rebuilds automatically.

---

## Update trophy data

Edit the game's file in `data/games/`, update `"lastUpdated"`, and run `node tools/check.mjs`.

- Keep trophy `id`s stable. Players' saved ticks are stored by id, so renaming an id clears that one tick for everyone.
- To reorder the route, move ids between or within `route` stages. Each trophy must sit in exactly one stage.
- Record every source you used in `sources`, and reference it from the trophies and stats it supports. Anything without a source is shown as **Unverified**.

---

## Add images and credits

1. Only use images you're allowed to use: your own screenshots, publisher press kits whose terms allow fan sites, or openly licensed images. A credit line doesn't grant permission on its own.
2. Save the file in `src/static/assets/games/<slug>/` (WebP or JPEG for screenshots, around 1600px wide at most).
3. Add it to the game's `images` list with its pixel `width` and `height`, `alt` text and a full `credit` (rights holder, source name and URL, licence). The build refuses images without credit details.
4. Use it from a step (`{ "text": "...", "image": "id" }`), a trophy's `images`, or `theme.heroImage` / `theme.coverImage`.

The credit appears directly under every image in the format *Image: Rights holder · Source: Website · Licence: Licence*.

If you can't get an image yet, add a placeholder instead and describe what's needed. It shows as a labelled box and the checker lists it until it's replaced:

```json
{ "id": "boss-arena", "placeholder": true, "needed": "Screenshot of the arena's three pillars", "aspect": "16/9" }
```

---

## What the build checks

`node tools/build.mjs` stops with a clear message if any published guide:

- has missing or invalid required fields, or unknown fields (usually typos);
- lists a trophy that isn't in any route stage, or in two stages;
- has trophy counts per grade that don't match `officialCounts`;
- mixes DLC trophies into base-game stages, or the other way round;
- references a trophy, image or source id that doesn't exist (including `[[trophy-id]]` links in text);
- has an image without a file, size, alt text or credit;
- uses a theme colour that's too low-contrast to read;
- produces any broken internal link or `#anchor`, or a duplicate id.

It also warns about unsourced trophies, placeholder images, missing official counts and a missing `site.url`. The GitHub workflow runs the same build, so a broken guide never reaches the live site.

---

## Limitations

- **Progress is per browser.** Ticks live in the browser's local storage, so they don't sync between devices and are lost if site data is cleared. The site says this next to every checklist.
- **No server.** Anything that needs a database (accounts, comments, shared progress) would need another service.
- **GitHub Pages limits.** Sites should stay under 1 GB and roughly 100 GB of traffic a month. Compress screenshots and this won't be an issue.
- **Search** downloads one small index of every trophy the first time it opens. That stays fast into the thousands of trophies.

---

## Why there's a build step

The brief favoured plain HTML, CSS and JavaScript with no build system unless it clearly helps. A small one does here:

- Each guide is a real HTML page with its own title, description and social preview, so search engines and link previews see the full content.
- Guides are readable even if JavaScript fails or is switched off; scripts only add search, filters and the checklist.
- The validation and link checks catch missing trophies, wrong counts and broken links before anything is published.

The build uses only Node's standard library: there are no packages to install or update. The browser code is plain JavaScript modules.

---

## Credits

- [Archivo](https://github.com/Omnibus-Type/Archivo) typeface by Omnibus-Type, used under the SIL Open Font License (`src/static/assets/fonts/OFL.txt`).
- X3R0 TROPHIES is an independent fan project, not affiliated with or endorsed by Sony Interactive Entertainment or any game publisher.
