// Home page: library filtering and sorting, plus each card's saved progress.

import { qs, qsa, normalise, debounce, plural } from "./lib/dom.js";
import { loadProgress } from "./lib/storage.js";

const num = (v) => (v === "" || v == null ? null : Number(v));

/** Numeric comparison that always puts missing values last. */
function compareNullLast(a, b, dir) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return (a - b) * dir;
}

const SORTS = {
  title: (a, b) => a.dataset.title.localeCompare(b.dataset.title),
  "title-desc": (a, b) => b.dataset.title.localeCompare(a.dataset.title),
  time: (a, b) => compareNullLast(num(a.dataset.hours), num(b.dataset.hours), 1) || SORTS.title(a, b),
  "time-desc": (a, b) => compareNullLast(num(a.dataset.hours), num(b.dataset.hours), -1) || SORTS.title(a, b),
  difficulty: (a, b) => compareNullLast(num(a.dataset.difficulty), num(b.dataset.difficulty), 1) || SORTS.title(a, b),
  updated: (a, b) => b.dataset.updated.localeCompare(a.dataset.updated) || SORTS.title(a, b),
};

function showCardProgress(cards) {
  for (const card of cards) {
    const box = qs("[data-card-progress]", card);
    if (!box) continue;
    const total = Number(card.dataset.total) || 0;
    const earned = Math.min(loadProgress(card.dataset.slug).size, total);
    box.hidden = earned === 0;
    if (!earned) continue;
    const pct = total ? Math.round((earned / total) * 100) : 0;
    qs(".meter > span", box).style.setProperty("--pct", `${pct}%`);
    qs("p", box).innerHTML = `Your progress: <strong>${earned} of ${total}</strong> earned (${pct}%)`;
  }
}

export function initHome() {
  const grid = qs("#lib-grid");
  if (!grid) return;
  const cards = qsa("[data-game-card]", grid);
  const form = qs("#lib-controls");
  const search = qs("#lib-search");
  const platform = qs("#lib-platform");
  const genre = qs("#lib-genre");
  const difficulty = qs("#lib-difficulty");
  const sort = qs("#lib-sort");
  const count = qs("#lib-count");
  const empty = qs("#lib-empty");

  showCardProgress(cards);
  window.addEventListener("storage", () => showCardProgress(cards));
  window.addEventListener("pageshow", (e) => { if (e.persisted) showCardProgress(cards); });

  if (!form) return;

  const apply = () => {
    const terms = normalise(search.value).split(/\s+/).filter(Boolean);
    const p = platform.value;
    const g = genre.value;
    const d = difficulty.value;
    let visible = 0;
    for (const card of cards) {
      const ok =
        terms.every((t) => card.dataset.search.includes(t)) &&
        (!p || card.dataset.platforms.split("|").includes(p)) &&
        (!g || card.dataset.genres.split("|").includes(g)) &&
        (!d || card.dataset.band === d);
      card.hidden = !ok;
      if (ok) visible += 1;
    }
    const sorter = SORTS[sort.value] || SORTS.title;
    for (const card of [...cards].sort(sorter)) grid.appendChild(card);

    count.textContent = visible === cards.length
      ? `Showing ${plural(visible, "guide")}`
      : `Showing ${visible} of ${plural(cards.length, "guide")}`;
    empty.hidden = visible > 0;
    grid.hidden = visible === 0;
  };

  search.addEventListener("input", debounce(apply, 100));
  for (const select of [platform, genre, difficulty, sort]) select.addEventListener("change", apply);
  form.addEventListener("submit", (e) => e.preventDefault());
  // "reset" fires before the fields are cleared, so re-filter on the next tick.
  form.addEventListener("reset", () => setTimeout(apply, 0));
  qs("[data-clear-filters]")?.addEventListener("click", () => {
    form.reset();
    setTimeout(() => { apply(); search.focus(); }, 0);
  });

  apply();
}
