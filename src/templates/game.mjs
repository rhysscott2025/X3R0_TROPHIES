// Guide page for one game: hero, progress, Platinum Route, missables,
// walkthrough stages with trophy entries, DLC and references.

import { esc, html, inline, paragraphs, plural, formatDate, plain, truncate, extLink } from "./util.mjs";
import { cup, icons } from "./icons.mjs";
import { documentShell } from "./layout.mjs";
import {
  gradeMark, gradeCounts, figure, themeStyle, patternClass, statValue, hoursText,
  difficultyText, statusBadge, attribution, imageSrc,
} from "./parts.mjs";
import { GRADES, GRADE_LABEL, TAGS } from "../../tools/lib/model.mjs";

const ROOT = "../";

/* ---------------------------------------------------------------- hero */

function facts(game) {
  const s = game.stats;
  const dlc = game.counts.dlcTotal ? `<small>plus ${plural(game.counts.dlcTotal, "DLC trophy", "DLC trophies")}</small>` : "";
  const missables = game.missables.length;
  const onlineText = s.online?.value == null ? null : s.online.value ? "Required" : "None";
  const playText = s.playthroughs?.value == null ? null : String(s.playthroughs.value);
  const rows = [
    ["Trophies", `${game.counts.base.total}${dlc}`],
    ["Platinum", game.hasPlatinum ? "Yes" : "No"],
    ["Time to Platinum", statValue(game, s.hours, hoursText(game))],
    ["Difficulty", statValue(game, s.difficulty, difficultyText(game))],
    ["Playthroughs", statValue(game, s.playthroughs, playText), s.playthroughs?.note],
    ["Missable trophies", missables ? `<a href="#missables">${missables}</a>` : "None"],
    ["Online", statValue(game, s.online, onlineText), s.online?.note],
  ];
  return `<dl class="spec">${rows.map(([k, v, note]) => `<div><dt>${k}</dt><dd>${v}</dd>${note ? `<dd class="spec-note">${inline(note, game)}</dd>` : ""}</div>`).join("")}</dl>`;
}

function hero(game) {
  const heroImg = game.theme.heroImage ? game.imageById.get(game.theme.heroImage) : null;
  const art = heroImg && !heroImg.placeholder
    ? `<div class="game-hero-art"><img src="${esc(imageSrc(heroImg.src, ROOT))}" width="${heroImg.width}" height="${heroImg.height}" alt="" fetchpriority="high"></div>`
    : "";
  const details = [
    game.edition,
    game.releaseYear,
    game.developer && game.publisher && game.developer !== game.publisher ? `${game.developer} / ${game.publisher}` : game.developer || game.publisher,
    game.genres.join(", "),
  ].filter(Boolean);
  const badges = [
    ...game.platforms.map((p) => `<li><span class="badge">${esc(p)}</span></li>`),
    statusBadge(game) && `<li>${statusBadge(game)}</li>`,
  ].filter(Boolean);

  return `<section class="game-hero themed ${patternClass(game)}" id="overview" aria-labelledby="game-title">
  ${art}
  <div class="wrap game-hero-inner">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${ROOT}index.html#library">Guides</a></li><li aria-current="page">${esc(game.title)}</li></ol></nav>
    <div class="game-hero-head">
      <ul class="badges">${badges.join("")}</ul>
      <h1 class="game-title" id="game-title">${esc(game.title)}<span class="game-title-sub">Trophy guide and Platinum Route</span></h1>
      ${details.length ? `<p class="game-card-edition">${details.map(esc).join(", ")}</p>` : ""}
      <div class="game-intro">${paragraphs(game.intro, game)}</div>
    </div>
    <div class="case game-facts">${facts(game)}</div>
    ${heroImg && !heroImg.placeholder ? `<div class="hero-credit">${attribution(heroImg.credit)}</div>` : ""}
  </div>
</section>`;
}

/* ---------------------------------------------------------------- notices */

