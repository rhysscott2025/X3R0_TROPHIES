// Entry point. Shared behaviour loads on every page; page-specific modules
// load only where they're needed. The pages work without any of this: it
// adds search, filters, the checklist and saved progress on top.

import { initNav } from "./nav.js";
import { initSearch } from "./search.js";

function report(err) {
  console.error("X3R0 TROPHIES: a page feature failed to start.", err);
}

try {
  initNav();
  initSearch();
} catch (err) {
  report(err);
}

const page = document.body.dataset.page;
if (page === "home") import("./home.js").then((m) => m.initHome()).catch(report);
if (page === "game") import("./game.js").then((m) => m.initGame()).catch(report);
