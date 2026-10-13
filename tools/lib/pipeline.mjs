// Shared load-and-validate step used by build.mjs and check.mjs.

import path from "node:path";
import { loadSite, loadGameFiles, prepareGame } from "./model.mjs";
import { validateGame } from "./validate.mjs";

export async function loadAndValidate(root) {
  const site = await loadSite(root);
  const files = await loadGameFiles(root);
  const staticDir = path.join(root, "src", "static");
  const report = [];
  const published = [];
  let errorCount = 0;

  for (const f of files) {
    const name = path.relative(root, f.file);
    if (f.loadError) {
      report.push({ name, errors: [f.loadError], warnings: [] });
      errorCount += 1;
      continue;
    }
    const { errors, warnings } = validateGame(f.raw, { fileSlug: f.fileSlug, staticDir });
    const draft = f.raw.status === "draft";
    const hiddenDemo = f.raw.demo && site.showDemo === false;
    if (draft) {
      // Drafts never block the build: their problems are listed as warnings.
      report.push({ name, draft: true, errors: [], warnings: [...errors, ...warnings] });
      continue;
    }
    report.push({ name, errors, warnings, hidden: hiddenDemo });
    errorCount += errors.length;
    if (!errors.length && !hiddenDemo) published.push(prepareGame(f.raw));
  }

  const siteWarnings = [];
  if (!site.url) siteWarnings.push('site.url is empty. Canonical links, the sitemap and social previews are skipped, and the 404 page assumes the site sits at the domain root. Set it to your GitHub Pages address once you know it, e.g. "https://yourname.github.io/x3r0-trophies/".');
  else if (!/^https?:\/\/.+\/$/.test(site.url)) siteWarnings.push('site.url should be a full address ending in "/", e.g. "https://yourname.github.io/x3r0-trophies/".');

  return { site, published, report, errorCount, siteWarnings };
}

const C = process.stdout.isTTY ? { red: "\x1b[31m", yellow: "\x1b[33m", green: "\x1b[32m", dim: "\x1b[2m", reset: "\x1b[0m" } : { red: "", yellow: "", green: "", dim: "", reset: "" };

export function printReport({ report, siteWarnings }) {
  for (const w of siteWarnings) console.log(`${C.yellow}warning${C.reset} site.json: ${w}`);
  for (const r of report) {
    const label = r.draft ? " (draft, not published)" : r.hidden ? " (demo hidden by showDemo: false)" : "";
    const state = r.errors.length ? `${C.red}✗${C.reset}` : `${C.green}✓${C.reset}`;
    console.log(`\n${state} ${r.name}${C.dim}${label}${C.reset}`);
    for (const e of r.errors) console.log(`  ${C.red}error${C.reset}   ${e}`);
    for (const w of r.warnings) console.log(`  ${C.yellow}warning${C.reset} ${w}`);
  }
}