function notices(game) {
  const out = [];
  if (game.demo) {
    out.push(`<div class="notice notice--accent">${icons.info}<div><strong>This is a fictional demo guide</strong>It shows how a X3R0 guide works. The game, trophies and locations are made up. To hide it, set <code>showDemo</code> to false in <code>data/site.json</code>.</div></div>`);
  } else if (game.status === "in-progress") {
    out.push(`<div class="notice">${icons.info}<div><strong>This guide is still being written</strong>Some trophies may not have full steps or sources yet. Anything not checked against a source is labelled unverified.</div></div>`);
  }
  if (game.listNote) out.push(`<div class="notice">${icons.info}<div><strong>Which trophy list this covers</strong>${inline(game.listNote, game)}</div></div>`);
  if (game.missables.length) {
    out.push(`<div class="notice notice--alert">${icons.warning}<div><strong>${plural(game.missables.length, "missable trophy", "missable trophies")}</strong>Read the <a href="#missables">missable list</a> before you start. The route warns you before each point of no return.</div></div>`);
  }
  return out.length ? `<div class="game-notices">${out.join("")}</div>` : "";
}

/* ---------------------------------------------------------------- progress */

function ring() {
  return `<div class="pring" aria-hidden="true">
  <svg viewBox="0 0 120 120"><circle class="pring-track" cx="60" cy="60" r="52" fill="none" stroke-width="10"/><circle class="pring-fill" data-ring-fill cx="60" cy="60" r="52" fill="none" stroke-width="10" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>
  <div class="pring-label"><span class="pring-value"><span data-count="percent">0</span>%</span><span class="pring-caption">earned</span></div>
</div>`;
}

function progressPanel(game) {
  const all = game.counts.all;
  const gradeRows = GRADES.filter((g) => all[g] > 0).map((g) => `<div class="grade-row">
    <dt>${gradeMark(g)}</dt>
    <dd><div class="meter meter--${g}" aria-hidden="true"><span data-grade-meter="${g}"></span></div></dd>
    <dd><span data-grade-earned="${g}">0</span>/${all[g]}</dd>
  </div>`).join("");
  const scopes = [
    `<p><strong data-scope-earned="base">0</strong> of ${game.counts.base.total} base-game trophies${game.hasPlatinum ? ", which is what the Platinum needs" : ""}.</p>`,
    ...game.dlc.map((d) => `<p><strong data-scope-earned="${esc(d.id)}">0</strong> of ${game.counts.dlc[d.id].total} from ${esc(d.title)} (DLC).</p>`),
  ].join("");
  return `<section id="progress" class="case progress-panel" aria-labelledby="progress-title">
  <div class="progress-head">
    <h2 id="progress-title">Your progress</h2>
    <button class="btn btn--quiet btn--small" type="button" id="reset-open" data-js-only>${icons.reset}Reset progress</button>
  </div>
  <div class="progress-body">
    ${ring()}
    <div class="progress-lines">
      <p><strong data-count="earned">0</strong> of <strong>${all.total}</strong> trophies earned, <strong data-count="remaining">${all.total}</strong> to go.</p>
      ${game.dlc.length ? scopes : ""}
      <dl class="grade-rows">${gradeRows}</dl>
    </div>
  </div>
  <p class="progress-note" data-js-only>Ticks are saved in this browser only. They won't sync to your other devices, and clearing this site's data erases them.</p>
  <div class="notice notice--alert" data-storage-warning hidden>${icons.warning}<div><strong>Your progress can't be saved</strong>This browser is blocking storage for this site, for example in a private window. You can still tick trophies, but they'll be cleared when you leave.</div></div>
  <p class="progress-note" data-no-js-only>Turn on JavaScript to tick off trophies and save your progress.</p>
  <p class="sr-only" aria-live="polite" id="progress-status"></p>
</section>`;
}

/* ---------------------------------------------------------------- route */

function chip(t) {
  return `<li><a class="chip${t.missable ? " chip--missable" : ""}" href="#t-${t.id}" data-chip="${t.id}">${cup(t.grade)}<span class="chip-name">${esc(t.name)}</span><span class="sr-only">, ${GRADE_LABEL[t.grade]}${t.missable ? ", missable" : ""}</span><span class="chip-check">${icons.check}<span class="sr-only">, earned</span></span></a></li>`;
}

function routeStage(stage, n, game) {
  const trophies = stage.trophies.map((id) => game.trophyById.get(id)).filter(Boolean);
  return `<li class="route-stage" data-route-stage="${stage.id}">
  <div class="route-marker" aria-hidden="true"><span class="ring ring--ghost"></span><span class="ring" data-stage-ring="${stage.id}" style="--p:0%"></span><b>${n}</b></div>
  <div class="route-body">
    <h3><a href="#s-${stage.id}">${esc(stage.title)}</a></h3>
    ${stage.summary ? `<p class="route-summary">${inline(stage.summary, game)}</p>` : ""}
    ${stage.steps.length ? `<ol class="route-steps">${stage.steps.map((s) => `<li>${inline(s, game)}</li>`).join("")}</ol>` : ""}
    ${stage.warning ? `<div class="notice notice--alert">${icons.warning}<div>${inline(stage.warning, game)}</div></div>` : ""}
    ${trophies.length ? `<div class="route-foot"><ul class="chips" aria-label="Trophies in this stage">${trophies.map(chip).join("")}</ul></div>
    <p class="route-count"><span data-stage-count="${stage.id}" data-format="long">0 of ${trophies.length}</span> earned</p>` : ""}
  </div>
</li>`;
}

