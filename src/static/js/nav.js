// Header menu, back-to-top button and shared dialog behaviour.

import { qs, qsa, closeDialog } from "./lib/dom.js";

function initMenu() {
  const button = qs("[data-menu-toggle]");
  const nav = qs("#site-nav");
  if (!button || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
  };

  button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target) && !button.contains(e.target)) setOpen(false);
  });
  window.matchMedia("(min-width: 48rem)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
}

function initToTop() {
  const link = qs("[data-to-top]");
  if (!link) return;
  let ticking = false;
  const update = () => {
    link.classList.toggle("is-visible", window.scrollY > 900);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
  link.addEventListener("click", () => {
    // Move keyboard focus back to the top of the page as well as scrolling.
    const main = qs("#main");
    setTimeout(() => main?.focus({ preventScroll: true }), 0);
  });
}

function initDialogs() {
  for (const btn of qsa("[data-close-dialog]")) {
    btn.addEventListener("click", () => closeDialog(btn.closest("dialog")));
  }
  for (const dialog of qsa("dialog")) {
    // A click whose target is the <dialog> itself landed on the backdrop.
    dialog.addEventListener("click", (e) => { if (e.target === dialog) closeDialog(dialog); });
  }
}

export function initNav() {
  initMenu();
  initToTop();
  initDialogs();
}
