// Pieces shared by the home page and guide pages.

import { esc, html, inline, extLink } from "./util.mjs";
import { cup, icons } from "./icons.mjs";
import { GRADES, GRADE_LABEL } from "../../tools/lib/model.mjs";

export function gradeMark(grade, { label = true, count = null } = {}) {
  const text = count != null ? `${count} ${GRADE_LABEL[grade].toLowerCase()}` : GRADE_LABEL[grade];
  return `<span class="grade grade--${grade}">${cup(grade)}${label ? `<span>${esc(text)}</span>` : `<span class="sr-only">${esc(text)}</span>`}</span>`;
}

/** Inline list of grade counts, e.g. 1 platinum, 1 gold, 3 silver, 8 bronze. */
export function gradeCounts(counts) {
  const items = GRADES.filter((g) => counts[g] > 0)
    .map((g) => `<li><span class="grade grade--${g}">${cup(g)}<span>${counts[g]}<span class="sr-only"> ${GRADE_LABEL[g].toLowerCase()}</span></span></span></li>`);
  return items.length ? `<ul class="grade-counts" aria-label="Trophies by grade">${items.join("")}</ul>` : "";
}

/** Attribution line in the required format: Image · Source · Licence. */
export function attribution(credit) {
  if (!credit) return "";
  const source = credit.sourceUrl ? extLink(credit.sourceUrl, esc(credit.sourceName)) : esc(credit.sourceName);
  const licence = credit.licenseUrl ? extLink(credit.licenseUrl, esc(credit.license)) : esc(credit.license);
  const extra = credit.attribution ? ` · ${esc(credit.attribution)}` : "";
  return `<span class="attribution">Image: ${esc(credit.holder)} · Source: ${source} · Licence: ${licence}${extra}</span>`;
}

export function imageSrc(src, root) {
  return /^https?:\/\//.test(src) ? src : `${root}${src}`;
}

/** A figure with its credit directly beneath, or a labelled placeholder. */
export function figure(image, { root, ctx, eager = false } = {}) {
  if (!image) return "";
  if (image.placeholder) {
    const aspect = image.aspect || "16/9";
    return `<figure class="figure">
  <div class="placeholder-media" style="aspect-ratio:${esc(aspect)}" role="img" aria-label="Image still needed: ${esc(image.needed)}">
    ${icons.image}<strong>Image still needed</strong><span>${esc(image.needed)}</span>
  </div>
</figure>`;
  }
  return `<figure class="figure">
  <div class="figure-media" style="aspect-ratio:${image.width}/${image.height}">
    <img src="${esc(imageSrc(image.src, root))}" width="${image.width}" height="${image.height}" alt="${esc(image.alt)}"${eager ? "" : ' loading="lazy"'} decoding="async">
  </div>
  <figcaption>${image.caption ? `<span class="figure-caption">${inline(image.caption, ctx)}</span>` : ""}${attribution(image.credit)}</figcaption>
</figure>`;
}

/** Theme custom properties for a game. */
export function themeStyle(game) {
  const t = game.theme || {};
  return html([
    t.accent && `--accent:${t.accent};`,
    t.glow && `--accent-glow:${t.glow};`,
    t.base && `--theme-base:${t.base};`,
  ]);
}

export function patternClass(game) {
  return `pattern-${game.theme?.pattern || "none"}`;
}

const sourcesOf = (stat) => (Array.isArray(stat?.sources) ? stat.sources : []);

/** Renders a stat value, marking it unverified when no source backs it. */
export function statValue(game, stat, formatted) {
  if (formatted == null) return '<span class="unverified">Not yet researched</span>';
  const unverified = !game.demo && sourcesOf(stat).length === 0;
  return `${formatted}${unverified ? ' <small class="unverified">Unverified</small>' : ""}`;
}

export function hoursText(game) {
  const h = game.stats?.hours;
  if (!h || h.min == null) return null;
  return h.max != null && h.max !== h.min ? `${h.min}–${h.max} hours` : `${h.min} hours`;
}

export function difficultyText(game) {
  const d = game.stats?.difficulty?.value;
  return d == null ? null : `${d}/10`;
}

export function difficultyBand(value) {
  if (value == null) return "unrated";
  if (value <= 3) return "easy";
  if (value <= 6) return "moderate";
  if (value <= 8) return "hard";
  return "very-hard";
}

export const DIFFICULTY_BANDS = [
  ["easy", "Easy (1–3)"],
  ["moderate", "Moderate (4–6)"],
  ["hard", "Hard (7–8)"],
  ["very-hard", "Very hard (9–10)"],
  ["unrated", "Not yet rated"],
];

export function statusBadge(game) {
  if (game.demo) return `<span class="badge badge--accent">${icons.info}Fictional demo</span>`;
  if (game.status === "in-progress") return `<span class="badge badge--muted">Guide in progress</span>`;
  return "";
}

export function gamePath(slug) {
  return `games/${slug}.html`;
}