function route(game) {
  return `<section id="route" aria-labelledby="route-title">
  <div class="section-head">
    <h2 id="route-title">Platinum Route</h2>
    <p>The order to play for the fewest playthroughs and no missed trophies. Each stage links to its full walkthrough below.</p>
  </div>
  <ol class="route-list">${game.baseStages.map((s, i) => routeStage(s, i + 1, game)).join("")}</ol>
</section>`;
}

/* ---------------------------------------------------------------- missables */

function missables(game) {
  if (!game.missables.length) return "";
  const items = game.missables.map(({ trophy: t, stage }) => `<li class="case missable-item" data-missable-item="${t.id}">
    <div class="missable-item-head"><a href="#t-${t.id}">${esc(t.name)}</a>${gradeMark(t.grade)}</div>
    <p class="missable-where">${esc(stage.title)}</p>
    ${t.missableNote ? `<p>${inline(t.missableNote, game)}</p>` : ""}
  </li>`).join("");
  return `<section id="missables" aria-labelledby="missables-title">
  <div class="section-head">
    <h2 id="missables-title">Missable trophies</h2>
    <p>Earn these before the point of no return in their stage. Each note says exactly when the trophy is lost.</p>
  </div>
  <ul class="missable-list">${items}</ul>
</section>`;
}

/* ---------------------------------------------------------------- trophies */

function list(items, ctx) {
  return `<ul>${items.map((i) => `<li>${inline(i, ctx)}</li>`).join("")}</ul>`;
}

