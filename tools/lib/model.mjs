// Loads site and game data from /data and derives the values every page needs.
// Zero dependencies: Node's standard library only.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const GRADES = ["platinum", "gold", "silver", "bronze"];
export const GRADE_LABEL = { platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze" };

export const TAGS = {
  story: "Story",
  choice: "Choice",
  collectible: "Collectible",
  exploration: "Exploration",
  "side-quest": "Side quest",
  combat: "Combat",
  challenge: "Challenge",
  difficulty: "Difficulty",
  online: "Online",
  multiplayer: "Multiplayer",
  grind: "Grind",
  misc: "Miscellaneous",
};

export const PATTERNS = ["embers", "grid", "mist", "rays", "none"];
export const STATUSES = ["draft", "in-progress", "complete"];

export async function readJson(file) {
  const text = await readFile(file, "utf8");
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${path.basename(file)} is not valid JSON: ${err.message}`);
  }
}

export async function loadSite(root) {
  return readJson(path.join(root, "data", "site.json"));
}

/** Reads every data/games/*.json file except ones starting with "_" (templates). */
export async function loadGameFiles(root) {
  const dir = path.join(root, "data", "games");
  const names = (await readdir(dir)).filter((n) => n.endsWith(".json") && !n.startsWith("_")).sort();
  const games = [];
  for (const name of names) {
    const file = path.join(dir, name);
    const fileSlug = name.replace(/\.json$/, "");
    try {
      games.push({ file, fileSlug, raw: await readJson(file) });
    } catch (err) {
      games.push({ file, fileSlug, raw: null, loadError: err.message });
    }
  }
  return games;
}

const asArray = (v) => (Array.isArray(v) ? v : []);

function emptyCounts() {
  return { platinum: 0, gold: 0, silver: 0, bronze: 0, total: 0 };
}

/** Adds derived lookups and totals. Safe to call on partially invalid data. */
export function prepareGame(raw) {
  const g = structuredClone(raw);
  g.platforms = asArray(g.platforms);
  g.genres = asArray(g.genres);
  g.intro = Array.isArray(g.intro) ? g.intro : g.intro ? [g.intro] : [];
  g.trophies = asArray(g.trophies);
  g.route = asArray(g.route);
  g.images = asArray(g.images);
  g.sources = asArray(g.sources);
  g.dlc = asArray(g.dlc);
  g.stats = g.stats || {};
  g.theme = g.theme || {};

  g.trophyById = new Map(g.trophies.map((t) => [t.id, t]));
  g.imageById = new Map(g.images.map((i) => [i.id, i]));
  g.sourceById = new Map(g.sources.map((s) => [s.id, s]));
  g.dlcById = new Map(g.dlc.map((d) => [d.id, d]));

  g.stageOfTrophy = new Map();
  g.route.forEach((stage, index) => {
    stage.index = index;
    stage.trophies = asArray(stage.trophies);
    stage.steps = asArray(stage.steps);
    for (const id of stage.trophies) if (!g.stageOfTrophy.has(id)) g.stageOfTrophy.set(id, stage);
  });

  g.baseStages = g.route.filter((s) => !s.dlc);
  g.dlcGroups = g.dlc.map((d) => ({ dlc: d, stages: g.route.filter((s) => s.dlc === d.id) }));

  g.counts = { base: emptyCounts(), all: emptyCounts(), dlc: {} };
  for (const d of g.dlc) g.counts.dlc[d.id] = emptyCounts();
  for (const t of g.trophies) {
    if (!GRADES.includes(t.grade)) continue;
    const bucket = t.dlc ? g.counts.dlc[t.dlc] : g.counts.base;
    if (bucket) { bucket[t.grade] += 1; bucket.total += 1; }
    g.counts.all[t.grade] += 1;
    g.counts.all.total += 1;
  }
  g.counts.dlcTotal = g.counts.all.total - g.counts.base.total;
  g.hasPlatinum = g.counts.base.platinum > 0;

  // Missables in route order
  g.missables = [];
  for (const stage of g.route) {
    for (const id of stage.trophies) {
      const t = g.trophyById.get(id);
      if (t && t.missable) g.missables.push({ trophy: t, stage });
    }
  }

  g.sourcedCount = g.trophies.filter((t) => asArray(t.sources).length > 0).length;
  return g;
}
