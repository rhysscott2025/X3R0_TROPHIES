#!/usr/bin/env node
// Validates every guide in data/games and prints a completeness report,
// without building the site. Exit code 1 if any published guide has errors.
//
//   node tools/check.mjs

import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAndValidate, printReport } from "./lib/pipeline.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const result = await loadAndValidate(ROOT);
printReport(result);

if (result.published.length) {
  console.log("\nGuide summary");
  const rows = result.published.map((g) => ({
    guide: g.slug,
    status: g.demo ? "demo" : g.status,
    base: g.counts.base.total,
    dlc: g.counts.dlcTotal,
    platinum: g.hasPlatinum ? "yes" : "no",
    missable: g.missables.length,
    sourced: g.demo ? "n/a" : `${g.sourcedCount}/${g.trophies.length}`,
    placeholders: g.images.filter((i) => i.placeholder).length,
  }));
  console.table(rows);
}

if (result.errorCount) {
  console.error(`\n${result.errorCount} error(s) found.`);
  process.exit(1);
}
console.log("\nNo errors.");
