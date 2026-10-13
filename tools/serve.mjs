#!/usr/bin/env node
// Serves the built site locally for previewing.
//
//   node tools/serve.mjs [--port 8080] [--dir _site]
//
// Serves 404.html for missing pages, like GitHub Pages does.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d; };
const port = Number(arg("--port", 8080));
const dir = path.resolve(ROOT, arg("--dir", "_site"));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

async function resolveFile(urlPath) {
  let p = path.join(dir, decodeURIComponent(urlPath.split("?")[0]));
  if (!p.startsWith(dir)) return null;
  try {
    const s = await stat(p);
    if (s.isDirectory()) p = path.join(p, "index.html");
    await stat(p);
    return p;
  } catch {
    try { await stat(`${p}.html`); return `${p}.html`; } catch { return null; }
  }
}

createServer(async (req, res) => {
  const file = await resolveFile(req.url);
  if (!file) {
    // Like GitHub Pages: a project site under /repo/ uses its own 404.html.
    const first = decodeURIComponent(req.url).split("/").filter(Boolean)[0] || "";
    const page = await readFile(path.join(dir, first, "404.html")).catch(() => readFile(path.join(dir, "404.html"))).catch(() => "Not found");
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    res.end(page);
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
  res.end(await readFile(file));
}).listen(port, () => console.log(`Serving ${path.relative(ROOT, dir)}/ at http://localhost:${port}/  (Ctrl+C to stop)`));
