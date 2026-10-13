// Validates one game file against the X3R0 data schema (see docs/DATA-SCHEMA.md).
// Returns { errors, warnings } as plain-English strings. Errors stop the build;
// warnings are printed so gaps stay visible.

import { existsSync } from "node:fs";
import path from "node:path";
import { GRADES, TAGS, PATTERNS, STATUSES, prepareGame } from "./model.mjs";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const KNOWN_PLATFORMS = ["PS5", "PS4", "PS3", "PS Vita", "PS VR", "PS VR2"];

const KEYS = {
  game: ["schemaVersion", "slug", "status", "demo", "title", "edition", "platforms", "listNote", "releaseYear", "developer", "publisher", "genres", "summary", "intro", "lastUpdated", "stats", "officialCounts", "theme", "dlc", "route", "trophies", "images", "sources"],
  stage: ["id", "title", "dlc", "summary", "steps", "warning", "trophies"],
  trophy: ["id", "name", "grade", "description", "hidden", "dlc", "tags", "missable", "missableNote", "afterStory", "where", "when", "prerequisites", "unlock", "steps", "tips", "mistakes", "images", "icon", "sources"],
  image: ["id", "src", "width", "height", "alt", "caption", "credit", "placeholder", "needed", "aspect"],
  credit: ["holder", "sourceName", "sourceUrl", "license", "licenseUrl", "attribution"],
  source: ["id", "title", "url", "supports", "checked"],
  theme: ["accent", "glow", "base", "pattern", "heroImage", "coverImage"],
  dlc: ["id", "title", "note"],
};

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isUrl = (v) => typeof v === "string" && /^https?:\/\/[^\s]+$/.test(v);

function unknownKeys(obj, allowed, where, warn) {
  if (!obj || typeof obj !== "object") return;
  for (const k of Object.keys(obj)) if (!allowed.includes(k)) warn(`${where}: unknown field "${k}" (typo?)`);
}

// WCAG relative luminance and contrast
function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Every free-text field that may contain [[trophy-id]] references. */
function textFields(raw) {
  const out = [];
  const push = (where, v) => { if (typeof v === "string") out.push([where, v]); };
  (raw.intro || []).forEach((p, i) => push(`intro[${i}]`, p));
  for (const s of raw.route || []) {
    push(`stage "${s.id}" summary`, s.summary);
    push(`stage "${s.id}" warning`, s.warning);
    (s.steps || []).forEach((st, i) => push(`stage "${s.id}" step ${i + 1}`, st));
  }
  for (const t of raw.trophies || []) {
    const w = `trophy "${t.id}"`;
    for (const f of ["unlock", "missableNote", "where", "when"]) push(`${w} ${f}`, t[f]);
    for (const f of ["prerequisites", "tips", "mistakes"]) (t[f] || []).forEach((v, i) => push(`${w} ${f}[${i}]`, v));
    (t.steps || []).forEach((st, i) => push(`${w} step ${i + 1}`, typeof st === "string" ? st : st?.text));
  }
  return out;
}

