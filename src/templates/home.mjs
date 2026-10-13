// Home page: hero, guide library with search/filter/sort, how it works, recently updated.

import { esc, plural, formatDate, plain } from "./util.mjs";
import { icons } from "./icons.mjs";
import { documentShell } from "./layout.mjs";
import {
  gradeCounts, themeStyle, patternClass, statValue, hoursText, difficultyText,
  difficultyBand, DIFFICULTY_BANDS, statusBadge, gamePath, imageSrc, attribution,
} from "./parts.mjs";

/** Longer titles get a smaller typographic cover so they stay legible. */
function coverTitleSize(title) {
  const max = title.length > 22 ? 2.3 : title.length > 14 ? 2.8 : 3.4;
  return `font-size:clamp(2rem, 9vw, ${max}rem)`;
}

function cover(game) {
  const img = game.theme.coverImage ? game.imageById.get(game.theme.coverImage) : null;
  const badge = statusBadge(game);
  const badgeHtml = badge ? `<div class="cover-badge">${badge}</div>` : "";
  if (img && !img.placeholder) {
    return `<div class="game-card-cover">
  <div class="cover"><img src="${esc(imageSrc(img.src, ""))}" width="${img.width}" height="${img.height}" alt="${esc(img.alt)}" loading="lazy" decoding="async"></div>
  ${badgeHtml}
</div>`;
  }
  return `<div class="game-card-cover">
  <div class="cover themed ${patternClass(game)}" aria-hidden="true"><span class="cover-title" style="${coverTitleSize(game.title)}">${esc(game.title)}</span></div>
  ${badgeHtml}
</div>`;
}

function card(game) {
  const d = game.stats.difficulty?.value ?? null;
  const hoursMin = game.stats.hours?.min ?? "";
  const searchText = [game.title, game.edition, game.developer, game.publisher, ...game.genres, ...game.platforms]
    .filter(Boolean).join(" ").toLowerCase();
  const coverImg = game.theme.coverImage ? game.imageById.get(game.theme.coverImage) : null;
  const dlcNote = game.counts.dlcTotal ? `<small>plus ${game.counts.dlcTotal} DLC</small>` : "";
  const edition = [game.edition, game.releaseYear].filter(Boolean).join(", ");

  return `<li data-game-card
  data-slug="${esc(game.slug)}"
  data-title="${esc(game.title.toLowerCase())}"
  data-platforms="${esc(game.platforms.join("|"))}"
  data-genres="${esc(game.genres.join("|"))}"
  data-band="${difficultyBand(d)}"
  data-difficulty="${d ?? ""}"
  data-hours="${hoursMin}"
  data-updated="${esc(game.lastUpdated)}"
  data-total="${game.counts.all.total}"
  data-search="${esc(searchText)}">
<article class="case game-card" style="${themeStyle(game)}">
  ${cover(game)}
  <div class="game-card-body">
    ${coverImg && !coverImg.placeholder ? attribution(coverImg.credit) : ""}
    <div>
      <h3><a href="${gamePath(game.slug)}">${esc(game.title)}</a></h3>
      <p class="game-card-edition">${esc(game.platforms.join(" and "))}${edition ? `, ${esc(edition)}` : ""}</p>
    </div>
    <p class="game-card-summary">${esc(plain(game.summary))}</p>
    <dl class="spec">
      <div><dt>Trophies</dt><dd>${game.counts.base.total}${dlcNote}</dd></div>
      <div><dt>Platinum</dt><dd>${game.hasPlatinum ? "Yes" : "No"}</dd></div>
      <div><dt>Time to Platinum</dt><dd>${statValue(game, game.stats.hours, hoursText(game))}</dd></div>
      <div><dt>Difficulty</dt><dd>${statValue(game, game.stats.difficulty, difficultyText(game))}</dd></div>
    </dl>
    ${gradeCounts(game.counts.base)}
    <div class="card-progress" data-card-progress hidden>
      <div class="meter" aria-hidden="true"><span></span></div>
      <p></p>
    </div>
  </div>
</article>
</li>`;
}

function controls(games) {
  const platforms = [...new Set(games.flatMap((g) => g.platforms))].sort();
  const genres = [...new Set(games.flatMap((g) => g.genres))].sort((a, b) => a.localeCompare(b));
  const usedBands = new Set(games.map((g) => difficultyBand(g.stats.difficulty?.value ?? null)));
  const opt = (value, label) => `<option value="${esc(value)}">${esc(label)}</option>`;
  return `<form class="case lib-controls" id="lib-controls" data-js-only>
  <div class="field field--search">
    <label for="lib-search">Filter guides</label>
    <div class="input-with-icon">${icons.search}<input class="input" id="lib-search" type="search" autocomplete="off" placeholder="Game title, developer or genre"></div>
  </div>
  <div class="field">
    <label for="lib-platform">Platform</label>
    <select class="select" id="lib-platform">${opt("", "All platforms")}${platforms.map((p) => opt(p, p)).join("")}</select>
  </div>
  <div class="field">
    <label for="lib-genre">Genre</label>
    <select class="select" id="lib-genre">${opt("", "All genres")}${genres.map((g) => opt(g, g)).join("")}</select>
  </div>
  <div class="field">
    <label for="lib-difficulty">Platinum difficulty</label>
    <select class="select" id="lib-difficulty">${opt("", "Any difficulty")}${DIFFICULTY_BANDS.filter(([v]) => usedBands.has(v)).map(([v, l]) => opt(v, l)).join("")}</select>
  </div>
  <div class="field field--sort">
    <label for="lib-sort">Sort by</label>
    <select class="select" id="lib-sort">
      ${opt("title", "Title, A to Z")}
      ${opt("title-desc", "Title, Z to A")}
      ${opt("time", "Shortest Platinum first")}
      ${opt("time-desc", "Longest Platinum first")}
      ${opt("difficulty", "Easiest first")}
      ${opt("updated", "Recently updated")}
    </select>
  </div>
  <button class="btn btn--quiet btn--small lib-clear" type="reset" id="lib-clear">Clear filters</button>
</form>`;
}