function trophyEntry(t, stage, game) {
  const ctx = game;
  const badges = [];
  if (t.missable) badges.push(`<li><span class="badge badge--alert">${icons.warning}Missable</span></li>`);
  for (const tag of t.tags || []) badges.push(`<li><span class="badge">${esc(TAGS[tag] || tag)}</span></li>`);
  if (t.afterStory === true) badges.push(`<li><span class="badge badge--muted">Can be earned after the credits</span></li>`);
  if (t.afterStory === false && !t.missable) badges.push(`<li><span class="badge badge--muted">Earn before the credits</span></li>`);
  if (!game.demo && !(t.sources || []).length) badges.push(`<li><span class="badge badge--muted">Unverified</span></li>`);

  const desc = t.hidden
    ? `<details class="spoiler"><summary>${icons.eye}Hidden trophy: show description</summary><div><p class="trophy-desc"><span class="trophy-desc-label">In-game description</span>${esc(t.description)}</p></div></details>`
    : `<p class="trophy-desc"><span class="trophy-desc-label">In-game description</span>${esc(t.description)}</p>`;

  const factRows = html([
    t.where && `<div><dt>Where</dt><dd>${inline(t.where, ctx)}</dd></div>`,
    t.when && `<div><dt>Best time to get it</dt><dd>${inline(t.when, ctx)}</dd></div>`,
    t.prerequisites?.length && `<div class="span-2"><dt>You'll need</dt><dd>${list(t.prerequisites, ctx)}</dd></div>`,
  ]);

  const steps = (t.steps || []).map((s) => {
    const text = typeof s === "string" ? s : s.text;
    const img = typeof s === "object" && s.image ? figure(game.imageById.get(s.image), { root: ROOT, ctx }) : "";
    return `<li><div><p>${inline(text, ctx)}</p>${img}</div></li>`;
  }).join("");

  const extraImages = (t.images || []).map((id) => figure(game.imageById.get(id), { root: ROOT, ctx })).join("");
  const icon = t.icon ? game.imageById.get(t.icon) : null;
  const sources = (t.sources || []).map((id) => game.sourceById.get(id)).filter(Boolean);
  const search = [t.name, t.description, t.where, ...(t.tags || []).map((x) => TAGS[x] || x), GRADE_LABEL[t.grade]]
    .filter(Boolean).map(plain).join(" ").toLowerCase();

  return `<li>
<article class="case trophy" id="t-${t.id}" aria-labelledby="t-${t.id}-name"
  data-trophy="${t.id}" data-grade="${t.grade}" data-stage="${stage.id}" data-scope="${t.dlc || "base"}"
  data-missable="${t.missable ? "true" : "false"}" data-name="${esc(t.name)}" data-search="${esc(search)}">
  <div class="trophy-head">
    <label class="trophy-check-wrap">
      <input type="checkbox" class="trophy-check" data-trophy="${t.id}" disabled>
      <span class="sr-only">Earned ${esc(t.name)}</span>
    </label>
    <div class="trophy-title">
      <h4 id="t-${t.id}-name">${esc(t.name)}</h4>
      <p class="trophy-meta">${gradeMark(t.grade)}<span class="earned-flag">${icons.check}Earned</span></p>
    </div>
    ${icon && !icon.placeholder ? `<div class="trophy-icon"><img src="${esc(imageSrc(icon.src, ROOT))}" width="${icon.width}" height="${icon.height}" alt="" loading="lazy"></div>` : ""}
  </div>
  ${desc}
  ${badges.length ? `<ul class="badges">${badges.join("")}</ul>` : ""}
  <div class="trophy-detail">
    ${factRows ? `<dl class="trophy-facts">${factRows}</dl>` : ""}
    ${t.unlock ? `<div class="trophy-section"><h5>How it unlocks</h5><p>${inline(t.unlock, ctx)}</p></div>` : ""}
    ${t.missable && t.missableNote ? `<div class="notice notice--alert">${icons.warning}<div><strong>When it's lost</strong>${inline(t.missableNote, ctx)}</div></div>` : ""}
    ${steps ? `<div class="trophy-section"><h5>Steps</h5><ol class="steps">${steps}</ol></div>` : ""}
    ${extraImages}
    ${t.tips?.length ? `<div class="trophy-section"><h5>Tips</h5>${list(t.tips, ctx)}</div>` : ""}
    ${t.mistakes?.length ? `<div class="trophy-section trophy-section--mistakes"><h5>Common mistakes</h5>${list(t.mistakes, ctx)}</div>` : ""}
    ${sources.length
      ? `<p class="trophy-sources">Sources: ${sources.map((s) => extLink(s.url, esc(s.title))).join(", ")}</p>`
      : game.demo ? "" : `<p class="trophy-sources">No source recorded yet. Treat these steps as unverified.</p>`}
  </div>
</article>
</li>`;
}

/* ---------------------------------------------------------------- stages */

function stageSection(stage, n, total, group, game, prev, next, label) {
  const trophies = stage.trophies.map((id) => game.trophyById.get(id)).filter(Boolean);
  const prevLink = prev
    ? `<a href="#s-${prev.id}"><span>Previous stage</span><b>${esc(prev.title)}</b></a>`
    : `<a href="#route"><span>Back to</span><b>Platinum Route</b></a>`;
  const nextLink = next ? `<a class="stage-nav-next" href="#s-${next.id}"><span>Next stage</span><b>${esc(next.title)}</b></a>` : "";
  return `<section class="stage" id="s-${stage.id}" aria-labelledby="s-${stage.id}-title" data-stage-section="${stage.id}">
  <header class="stage-head">
    <p class="stage-kicker">${esc(label)} ${n} of ${total}</p>
    <h3 id="s-${stage.id}-title">${esc(stage.title)}</h3>
    ${stage.summary ? `<p>${inline(stage.summary, game)}</p>` : ""}
    ${trophies.length ? `<div class="stage-progress"><div class="meter" aria-hidden="true"><span data-stage-meter="${stage.id}"></span></div><span><span data-stage-count="${stage.id}" data-format="long">0 of ${trophies.length}</span> earned</span></div>` : ""}
  </header>
  ${stage.warning ? `<div class="notice notice--alert">${icons.warning}<div>${inline(stage.warning, game)}</div></div>` : ""}
  ${trophies.length
    ? `<ol class="trophy-list">${trophies.map((t) => trophyEntry(t, stage, game)).join("")}</ol>
  <p class="stage-empty" data-stage-empty hidden>No trophies in this stage match your filter.</p>`
    : `<p class="empty-note">No trophies unlock in this stage. Follow the route steps above.</p>`}
  <nav class="stage-nav" aria-label="Stages before and after ${esc(stage.title)}">${prevLink}${nextLink}</nav>
</section>`;
}

function walkthroughTools() {
  return `<form class="case wt-tools" id="wt-tools" data-js-only>
  <div class="wt-tools-row">
    <div class="field">
      <label for="wt-search">Find a trophy</label>
      <div class="input-with-icon">${icons.search}<input class="input" id="wt-search" type="search" autocomplete="off" placeholder="Name, description or location"></div>
    </div>
    <div class="field">
      <label for="wt-show">Show</label>
      <select class="select" id="wt-show">
        <option value="all">All trophies</option>
        <option value="unearned">Not earned yet</option>
        <option value="earned">Earned</option>
        <option value="missable">Missable only</option>
      </select>
    </div>
  </div>
  <label class="switch" for="wt-compact"><input type="checkbox" id="wt-compact">Compact list (names and grades only)</label>
</form>
<p class="wt-count" id="wt-count" aria-live="polite" data-js-only></p>`;
}

function walkthrough(game) {
  const stages = game.baseStages;
  return `<section id="walkthrough" aria-labelledby="walkthrough-title">
  <div class="section-head">
    <h2 id="walkthrough-title">Trophy walkthrough</h2>
    <p>Every trophy in the order of the Platinum Route, with full steps. Tick each one as it unlocks.</p>
  </div>
  ${walkthroughTools()}
  <div class="stages">
    ${stages.map((s, i) => stageSection(s, i + 1, stages.length, "base", game, stages[i - 1], stages[i + 1], "Stage")).join("\n")}
  </div>
</section>`;
}

function dlcSections(game) {
  return game.dlcGroups.filter((g) => g.stages.length).map(({ dlc, stages }) => `<section id="dlc-${dlc.id}" aria-labelledby="dlc-${dlc.id}-title">
  <div class="case dlc-head">
    <span class="badge badge--muted">DLC</span>
    <h2 id="dlc-${dlc.id}-title">${esc(dlc.title)}</h2>
    ${gradeCounts(game.counts.dlc[dlc.id])}
    ${dlc.note ? `<p>${inline(dlc.note, game)}</p>` : ""}
  </div>
  <div class="stages" style="margin-top:var(--space-6)">
    ${stages.map((s, i) => stageSection(s, i + 1, stages.length, dlc.id, game, stages[i - 1], stages[i + 1], `${dlc.title} stage`)).join("\n")}
  </div>
</section>`).join("\n");
}

/* ---------------------------------------------------------------- references */

function references(game) {
  const srcs = game.sources;
  const imgs = game.images.filter((i) => !i.placeholder);
  const sourceList = srcs.length
    ? `<ol class="source-list">${srcs.map((s) => `<li>${extLink(s.url, esc(s.title))}<p>${esc(s.supports || "")}${s.checked ? ` Checked ${formatDate(s.checked)}.` : ""}</p></li>`).join("")}</ol>`
    : `<p class="empty-note">${game.demo ? "This demo guide is fictional, so it has no sources. Real guides list every source used, with what it supports and when it was checked." : "No sources recorded yet. Trophy details on this page are unverified."}</p>`;
  const credits = imgs.length
    ? `<h3>Images on this page</h3><ul class="credits-list">${imgs.map((i) => `<li>${esc(i.alt)} ${attribution(i.credit)}</li>`).join("")}</ul>`
    : "";
  return `<section id="sources" class="references" aria-labelledby="sources-title">
  <div class="section-head">
    <h2 id="sources-title">References</h2>
    <p>Last updated ${formatDate(game.lastUpdated)}.${game.sourcedCount && !game.demo ? ` ${game.sourcedCount} of ${game.trophies.length} trophies checked against at least one source.` : ""}</p>
  </div>
  ${sourceList}
  ${credits}
</section>`;
}

/* ---------------------------------------------------------------- contents */

function toc(game) {
  const stageLinks = (stages) => `<ol>${stages.map((s) => {
    const n = s.trophies.length;
    return `<li><a href="#s-${s.id}" data-toc-link><span>${esc(s.title)}</span>${n ? `<span class="toc-count"><span data-stage-count="${s.id}" data-format="short">0/${n}</span><span class="sr-only"> earned</span></span>` : ""}</a></li>`;
  }).join("")}</ol>`;
  return `<nav class="toc" aria-label="Guide contents">
  <ol>
    <li><a href="#overview" data-toc-link>Overview</a></li>
    <li><a href="#progress" data-toc-link>Your progress</a></li>
    <li><a href="#route" data-toc-link>Platinum Route</a></li>
    ${game.missables.length ? `<li><a href="#missables" data-toc-link><span>Missable trophies</span><span class="toc-count toc-count--alert">${game.missables.length}</span></a></li>` : ""}
    <li><a href="#walkthrough" data-toc-link>Trophy walkthrough</a>${stageLinks(game.baseStages)}</li>
    ${game.dlcGroups.filter((g) => g.stages.length).map(({ dlc, stages }) => `<li><a href="#dlc-${dlc.id}" data-toc-link>${esc(dlc.title)} (DLC)</a>${stageLinks(stages)}</li>`).join("")}
    <li><a href="#sources" data-toc-link>References</a></li>
  </ol>
</nav>`;
}

function tocProgress(game) {
  return `<div class="case toc-progress" data-js-only>
  <p><strong><span data-count="percent">0</span>%</strong> complete</p>
  <div class="meter" aria-hidden="true"><span data-overall-meter></span></div>
  <p><span data-count="earned">0</span> of ${game.counts.all.total} trophies</p>
</div>`;
}

function gameBar(game) {
  return `<div class="game-bar" data-js-only>
  <div class="wrap game-bar-inner">
    <div class="game-bar-progress">
      <span><strong><span data-count="percent">0</span>%</strong> of ${esc(game.title)}</span>
      <div class="meter" aria-hidden="true"><span data-overall-meter></span></div>
    </div>
    <button class="btn btn--small" type="button" id="toc-open" aria-haspopup="dialog">${icons.list}Contents</button>
  </div>
</div>`;
}

function dialogs(game) {
  return `<dialog class="toc-dialog" id="toc-dialog" aria-labelledby="toc-dialog-title">
  <div class="dialog-body">
    <div class="dialog-head"><h2 id="toc-dialog-title">Contents</h2><button class="icon-btn" type="button" data-close-dialog>${icons.close}<span class="sr-only">Close contents</span></button></div>
    ${toc(game)}
  </div>
</dialog>
<dialog id="reset-dialog" aria-labelledby="reset-title" aria-describedby="reset-desc">
  <div class="dialog-body">
    <h2 id="reset-title">Reset progress for ${esc(game.title)}?</h2>
    <p id="reset-desc">This clears every trophy you've ticked for this game in this browser. Other games aren't affected. You can't undo this.</p>
    <div class="dialog-actions">
      <button class="btn btn--small" type="button" data-close-dialog>Keep my progress</button>
      <button class="btn btn--small btn--danger" type="button" id="reset-confirm">Reset progress</button>
    </div>
  </div>
</dialog>`;
}

/* ---------------------------------------------------------------- page */

export function renderGame({ site, game, version }) {
  const content = `${hero(game)}
${gameBar(game)}
<div class="wrap game-layout">
  <aside class="toc-rail" aria-label="Guide contents">
    ${tocProgress(game)}
    ${toc(game)}
  </aside>
  <div class="game-main" data-game-main>
    ${notices(game)}
    ${progressPanel(game)}
    ${route(game)}
    ${missables(game)}
    ${walkthrough(game)}
    ${dlcSections(game)}
    ${references(game)}
  </div>
</div>
<a class="icon-btn to-top" href="#top" data-to-top>${icons.arrowUp}<span class="sr-only">Back to top</span></a>`;

  const description = truncate(
    `${game.title} trophy guide: all ${game.counts.base.total} trophies${game.hasPlatinum ? " including the Platinum" : ""} in route order, ${game.missables.length ? `${plural(game.missables.length, "missable")} flagged, ` : ""}with step-by-step instructions and a progress checklist. ${plain(game.summary)}`,
    158,
  );
  const ogImg = game.theme.coverImage ? game.imageById.get(game.theme.coverImage) : null;

  return documentShell({
    site,
    root: ROOT,
    current: "guides",
    title: `${game.title} Trophy Guide and Platinum Route | ${site.name}`,
    description,
    sitePath: `games/${game.slug}.html`,
    version,
    bodyAttrs: `data-page="game" data-game="${esc(game.slug)}" style="${themeStyle(game)}"`,
    content,
    extraBody: dialogs(game),
    ogImagePath: ogImg && !ogImg.placeholder && !/^https?:/.test(ogImg.src) ? ogImg.src : "assets/og-default.png",
    noindex: Boolean(game.demo),
  });
}
