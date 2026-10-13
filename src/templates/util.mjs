// Small, pure helpers shared by every template.

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text for safe use in HTML content and attribute values. */
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
}

/** Joins template parts, dropping null/false/undefined. */
export function html(parts) {
  return parts.filter((p) => p !== null && p !== undefined && p !== false).join("");
}

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** 2026-10-13 -> 13 Oct 2026 (no time-zone surprises). */
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return esc(iso);
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export const EXT_SR = '<span class="sr-only"> (opens in a new tab)</span>';

/** An external link that opens in a new tab and says so to screen readers. */
export function extLink(url, label, cls = "") {
  return `<a href="${esc(url)}"${cls ? ` class="${cls}"` : ""} target="_blank" rel="noopener">${label}${EXT_SR}</a>`;
}

/**
 * Inline markup for guide text. Text is escaped first, then three small forms
 * are converted:
 *   **bold**            -> <strong>
 *   [label](https://…)  -> external link   ([label](#anchor) for in-page links)
 *   [[trophy-id]]       -> link to that trophy's entry, showing its name
 */
export function inline(text, ctx = {}) {
  let s = esc(text);
  s = s.replace(/\[\[([a-z0-9-]+)\]\]/g, (match, id) => {
    const t = ctx.trophyById?.get(id);
    return t ? `<a class="t-ref" href="#t-${id}">${esc(t.name)}</a>` : match;
  });
  s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|#)[^\s)]+)\)/g, (match, label, url) =>
    url.startsWith("#") ? `<a href="${url}">${label}</a>` : `<a href="${url}" target="_blank" rel="noopener">${label}${EXT_SR}</a>`
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return s;
}

/** Renders a string or list of strings as paragraphs. */
export function paragraphs(value, ctx) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map((p) => `<p>${inline(p, ctx)}</p>`).join("");
}

/** Plain text version (for meta descriptions and search). */
export function plain(text) {
  return String(text ?? "")
    .replace(/\[\[([a-z0-9-]+)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text, max) {
  const t = plain(text);
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