function library(games) {
  if (games.length === 0) {
    return `<section id="library" class="wrap library" aria-labelledby="library-title">
  <div class="section-head"><h2 id="library-title">Guide library</h2></div>
  <div class="case lib-empty">
    <h3>No guides published yet</h3>
    <p>The first guides are being researched. Each one will appear here with its trophy count, time to Platinum and difficulty.</p>
  </div>
</section>`;
  }
  const sorted = [...games].sort((a, b) => a.title.localeCompare(b.title));
  return `<section id="library" class="wrap library" aria-labelledby="library-title">
  <div class="section-head">
    <h2 id="library-title">Guide library</h2>
    <p>Pick a game to see its Platinum Route, missable warnings and full trophy checklist.</p>
  </div>
  ${controls(games)}
  <p class="lib-count" id="lib-count" aria-live="polite" data-js-only>Showing ${plural(games.length, "guide")}</p>
  <ul class="lib-grid" id="lib-grid">
    ${sorted.map(card).join("\n")}
  </ul>
  <div class="case lib-empty" id="lib-empty" hidden>
    <h3>No guides match those filters</h3>
    <p>Try a different title or clear the filters to see every guide.</p>
    <button class="btn btn--small" type="button" data-clear-filters>Clear filters</button>
  </div>
</section>`;
}

function howItWorks() {
  const steps = [
    ["Follow the Platinum Route", "Every guide opens with the order to play, stage by stage, so story trophies, collectibles and side content land together and you don't backtrack."],
    ["Clear missables in time", "Missable trophies are flagged in red, and the route warns you before any choice or area you can't come back to."],
    ["Tick trophies as they pop", "Your checklist saves in this browser, so you can close the page and pick up where you left off. No account needed."],
    ["Clean up and earn the Platinum", "Leftovers are grouped for the post-game, with chapter select and New Game Plus advice where the game has them."],
  ];
  const items = steps.map(([title, text], i) => `<li class="how-step">
    <div class="how-ring" aria-hidden="true"><span class="ring ring--ghost"></span><span class="ring" style="--p:${(i + 1) * 25}%"></span><b>${i + 1}</b></div>
    <div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>
  </li>`);
  return `<section class="wrap how" aria-labelledby="how-title">
  <div class="section-head"><h2 id="how-title">How each guide works</h2></div>
  <ol class="how-steps">${items.join("")}</ol>
</section>`;
}

function recent(games) {
  if (games.length < 2) return "";
  const list = [...games].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).slice(0, 5);
  return `<section class="wrap recent" aria-labelledby="recent-title">
  <div class="section-head"><h2 id="recent-title">Recently updated</h2></div>
  <ul class="recent-list">
    ${list.map((g) => `<li class="recent-item"><a href="${gamePath(g.slug)}">${esc(g.title)}</a><time datetime="${esc(g.lastUpdated)}">${formatDate(g.lastUpdated)}</time></li>`).join("")}
  </ul>
</section>`;
}

function hero(site, games) {
  const real = games.filter((g) => !g.demo);
  const trophies = real.reduce((n, g) => n + g.counts.all.total, 0);
  const tally = real.length
    ? `<strong>${plural(real.length, "guide")}</strong> covering <strong>${plural(trophies, "trophy", "trophies")}</strong> so far.`
    : games.length
      ? "The first guides are being researched. Until they're published, a fictional demo guide shows how each one works."
      : "The first guides are being researched.";
  return `<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-inner">
    <h1 id="hero-title" class="hero-mark">
      <span class="sr-only">X3R0 TROPHIES</span>
      <span class="hero-code" aria-hidden="true">X3R<span class="ring-stack"><span class="ring ring--ghost"></span><span class="ring ring--fill"></span></span></span>
      <span class="hero-sub" aria-hidden="true">TROPHIES</span>
    </h1>
    <div class="hero-copy">
      <p class="hero-tagline">${esc(site.tagline)}</p>
      <p class="hero-intro">Step-by-step trophy guides that put every trophy in the order you should earn it, warn you before anything becomes missable, and keep a checklist of what you've already unlocked.</p>
      <p class="hero-tally">${tally}</p>
    </div>
    <div class="hero-actions">
      <a class="search-trigger" href="#library" data-open-search>${icons.search}<span>Search games and trophies</span><kbd aria-hidden="true">/</kbd></a>
      <a class="btn btn--metal" href="#library">Browse guides</a>
    </div>
  </div>
</section>`;
}

export function renderHome({ site, games, version }) {
  const content = [hero(site, games), library(games), howItWorks(), recent(games)].join("\n");
  return documentShell({
    site,
    root: "",
    current: "home",
    title: site.name,
    description: site.description,
    sitePath: "",
    version,
    bodyAttrs: 'data-page="home"',
    content,
  });
}
