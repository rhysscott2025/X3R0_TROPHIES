#!/usr/bin/env node
// Builds the static site into _site/.
//
//   node tools/build.mjs            build, validate data and check links
//   node tools/build.mjs --out dir  build somewhere else
//   node tools/build.mjs --url URL  override site.url (e.g. to test a subpath)
//
// Zero dependencies. Requires Node 18 or newer.

import { readFile, writeFile, mkdir, rm, cp, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadAndValidate, printReport } from "./lib/pipeline.mjs";
import { checkLinks } from "./lib/linkcheck.mjs";
import { renderHome } from "../src/templates/home.mjs";
import { renderGame } from "../src/templates/game.mjs";
import { renderAbout, renderNotFound } from "../src/templates/pages.mjs";
import { plain } from "../src/templates/util.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATIC = path.join(ROOT, "src", "static");
const CSS_ORDER = ["tokens", "base", "layout", "components", "themes", "home", "game"];

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function listFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(full)));
    else out.push(full);
  }
  return out.sort();
}

/** Short content hash so browsers fetch fresh CSS/JS after each deploy. */
async function versionHash() {
  const hash = createHash("sha1");
  for (const dir of [STATIC, path.join(ROOT, "data"), path.join(ROOT, "src", "templates")]) {
    for (const f of await listFiles(dir)) hash.update(f.slice(ROOT.length)).update(await readFile(f));
  }
  return hash.digest("hex").slice(0, 10);
}

function basePathOf(site) {
  if (!site.url) return "/";
  try {
    const p = new URL(site.url).pathname;
    return p.endsWith("/") ? p : `${p}/`;
  } catch {
    return "/";
  }
}

function searchIndex(games) {
  return {
    games: games.map((g) => ({
      t: g.title,
      e: [g.platforms.join(" and "), g.edition].filter(Boolean).join(", "),
      u: `games/${g.slug}.html`,
      d: Boolean(g.demo),
    })),
    trophies: games.flatMap((g, gi) =>
      g.trophies.map((t) => ({
        g: gi,
        n: t.name,
        // Hidden trophies keep their description out of search to avoid spoilers.
        d: t.hidden ? "" : plain(t.description),
        r: t.grade,
        m: Boolean(t.missable),
        u: `games/${g.slug}.html#t-${t.id}`,
      })),
    ),
  };
}

function sitemap(site, games) {
  const base = site.url.endsWith("/") ? site.url : `${site.url}/`;
  const urls = [
    ["", null],
    ["about.html", null],
    ...games.filter((g) => !g.demo).map((g) => [`games/${g.slug}.html`, g.lastUpdated]),
  ];
  const body = urls.map(([p, mod]) => `  <url><loc>${new URL(p, base).href}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ""}</url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function main() {
  const started = Date.now();
  const out = path.resolve(ROOT, argValue("--out", "_site"));

  const result = await loadAndValidate(ROOT);
  printReport(result);
  if (result.errorCount) {
    console.error(`\nBuild stopped: ${result.errorCount} data error(s). Fix them and run the build again.`);
    process.exit(1);
  }

  const { site, published } = result;
  const urlOverride = argValue("--url", null);
  if (urlOverride) site.url = urlOverride;
  const version = await versionHash();
  const basePath = basePathOf(site);

  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, "games"), { recursive: true });

  // Static files, except CSS sources (bundled below)
  await cp(STATIC, out, {
    recursive: true,
    filter: (src) => !(src.startsWith(path.join(STATIC, "css")) && src.endsWith(".css")),
  });

  // CSS bundle
  const css = [];
  for (const name of CSS_ORDER) css.push(await readFile(path.join(STATIC, "css", `${name}.css`), "utf8"));
  await mkdir(path.join(out, "css"), { recursive: true });
  await writeFile(path.join(out, "css", "site.css"), css.join("\n"));

  // Version the JS module graph so updates aren't served from a stale cache
  for (const f of await listFiles(path.join(out, "js"))) {
    if (!f.endsWith(".js")) continue;
    const text = await readFile(f, "utf8");
    await writeFile(f, text.replace(/(from\s+|import\s*\(\s*)(["'])(\.{1,2}\/[^"']+\.js)\2/g, `$1$2$3?v=${version}$2`));
  }

  // Pages
  await writeFile(path.join(out, "index.html"), renderHome({ site, games: published, version }));
  await writeFile(path.join(out, "about.html"), renderAbout({ site, version }));
  await writeFile(path.join(out, "404.html"), renderNotFound({ site, version, basePath }));
  for (const game of published) {
    await writeFile(path.join(out, "games", `${game.slug}.html`), renderGame({ site, game, version }));
  }

  // Data and crawler files
  await writeFile(path.join(out, "search-index.json"), JSON.stringify(searchIndex(published)));
  const robots = [`User-agent: *`, `Allow: /`];
  if (site.url) {
    await writeFile(path.join(out, "sitemap.xml"), sitemap(site, published));
    robots.push(`Sitemap: ${new URL("sitemap.xml", site.url.endsWith("/") ? site.url : `${site.url}/`).href}`);
  }
  await writeFile(path.join(out, "robots.txt"), `${robots.join("\n")}\n`);
  await writeFile(path.join(out, ".nojekyll"), "");

  // Link check
  const links = await checkLinks(out, basePath);
  if (links.problems.length) {
    console.error(`\nBroken links or anchors (${links.problems.length}):`);
    for (const p of links.problems) console.error(`  ${p}`);
    process.exit(1);
  }

  const trophyTotal = published.reduce((n, g) => n + g.counts.all.total, 0);
  console.log(`\nBuilt ${links.pages} pages (${published.length} guide${published.length === 1 ? "" : "s"}, ${trophyTotal} trophies) into ${path.relative(ROOT, out) || "."}/ in ${Date.now() - started} ms.`);
  console.log(`Checked ${links.checked} internal links and anchors: all OK. Version ${version}.`);
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