export function validateGame(raw, { fileSlug, staticDir }) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  if (!raw || typeof raw !== "object") return { errors: ["File is empty or not an object."], warnings };

  unknownKeys(raw, KEYS.game, "game", warn);
  if (raw.schemaVersion !== 1) err(`schemaVersion must be 1 (found ${JSON.stringify(raw.schemaVersion)}).`);
  if (!isStr(raw.slug) || !SLUG.test(raw.slug)) err(`slug must be lowercase words joined by hyphens (found ${JSON.stringify(raw.slug)}).`);
  else if (raw.slug !== fileSlug) err(`slug "${raw.slug}" must match the file name "${fileSlug}.json".`);
  if (!STATUSES.includes(raw.status)) err(`status must be one of ${STATUSES.join(", ")}.`);
  if (!isStr(raw.title)) err("title is missing.");
  if (!Array.isArray(raw.platforms) || raw.platforms.length === 0) err("platforms must list at least one platform, e.g. [\"PS5\"].");
  else for (const p of raw.platforms) if (!KNOWN_PLATFORMS.includes(p)) warn(`platform "${p}" isn't one of ${KNOWN_PLATFORMS.join(", ")}. Check the spelling so filters group it correctly.`);
  if (!isStr(raw.summary)) err("summary is missing (one or two sentences for the library card).");
  else if (raw.summary.length > 240) warn(`summary is ${raw.summary.length} characters; keep it under 240 so cards stay even.`);
  if (!Array.isArray(raw.intro) || raw.intro.length === 0) warn("intro is empty.");
  if (!DATE.test(raw.lastUpdated || "")) err("lastUpdated must be a date like 2026-10-13.");
  if (raw.releaseYear != null && !(Number.isInteger(raw.releaseYear) && raw.releaseYear > 1990 && raw.releaseYear < 2100)) err("releaseYear must be a four-digit year or null.");
  if (raw.genres && !Array.isArray(raw.genres)) err("genres must be a list.");

  // ----- sources -----
  const sourceIds = new Set();
  for (const [i, s] of (raw.sources || []).entries()) {
    const w = `source ${i + 1}${s?.id ? ` ("${s.id}")` : ""}`;
    unknownKeys(s, KEYS.source, w, warn);
    if (!isStr(s.id) || !ID.test(s.id)) err(`${w}: id must be lowercase-with-hyphens.`);
    else if (sourceIds.has(s.id)) err(`${w}: duplicate id.`);
    else sourceIds.add(s.id);
    if (!isStr(s.title)) err(`${w}: title is missing.`);
    if (!isUrl(s.url)) err(`${w}: url must start with http:// or https://.`);
    if (!isStr(s.supports)) warn(`${w}: say what this source supports, e.g. "Trophy names and grades".`);
    if (s.checked != null && !DATE.test(s.checked)) err(`${w}: checked must be a date like 2026-10-13.`);
  }
  const checkSourceRefs = (refs, where) => {
    if (refs == null) return;
    if (!Array.isArray(refs)) return err(`${where}: sources must be a list of source ids.`);
    for (const id of refs) if (!sourceIds.has(id)) err(`${where}: source "${id}" isn't in the sources list.`);
  };

  // ----- stats -----
  const st = raw.stats || {};
  for (const key of Object.keys(st)) if (!["difficulty", "hours", "playthroughs", "online"].includes(key)) warn(`stats: unknown stat "${key}".`);
  if (st.difficulty?.value != null && !(Number.isInteger(st.difficulty.value) && st.difficulty.value >= 1 && st.difficulty.value <= 10)) err("stats.difficulty.value must be a whole number from 1 to 10, or null.");
  if (st.hours && (st.hours.min != null || st.hours.max != null)) {
    const { min, max } = st.hours;
    if (!(typeof min === "number" && min > 0)) err("stats.hours.min must be a positive number.");
    if (max != null && !(typeof max === "number" && max >= min)) err("stats.hours.max must be at least stats.hours.min.");
  }
  if (st.playthroughs?.value != null && !(Number.isInteger(st.playthroughs.value) && st.playthroughs.value >= 1)) err("stats.playthroughs.value must be a whole number of 1 or more.");
  if (st.online?.value != null && typeof st.online.value !== "boolean") err("stats.online.value must be true, false or null.");
  for (const key of ["difficulty", "hours", "playthroughs", "online"]) checkSourceRefs(st[key]?.sources, `stats.${key}`);

  // ----- dlc -----
  const dlcIds = new Set();
  for (const d of raw.dlc || []) {
    unknownKeys(d, KEYS.dlc, `dlc "${d?.id}"`, warn);
    if (!isStr(d.id) || !ID.test(d.id)) err(`dlc entry has an invalid id ${JSON.stringify(d.id)}.`);
    else if (dlcIds.has(d.id)) err(`dlc "${d.id}" is listed twice.`);
    else dlcIds.add(d.id);
    if (!isStr(d.title)) err(`dlc "${d.id}": title is missing.`);
  }

  // ----- images -----
  const imageIds = new Set();
  for (const [i, im] of (raw.images || []).entries()) {
    const w = `image ${i + 1}${im?.id ? ` ("${im.id}")` : ""}`;
    unknownKeys(im, KEYS.image, w, warn);
    if (!isStr(im.id) || !ID.test(im.id)) { err(`${w}: id must be lowercase-with-hyphens.`); continue; }
    if (imageIds.has(im.id)) err(`${w}: duplicate id.`);
    imageIds.add(im.id);
    if (im.placeholder) {
      if (!isStr(im.needed)) err(`${w}: placeholder images need a "needed" description of the image to find.`);
      if (im.aspect != null && !/^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(im.aspect)) err(`${w}: aspect must look like "16/9".`);
      warn(`${w}: placeholder still needs a real image (${im.needed || "no description"}).`);
      continue;
    }
    if (!isStr(im.src)) err(`${w}: src is missing.`);
    else if (isUrl(im.src)) warn(`${w}: hotlinked from ${new URL(im.src).hostname}. Download it into assets/ if its licence allows, so it can't break or be blocked.`);
    else if (staticDir && !existsSync(path.join(staticDir, im.src))) err(`${w}: file not found at src/static/${im.src}.`);
    if (!(Number.isInteger(im.width) && im.width > 0 && Number.isInteger(im.height) && im.height > 0)) err(`${w}: width and height must be the image's pixel size (prevents layout jumps).`);
    if (!isStr(im.alt)) err(`${w}: alt text is missing.`);
    const c = im.credit;
    if (!c || typeof c !== "object") err(`${w}: credit is missing. Every image needs its rights holder, source and licence.`);
    else {
      unknownKeys(c, KEYS.credit, `${w} credit`, warn);
      if (!isStr(c.holder)) err(`${w}: credit.holder (creator or rights holder) is missing.`);
      if (!isStr(c.sourceName)) err(`${w}: credit.sourceName (where it came from) is missing.`);
      if (!isStr(c.license)) err(`${w}: credit.license (licence or permission) is missing.`);
      if (c.sourceUrl != null && !isUrl(c.sourceUrl)) err(`${w}: credit.sourceUrl must be a full URL or null.`);
      if (c.licenseUrl != null && !isUrl(c.licenseUrl)) err(`${w}: credit.licenseUrl must be a full URL or null.`);
    }
  }
  const checkImageRef = (id, where) => { if (id != null && !imageIds.has(id)) err(`${where}: image "${id}" isn't in the images list.`); };

  // ----- theme -----
  const th = raw.theme || {};
  unknownKeys(th, KEYS.theme, "theme", warn);
  for (const k of ["accent", "glow", "base"]) if (!HEX.test(th[k] || "")) err(`theme.${k} must be a hex colour like #a9c7ff.`);
  if (th.pattern != null && !PATTERNS.includes(th.pattern)) err(`theme.pattern must be one of ${PATTERNS.join(", ")}.`);
  if (HEX.test(th.base || "") && luminance(th.base) > 0.03) err(`theme.base ${th.base} is too light. Keep it a near-black so body text stays readable.`);
  if (HEX.test(th.accent || "") && HEX.test(th.base || "")) {
    const ratio = contrast(th.accent, th.base);
    if (ratio < 4.5) err(`theme.accent ${th.accent} has ${ratio.toFixed(2)}:1 contrast on ${th.base}. Accent is used for text, so it needs at least 4.5:1.`);
    const shelfRatio = contrast(th.accent, "#121620");
    if (shelfRatio < 4.5) warn(`theme.accent ${th.accent} has only ${shelfRatio.toFixed(2)}:1 contrast on card backgrounds.`);
  }
  checkImageRef(th.heroImage, "theme.heroImage");
  checkImageRef(th.coverImage, "theme.coverImage");

  // ----- trophies -----
  if (!Array.isArray(raw.trophies) || raw.trophies.length === 0) err("No trophies added yet.");
  const trophyIds = new Set();
  const names = new Map();
  for (const [i, t] of (raw.trophies || []).entries()) {
    const w = `trophy ${i + 1}${t?.id ? ` ("${t.id}")` : ""}`;
    unknownKeys(t, KEYS.trophy, w, warn);
    if (!isStr(t.id) || !ID.test(t.id)) { err(`${w}: id must be lowercase-with-hyphens.`); continue; }
    if (trophyIds.has(t.id)) err(`${w}: duplicate id.`);
    trophyIds.add(t.id);
    if (!isStr(t.name)) err(`${w}: name is missing.`);
    else if (names.has(t.name)) warn(`${w}: name "${t.name}" is also used by "${names.get(t.name)}". Fine if the game really repeats it.`);
    else names.set(t.name, t.id);
    if (!GRADES.includes(t.grade)) err(`${w}: grade must be one of ${GRADES.join(", ")}.`);
    if (!isStr(t.description)) err(`${w}: the official trophy description is missing.`);
    if (t.dlc != null && !dlcIds.has(t.dlc)) err(`${w}: dlc "${t.dlc}" isn't in the dlc list.`);
    if (t.dlc && t.grade === "platinum") err(`${w}: a DLC trophy can't be the Platinum.`);
    if (typeof t.missable !== "boolean") err(`${w}: missable must be true or false.`);
    if (t.missable && !isStr(t.missableNote)) warn(`${w}: missable trophies should explain when they're lost in missableNote.`);
    if (t.afterStory != null && typeof t.afterStory !== "boolean") err(`${w}: afterStory must be true, false or null.`);
    if (t.missable && t.afterStory === true) warn(`${w}: marked missable but also obtainable after the story. Check which is right.`);
    for (const tag of t.tags || []) if (!TAGS[tag]) err(`${w}: unknown tag "${tag}". Use one of ${Object.keys(TAGS).join(", ")}.`);
    if (!isStr(t.unlock)) warn(`${w}: no unlock explanation yet.`);
    if (!Array.isArray(t.steps) || t.steps.length === 0) warn(`${w}: no steps yet.`);
    for (const [si, step] of (t.steps || []).entries()) {
      if (typeof step === "string") continue;
      if (!step || !isStr(step.text)) err(`${w} step ${si + 1}: must be text or { "text": ..., "image": ... }.`);
      else checkImageRef(step.image, `${w} step ${si + 1}`);
    }
    for (const id of t.images || []) checkImageRef(id, w);
    checkImageRef(t.icon, `${w} icon`);
    checkSourceRefs(t.sources, w);
  }

  // ----- route -----
  const stageIds = new Set();
  const placed = new Map();
  for (const [i, s] of (raw.route || []).entries()) {
    const w = `stage ${i + 1}${s?.id ? ` ("${s.id}")` : ""}`;
    unknownKeys(s, KEYS.stage, w, warn);
    if (!isStr(s.id) || !ID.test(s.id)) { err(`${w}: id must be lowercase-with-hyphens.`); continue; }
    if (stageIds.has(s.id)) err(`${w}: duplicate id.`);
    stageIds.add(s.id);
    if (!isStr(s.title)) err(`${w}: title is missing.`);
    else if ((raw.dlc || []).some((d) => d.title === s.title)) warn(`${w}: title is the same as a DLC title. Give the stage its own name so the page has no two sections with identical names.`);
    if (s.dlc != null && !dlcIds.has(s.dlc)) err(`${w}: dlc "${s.dlc}" isn't in the dlc list.`);
    if (!Array.isArray(s.trophies)) { err(`${w}: trophies must be a list of trophy ids.`); continue; }
    for (const id of s.trophies) {
      const t = (raw.trophies || []).find((x) => x.id === id);
      if (!t) { err(`${w}: trophy "${id}" doesn't exist.`); continue; }
      if (placed.has(id)) err(`trophy "${id}" appears in two stages ("${placed.get(id)}" and "${s.id}"). Put it in one.`);
      placed.set(id, s.id);
      if ((t.dlc || null) !== (s.dlc || null)) err(`${w}: trophy "${id}" belongs to ${t.dlc ? `DLC "${t.dlc}"` : "the base game"} but this stage is ${s.dlc ? `DLC "${s.dlc}"` : "a base-game stage"}.`);
    }
  }
  for (const id of trophyIds) if (!placed.has(id)) err(`trophy "${id}" isn't in any route stage, so it would never appear in the walkthrough.`);
  if ((raw.route || []).filter((s) => !s.dlc).length === 0 && trophyIds.size) err("route needs at least one base-game stage.");

  // Platinum placement
  const g = prepareGame(raw);
  if (g.counts.base.platinum > 1) err("The base game can only have one Platinum trophy.");
  const plat = (raw.trophies || []).find((t) => t.grade === "platinum");
  if (plat) {
    const lastBase = g.baseStages[g.baseStages.length - 1];
    if (lastBase && !lastBase.trophies.includes(plat.id)) warn(`The Platinum "${plat.id}" isn't in the last base-game stage. Most routes end with it.`);
  }

  // Inline [[id]] references
  for (const [where, text] of textFields(raw)) {
    for (const m of text.matchAll(/\[\[([^\]]+)\]\]/g)) if (!trophyIds.has(m[1])) err(`${where}: [[${m[1]}]] doesn't match any trophy id.`);
  }

  // ----- official counts -----
  const oc = raw.officialCounts;
  if (!oc || !oc.base) warn("officialCounts not recorded, so the trophy list can't be checked for completeness.");
  else {
    const cmp = (expected, actual, label) => {
      for (const grade of GRADES) {
        const want = expected?.[grade] ?? 0;
        if (want !== actual[grade]) err(`${label}: the official list has ${want} ${grade}, but ${actual[grade]} are listed.`);
      }
    };
    cmp(oc.base, g.counts.base, "Base game");
    for (const d of raw.dlc || []) {
      if (!oc.dlc || !oc.dlc[d.id]) warn(`officialCounts.dlc has no entry for "${d.id}".`);
      else cmp(oc.dlc[d.id], g.counts.dlc[d.id], `DLC "${d.id}"`);
    }
    checkSourceRefs(oc.sources, "officialCounts");
    if (!raw.demo && !(oc.sources || []).length) warn("officialCounts has no source. Link the trophy list you counted from.");
  }

  // ----- verification summary -----
  if (!raw.demo) {
    const unsourced = (raw.trophies || []).filter((t) => !(t.sources || []).length).length;
    if (unsourced) warn(`${unsourced} of ${(raw.trophies || []).length} trophies have no source and will show as unverified.`);
    if (raw.status === "complete" && unsourced) warn("status is \"complete\" but some trophies are unverified. Consider \"in-progress\".");
  }

  return { errors, warnings };
}
