// Guide page: trophy checklist, saved progress, filters, contents and reset.

import { qs, qsa, normalise, debounce, plural, openDialog, closeDialog } from "./lib/dom.js";
import { loadProgress, saveProgress, clearProgress, storageAvailable, progressKey, loadPref, savePref } from "./lib/storage.js";

const GRADES = ["platinum", "gold", "silver", "bronze"];

function setAll(selector, fn) {
  for (const el of qsa(selector)) fn(el);
}

/** Moves focus to an in-page target after a jump, without a second scroll. */
function focusTarget(hash) {
  const target = hash && document.getElementById(hash.slice(1));
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

export function initGame() {
  const slug = document.body.dataset.game;
  const entries = qsa("article.trophy[data-trophy]");
  if (!slug || !entries.length) return;

  const trophies = entries.map((el) => ({
    id: el.dataset.trophy,
    el,
    item: el.closest("li"),
    box: qs(".trophy-check", el),
    grade: el.dataset.grade,
    stage: el.dataset.stage,
    scope: el.dataset.scope,
    missable: el.dataset.missable === "true",
    name: el.dataset.name,
    search: el.dataset.search,
  }));
  const byId = new Map(trophies.map((t) => [t.id, t]));
  let earned = loadProgress(slug, new Set(byId.keys()));

  const status = qs("#progress-status");
  const announce = (msg) => {
    if (!status) return;
    status.textContent = "";
    // A fresh text node each time so screen readers repeat identical messages.
    requestAnimationFrame(() => { status.textContent = msg; });
  };

  if (!storageAvailable()) setAll("[data-storage-warning]", (el) => { el.hidden = false; });

  /* ---------------------------------------------------- progress display */

  const tally = (key) => {
    const totals = new Map();
    const done = new Map();
    for (const t of trophies) {
      totals.set(t[key], (totals.get(t[key]) || 0) + 1);
      if (earned.has(t.id)) done.set(t[key], (done.get(t[key]) || 0) + 1);
    }
    return { totals, done };
  };
  const pctOf = (n, total) => (total ? Math.floor((n / total) * 100) : 0);

  function render() {
    for (const t of trophies) {
      const on = earned.has(t.id);
      t.box.checked = on;
      t.el.classList.toggle("is-earned", on);
    }
    setAll("[data-chip]", (el) => el.classList.toggle("is-earned", earned.has(el.dataset.chip)));
    setAll("[data-missable-item]", (el) => el.classList.toggle("is-earned", earned.has(el.dataset.missableItem)));

    const total = trophies.length;
    const done = earned.size;
    const pct = pctOf(done, total);
    setAll('[data-count="earned"]', (el) => { el.textContent = done; });
    setAll('[data-count="remaining"]', (el) => { el.textContent = total - done; });
    setAll('[data-count="percent"]', (el) => { el.textContent = pct; });
    setAll("[data-ring-fill]", (el) => { el.style.strokeDashoffset = String(100 - pct); });
    setAll("[data-overall-meter]", (el) => el.style.setProperty("--pct", `${pct}%`));

    const grades = tally("grade");
    for (const g of GRADES) {
      const n = grades.done.get(g) || 0;
      setAll(`[data-grade-earned="${g}"]`, (el) => { el.textContent = n; });
      setAll(`[data-grade-meter="${g}"]`, (el) => el.style.setProperty("--pct", `${pctOf(n, grades.totals.get(g))}%`));
    }

    const scopes = tally("scope");
    for (const [scope] of scopes.totals) {
      setAll(`[data-scope-earned="${scope}"]`, (el) => { el.textContent = scopes.done.get(scope) || 0; });
    }

    const stages = tally("stage");
    for (const [stage, stageTotal] of stages.totals) {
      const n = stages.done.get(stage) || 0;
      const p = pctOf(n, stageTotal);
      setAll(`[data-stage-count="${stage}"]`, (el) => {
        el.textContent = el.dataset.format === "short" ? `${n}/${stageTotal}` : `${n} of ${stageTotal}`;
      });
      setAll(`[data-stage-meter="${stage}"]`, (el) => el.style.setProperty("--pct", `${p}%`));
      setAll(`[data-stage-ring="${stage}"]`, (el) => el.style.setProperty("--p", `${p}%`));
      setAll(`[data-route-stage="${stage}"]`, (el) => el.classList.toggle("is-done", n === stageTotal));
    }
  }

  /* ---------------------------------------------------- filters */

  const filterForm = qs("#wt-tools");
  const searchInput = qs("#wt-search");
  const show = qs("#wt-show");
  const compact = qs("#wt-compact");
  const count = qs("#wt-count");
  const main = qs("[data-game-main]");

  function applyFilter() {
    if (!searchInput || !show) return;
    const terms = normalise(searchInput.value).split(/\s+/).filter(Boolean);
    const mode = show.value;
    let visible = 0;
    for (const t of trophies) {
      const on = earned.has(t.id);
      const ok =
        terms.every((x) => t.search.includes(x)) &&
        (mode === "all" ||
          (mode === "earned" && on) ||
          (mode === "unearned" && !on) ||
          (mode === "missable" && t.missable));
      t.item.hidden = !ok;
      if (ok) visible += 1;
    }
    for (const section of qsa("[data-stage-section]")) {
      const items = qsa(".trophy-list > li", section);
      const msg = qs("[data-stage-empty]", section);
      if (msg) msg.hidden = !items.length || items.some((li) => !li.hidden);
    }
    const filtering = terms.length > 0 || mode !== "all";
    if (count) count.textContent = filtering ? `Showing ${visible} of ${plural(trophies.length, "trophy", "trophies")}.` : "";
  }

  if (filterForm) {
    filterForm.addEventListener("submit", (e) => e.preventDefault());
    searchInput.addEventListener("input", debounce(applyFilter, 100));
    show.addEventListener("change", applyFilter);
    const startCompact = Boolean(loadPref("compact", false));
    compact.checked = startCompact;
    main?.classList.toggle("is-compact", startCompact);
    compact.addEventListener("change", () => {
      main?.classList.toggle("is-compact", compact.checked);
      savePref("compact", compact.checked);
    });
  }

  /* ---------------------------------------------------- ticking trophies */

  for (const t of trophies) {
    t.box.disabled = false;
    t.box.addEventListener("change", () => {
      if (t.box.checked) earned.add(t.id);
      else earned.delete(t.id);
      const saved = saveProgress(slug, earned);
      render();

      const index = trophies.indexOf(t);
      applyFilter();
      if (t.item.hidden) {
        // The ticked trophy was filtered out; keep keyboard focus nearby.
        const next = trophies.slice(index + 1).find((x) => !x.item.hidden) || trophies.slice(0, index).reverse().find((x) => !x.item.hidden);
        (next ? next.box : searchInput)?.focus();
      }

      const verb = t.box.checked ? "marked as earned" : "unticked";
      const note = saved ? "" : " Not saved: this browser is blocking storage.";
      announce(`${t.name} ${verb}. ${earned.size} of ${trophies.length} trophies earned.${note}`);
    });
  }

  /* ---------------------------------------------------- reset */

  const resetDialog = qs("#reset-dialog");
  const resetOpen = qs("#reset-open");
  resetOpen?.addEventListener("click", () => openDialog(resetDialog));
  qs("#reset-confirm")?.addEventListener("click", () => {
    earned = new Set();
    clearProgress(slug);
    render();
    applyFilter();
    closeDialog(resetDialog);
    resetOpen?.focus();
    announce(`Progress reset. 0 of ${trophies.length} trophies earned.`);
  });

  /* ---------------------------------------------------- contents */

  const tocDialog = qs("#toc-dialog");
  qs("#toc-open")?.addEventListener("click", () => openDialog(tocDialog));
  tocDialog?.addEventListener("click", (e) => {
    const link = e.target.closest("a[href^='#']");
    if (!link) return;
    e.preventDefault();
    const hash = link.getAttribute("href");
    closeDialog(tocDialog);
    history.pushState(null, "", hash);
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    focusTarget(hash);
  });

  // Keep keyboard focus with in-page jumps from the route and stage links.
  document.addEventListener("click", (e) => {
    const link = e.target.closest("main a[href^='#']");
    if (link && link.getAttribute("href").length > 1) setTimeout(() => focusTarget(link.getAttribute("href")), 0);
  });

  // Highlight the section currently on screen in the contents.
  const tocLinks = qsa("[data-toc-link]");
  const targets = [...new Set(tocLinks.map((a) => a.getAttribute("href")))]
    .map((h) => document.getElementById(h.slice(1)))
    .filter(Boolean)
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  let ticking = false;
  const spy = () => {
    ticking = false;
    const line = window.innerHeight * 0.3;
    let current = targets[0];
    for (const el of targets) if (el.getBoundingClientRect().top <= line) current = el;
    for (const a of tocLinks) a.classList.toggle("is-current", a.getAttribute("href") === `#${current?.id}`);
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(spy); }
  }, { passive: true });
  spy();

  /* ---------------------------------------------------- other tabs */

  window.addEventListener("storage", (e) => {
    if (e.key !== null && e.key !== progressKey(slug)) return;
    earned = loadProgress(slug, new Set(byId.keys()));
    render();
    applyFilter();
  });

  render();
  applyFilter();
}
