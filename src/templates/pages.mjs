// About page and 404 page.

import { esc, extLink } from "./util.mjs";
import { documentShell } from "./layout.mjs";

export function renderAbout({ site, version }) {
  const report = site.repository
    ? `<p>Spotted a mistake? ${extLink(`${site.repository.replace(/\/$/, "")}/issues`, "Report it on GitHub")} with the game, the trophy and what you saw in-game.</p>`
    : "";
  const content = `<div class="wrap prose-page">
  <article class="prose">
    <h1>About ${esc(site.name)}</h1>
    <p class="lede">${esc(site.description)}</p>

    <h2 id="how">How the guides are put together</h2>
    <p>Each guide covers one game on a named platform and edition, because PS4 and PS5 versions, remasters and regional releases can have different trophy lists. Where a list differs, the guide says which one it covers.</p>
    <p>Trophy names, descriptions and grades come from the game's official list. Requirements, missable trophies and collectible counts are checked against established trophy guides, game wikis and developer notes, and every guide lists its sources at the bottom with the date they were checked.</p>
    <p>The Platinum Route puts trophies in the order you should earn them: missables before their point of no return, collectibles before you leave an area for good, and repeatable tasks saved for the post-game.</p>
    <p>Anything that hasn't been checked against a source is labelled <strong>unverified</strong>, and a guide that isn't finished is labelled <strong>in progress</strong>. Times and difficulty ratings are shown only when they come from a source; otherwise they read "not yet researched".</p>

    <h2 id="progress">How your progress is saved</h2>
    <p>When you tick a trophy, it's saved in your browser's local storage on this device. There's no account and nothing is sent to a server.</p>
    <ul>
      <li>Your ticks stay after you refresh or close the page, in the same browser on the same device.</li>
      <li>They don't sync between devices or browsers. Your phone and laptop keep separate checklists.</li>
      <li>Clearing your browser's site data, or browsing in a private window, removes them.</li>
      <li>Each game has its own checklist, and <strong>Reset progress</strong> on a guide clears only that game.</li>
    </ul>
    <p>The site doesn't use cookies, analytics or tracking scripts.</p>

    <h2 id="images">Images and credits</h2>
    <p>Images are used only when their source and permission are clear: official press kits and media whose terms allow this use, openly licensed images, and original screenshots and diagrams. Every image has a credit line directly underneath it naming the rights holder, the source and the licence.</p>
    <p>Where a suitable image isn't available yet, the guide shows a labelled placeholder describing the image that's needed. Game pages use original colour themes rather than copying game menus or logos.</p>

    <h2 id="disclaimer">Disclaimer</h2>
    <p>${esc(site.name)} is an independent fan project. It isn't affiliated with or endorsed by Sony Interactive Entertainment or any game developer or publisher. PlayStation is a trademark of Sony Interactive Entertainment. Game titles, trophy names and artwork belong to their respective owners.</p>
    <p>Games get patched, and patches sometimes change trophy requirements. Guides are checked carefully, but if something on screen doesn't match a guide, trust the game and back up your save before anything marked missable.</p>
    ${report}
  </article>
</div>`;
  return documentShell({
    site,
    root: "",
    current: "about",
    title: `About | ${site.name}`,
    description: `How ${site.name} researches its trophy guides, how your progress is saved, and how images are credited.`,
    sitePath: "about.html",
    version,
    bodyAttrs: 'data-page="about"',
    content,
  });
}

/**
 * GitHub Pages serves 404.html for any missing path, at any depth, so this
 * page links to everything from the site's base path (e.g. /x3r0-trophies/)
 * instead of relative paths.
 */
export function renderNotFound({ site, version, basePath }) {
  const content = `<div class="wrap not-found">
  <h1>Page not found</h1>
  <p>That address doesn't match a page on ${esc(site.name)}. The guide may have moved, or the link may have a typo.</p>
  <div class="actions">
    <a class="btn btn--metal" href="${esc(basePath)}index.html#library">Browse guides</a>
    <a class="btn" href="${esc(basePath)}index.html">Go to the home page</a>
  </div>
</div>`;
  return documentShell({
    site,
    root: basePath,
    current: "",
    title: `Page not found | ${site.name}`,
    description: "This page doesn't exist.",
    sitePath: "404.html",
    version,
    bodyAttrs: 'data-page="not-found"',
    content,
    noindex: true,
  });
}
