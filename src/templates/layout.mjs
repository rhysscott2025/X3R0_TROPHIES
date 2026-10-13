// Page shell: <head>, header, search dialog and footer shared by every page.

import { esc, extLink } from "./util.mjs";
import { icons } from "./icons.mjs";

/** Absolute URL for a site path when site.url is configured, otherwise null. */
export function absUrl(site, sitePath) {
  if (!site.url) return null;
  const base = site.url.endsWith("/") ? site.url : `${site.url}/`;
  return new URL(sitePath.replace(/^\//, ""), base).href;
}

export function wordmark(root, { tag = "a" } = {}) {
  const inner = '<span class="wordmark-code" aria-hidden="true">X3R<span class="ring"></span></span><span class="wordmark-sub" aria-hidden="true">TROPHIES</span>';
  return tag === "a"
    ? `<a class="wordmark" href="${root}index.html" aria-label="X3R0 TROPHIES home">${inner}</a>`
    : `<span class="wordmark" role="img" aria-label="X3R0 TROPHIES">${inner}</span>`;
}

function header(root, current) {
  const cur = (name) => (current === name ? ' aria-current="page"' : "");
  return `<header class="site-header">
  <div class="wrap header-inner">
    ${wordmark(root)}
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul>
        <li><a href="${root}index.html"${cur("home")}>Home</a></li>
        <li><a href="${root}index.html#library"${cur("guides")}>Guides</a></li>
        <li><a href="${root}about.html"${cur("about")}>About</a></li>
      </ul>
    </nav>
    <div class="header-actions">
      <a class="icon-btn search-btn" href="${root}index.html#library" data-open-search aria-label="Search games and trophies">${icons.search}<span class="search-btn-label" aria-hidden="true">Search</span><kbd aria-hidden="true">/</kbd></a>
      <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" data-menu-toggle>${icons.menu}<span class="sr-only">Menu</span></button>
    </div>
  </div>
</header>`;
}

function searchDialog() {
  return `<dialog class="search-dialog" id="site-search" aria-label="Search games and trophies" data-js-only>
  <div class="search-field" role="search">
    ${icons.search}
    <label for="site-search-input" class="sr-only">Search games and trophies</label>
    <input id="site-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search games and trophies" aria-describedby="site-search-status">
    <button type="button" class="search-close" data-close-search>Close</button>
  </div>
  <p class="search-status" id="site-search-status" aria-live="polite"></p>
  <div class="search-results" id="site-search-results"></div>
</dialog>`;
}

function footer(site, root) {
  const report = site.repository
    ? `<li>${extLink(`${site.repository.replace(/\/$/, "")}/issues`, "Report a problem")}</li>`
    : "";
  return `<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">
      ${wordmark(root)}
      <p>${esc(site.description)}</p>
    </div>
    <nav class="footer-nav" aria-label="Footer">
      <ul>
        <li><a href="${root}index.html#library">All guides</a></li>
        <li><a href="${root}about.html">About and disclaimers</a></li>
        <li><a href="${root}about.html#progress">How your progress is saved</a></li>
        <li><a href="${root}about.html#images">Images and credits</a></li>
        ${report}
      </ul>
    </nav>
    <div>
      <p>Trophies you tick are saved in this browser only. No account, no tracking.</p>
    </div>
    <div class="footer-legal">
      <p>X3R0 TROPHIES is an independent fan project. It isn't affiliated with or endorsed by Sony Interactive Entertainment or any game developer or publisher. PlayStation is a trademark of Sony Interactive Entertainment. Game names, trophy names and artwork belong to their owners.</p>
      <p>Every image is credited directly underneath it. Guides list their sources at the bottom of each page.</p>
    </div>
  </div>
</footer>`;
}

/**
 * Full HTML document.
 * root: relative path back to the site root ("" or "../").
 */
export function documentShell({ site, root, current, title, description, sitePath, version, bodyAttrs = "", content, extraBody = "", ogImagePath = "assets/og-default.png", noindex = false }) {
  const canonical = absUrl(site, sitePath);
  const ogImage = absUrl(site, ogImagePath);
  const v = `?v=${version}`;
  return `<!doctype html>
<html lang="${esc(site.language || "en")}" class="no-js" data-root="${root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0b0d13">
<meta name="color-scheme" content="dark">
${noindex ? '<meta name="robots" content="noindex">\n' : ""}${canonical ? `<link rel="canonical" href="${esc(canonical)}">\n<meta property="og:url" content="${esc(canonical)}">\n` : ""}<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n` : ""}<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${root}assets/apple-touch-icon.png">
<link rel="preload" href="${root}assets/fonts/archivo-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}css/site.css${v}">
<script>document.documentElement.classList.replace("no-js", "js");</script>
<script type="module" src="${root}js/main.js${v}"></script>
</head>
<body ${bodyAttrs}>
<a class="skip-link" href="#main">Skip to content</a>
<span id="top"></span>
${header(root, current)}
<main id="main" tabindex="-1">
${content}
</main>
${footer(site, root)}
${searchDialog()}
${extraBody}
</body>
</html>
`;
}
