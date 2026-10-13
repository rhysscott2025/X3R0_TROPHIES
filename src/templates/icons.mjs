// Inline SVG icons. All original drawings; they inherit currentColor.

const svg = (body, extra = "") =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"${extra}>${body}</svg>`;

const stroke = (d) =>
  svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);

/** Trophy cup. The Platinum cup carries a cut gem so grade isn't shown by colour alone. */
export function cup(grade) {
  const handles = '<path d="M7 5.2H4.6v1.6A3.6 3.6 0 0 0 8.2 10.4M17 5.2h2.4v1.6a3.6 3.6 0 0 1-3.6 3.6" fill="none" stroke="currentColor" stroke-width="1.6"/>';
  const bowl = '<path d="M7 3h10v6a5 5 0 0 1-10 0z" fill="currentColor"/>';
  const stem = '<path d="M11 13.4h2v4.2h-2z" fill="currentColor"/><path d="M7.5 18h9a.5.5 0 0 1 .5.5V21H7v-2.5a.5.5 0 0 1 .5-.5z" fill="currentColor"/>';
  const gem = grade === "platinum" ? '<path d="M12 4.6l2.4 2.9L12 10.6 9.6 7.5z" fill="#000" fill-opacity=".55"/>' : "";
  const ring = grade === "gold" ? '<circle cx="12" cy="7.4" r="1.7" fill="#000" fill-opacity=".55"/>' : "";
  return svg(handles + bowl + stem + gem + ring);
}

export const icons = {
  search: stroke("M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16 16l5 5"),
  menu: stroke("M4 7h16M4 12h16M4 17h16"),
  close: stroke("M6 6l12 12M18 6L6 18"),
  check: stroke("M5 12.5l4.5 4.5L19 7.5"),
  warning: svg('<path d="M12 3.5l9.5 16.5h-19z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.3" r="1.2" fill="currentColor"/>'),
  info: svg('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.6" r="1.2" fill="currentColor"/>'),
  eye: stroke("M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"),
  image: stroke("M4 5h16v14H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17M15.5 9.5h.01"),
  arrowUp: stroke("M12 19V5M5.5 11.5L12 5l6.5 6.5"),
  list: stroke("M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"),
  reset: stroke("M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"),
  game: stroke("M7 9v4M5 11h4M15 10h.01M17.5 12.5h.01M6.5 6h11a4 4 0 0 1 4 4.5l-.7 5a3 3 0 0 1-5.3 1.5L14 15h-4l-1.5 2a3 3 0 0 1-5.3-1.5l-.7-5A4 4 0 0 1 6.5 6z"),
  external: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', ' class="ext"'),
};
