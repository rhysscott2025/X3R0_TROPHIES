#!/usr/bin/env node
// Creates a new draft guide from data/games/_template.json.
//
//   node tools/new-game.mjs "Game Title" [--slug custom-slug] [--platform PS5]
//
// The new guide starts as status "draft", so it won't be published (or block
// the build) until you change its status to "in-progress" or "complete".

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const title = process.argv[2];
if (!title || title.startsWith("--")) {
  console.error('Usage: node tools/new-game.mjs "Game Title" [--slug custom-slug] [--platform PS5]');
  process.exit(1);
}

const slug = arg("--slug") || slugify(title);
const platform = arg("--platform") || "PS5";
const file = path.join(ROOT, "data", "games", `${slug}.json`);
if (existsSync(file)) {
  console.error(`data/games/${slug}.json already exists. Pick another --slug or edit that file.`);
  process.exit(1);
}

const template = JSON.parse(await readFile(path.join(ROOT, "data", "games", "_template.json"), "utf8"));
template.slug = slug;
template.title = title;
template.platforms = [platform];
template.lastUpdated = new Date().toISOString().slice(0, 10);

await writeFile(file, `${JSON.stringify(template, null, 2)}\n`);
const assets = path.join(ROOT, "src", "static", "assets", "games", slug);
await mkdir(assets, { recursive: true });
if (!existsSync(path.join(assets, ".gitkeep"))) await writeFile(path.join(assets, ".gitkeep"), "");

console.log(`Created data/games/${slug}.json (draft) and src/static/assets/games/${slug}/.`);
console.log("Fill in the guide, set status to \"in-progress\" or \"complete\", then run: node tools/check.mjs");
