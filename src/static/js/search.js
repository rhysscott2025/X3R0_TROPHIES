// Site-wide search across guides and trophies. The index is a small JSON file
// written by the build and fetched the first time search opens.

import { qs, qsa, escapeHtml, normalise, debounce, siteRoot, openDialog, closeDialog, plural } from "./lib/dom.js";

const GRADE_LABEL = { platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze" };
const CUP = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5.2H4.6v1.6A3.6 3.6 0 0 0 8.2 10.4M17 5.2h2.4v1.6a3.6 3.6 0 0 1-3.6 3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 3h10v6a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M11 13.4h2v4.2h-2z" fill="currentColor"/><path d="M7.5 18h9a.5.5 0 0 1 .5.5V21H7v-2.5a.5.5 0 0 1 .5-.5z" fill="currentColor"/></svg>';
const PAD = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 9v4M5 11h4M15 10h.01M17.5 12.5h.01M6.5 6h11a4 4 0 0 1 4 4.5l-.7 5a3 3 0 0 1-5.3 1.5L14 15h-4l-1.5 2a3 3 0 0 1-5.3-1.5l-.7-5A4 4 0 0 1 6.5 6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const MAX_TROPHIES = 30;

let index = null;
let loading = null;

function loadIndex() {
  if (index) return Promise.resolve(index);
  if (!loading) {
    loading = fetch(`${siteRoot()}search-index.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        index = {
          games: data.games.map((g) => ({ ...g, hay: normalise(`${g.t} ${g.e}`) })),
          trophies: data.trophies.map((t) => ({ ...t, hay: normalise(t.n), dhay: normalise(t.d) })),
        };
        return index;
      })
      .catch((err) => {
        loading = null;
        throw err;
      });
  }
  return loading;
}

/** Lower score = better match; Infinity = no match. */
function rank(query, terms, hay, extra = "") {
  if (hay.startsWith(query)) return 0;
  if (hay.includes(query)) return 1;
  if (terms.every((t) => hay.includes(t))) return 2;
  if (extra && terms.every((t) => hay.includes(t) || extra.includes(t))) return 3;
  return Infinity;
}

function search(rawQuery) {
  const query = normalise(rawQuery);
  const terms = query.split(/\s+/).filter(Boolean);
  if (!terms.length) return { games: index.games.slice(0, 8), trophies: [], empty: true };
  const games = index.games
    .map((g) => ({ g, s: rank(query, terms, g.hay) }))
    .filter((x) => x.s < Infinity)
    .sort((a, b) => a.s - b.s || a.g.t.localeCompare(b.g.t))
    .map((x) => x.g);
  const trophies = index.trophies
    .map((t) => ({ t, s: rank(query, terms, t.hay, t.dhay) }))
    .filter((x) => x.s < Infinity)
    .sort((a, b) => a.s - b.s || a.t.n.localeCompare(b.t.n))
    .map((x) => x.t);
  return { games, trophies, empty: false };
}

function hit(href, icon, title, meta, cls = "") {
  return `<li><a class="search-hit" href="${escapeHtml(href)}">${icon ? `<span class="${cls}">${icon}</span>` : ""}<span class="search-hit-text"><span class="search-hit-title">${escapeHtml(title)}</span><span class="search-hit-meta">${escapeHtml(meta)}</span></span></a></li>`;
}

function render(results, container, status, rawQuery) {
  const root = siteRoot();
  const parts = [];
  if (results.games.length) {
    parts.push(`<div class="search-group"><h3>${results.empty ? "All guides" : "Guides"}</h3><ul>${results.games
      .map((g) => hit(root + g.u, PAD, g.t, g.d ? `${g.e} (fictional demo)` : g.e, "search-hit-icon"))
      .join("")}</ul></div>`);
  }
  if (results.trophies.length) {
    const shown = results.trophies.slice(0, MAX_TROPHIES);
    parts.push(`<div class="search-group"><h3>Trophies</h3><ul>${shown
      .map((t) => {
        const game = index.games[t.g];
        const meta = [game ? game.t : "", GRADE_LABEL[t.r], t.m ? "Missable" : ""].filter(Boolean).join(", ");
        return hit(root + t.u, CUP, t.n, meta, `grade grade--${t.r}`);
      })
      .join("")}</ul></div>`);
  }
  container.innerHTML = parts.join("");

  if (results.empty) {
    status.textContent = index.games.length ? "Type a game or trophy name." : "No guides are published yet.";
  } else if (!results.games.length && !results.trophies.length) {
    status.textContent = `No matches for "${rawQuery.trim()}". Try fewer words or check the spelling.`;
  } else {
    const more = results.trophies.length > MAX_TROPHIES ? ` Showing the first ${MAX_TROPHIES} trophies.` : "";
    const found = [
      results.games.length && plural(results.games.length, "guide"),
      results.trophies.length && plural(results.trophies.length, "trophy", "trophies"),
    ].filter(Boolean).join(" and ");
    const n = results.games.length + results.trophies.length;
    status.textContent = `${found} ${n === 1 ? "matches" : "match"}.${more}`;
  }
}

function isTyping(el) {
  return el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export function initSearch() {
  const dialog = qs("#site-search");
  const input = qs("#site-search-input");
  const results = qs("#site-search-results");
  const status = qs("#site-search-status");
  if (!dialog || !input || !results || !status) return;

  const run = () => {
    if (!index) return;
    render(search(input.value), results, status, input.value);
  };

  const open = async () => {
    openDialog(dialog);
    input.focus();
    input.select();
    if (!index) {
      status.textContent = "Loading search…";
      try {
        await loadIndex();
      } catch {
        status.textContent = "Search couldn't load. Check your connection and try again.";
        return;
      }
    }
    run();
  };

  for (const trigger of qsa("[data-open-search]")) {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (dialog.open) return;
    const slash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey;
    const cmdK = (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
    if ((slash && !isTyping(document.activeElement)) || cmdK) {
      e.preventDefault();
      open();
    }
  });

  input.addEventListener("input", debounce(run, 80));

  input.addEventListener("keydown", (e) => {
    const hits = qsa(".search-hit", results);
    if (e.key === "ArrowDown" && hits.length) {
      e.preventDefault();
      hits[0].focus();
    } else if (e.key === "Enter" && hits.length) {
      e.preventDefault();
      hits[0].click();
    }
  });

  results.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const hits = qsa(".search-hit", results);
    const i = hits.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    if (e.key === "ArrowDown") hits[Math.min(i + 1, hits.length - 1)].focus();
    else if (i === 0) input.focus();
    else hits[i - 1].focus();
  });

  // Close after choosing a result, so in-page jumps land on a visible page.
  results.addEventListener("click", (e) => {
    if (e.target.closest(".search-hit")) closeDialog(dialog);
  });

  qs("[data-close-search]", dialog)?.addEventListener("click", () => closeDialog(dialog));
}
