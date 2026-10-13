// Checks every internal link, image and #anchor in the built site.
// Our own generated HTML is regular, so simple patterns are enough here.

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const idCache = new Map();
async function idsIn(file) {
  if (!idCache.has(file)) {
    const text = await readFile(file, "utf8");
    idCache.set(file, new Set([...text.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

export async function checkLinks(outDir, basePath = "/") {
  idCache.clear();
  const files = (await walk(outDir)).filter((f) => f.endsWith(".html"));
  const problems = [];
  let checked = 0;

  for (const file of files) {
    const text = await readFile(file, "utf8");
    const rel = path.relative(outDir, file);
    for (const m of text.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const raw = m[1].replace(/&amp;/g, "&");
      if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(raw)) continue;
      checked += 1;
      const [pathPart, fragment] = raw.split("#");
      const cleanPath = pathPart.split("?")[0];
      let target;
      if (!cleanPath) target = file;
      else if (cleanPath.startsWith("/")) {
        const inside = cleanPath.startsWith(basePath) ? cleanPath.slice(basePath.length) : cleanPath.slice(1);
        target = path.join(outDir, inside);
      } else target = path.resolve(path.dirname(file), cleanPath);
      if (target.endsWith(path.sep) || (existsSync(target) && (await stat(target)).isDirectory())) target = path.join(target, "index.html");
      if (!existsSync(target)) {
        problems.push(`${rel}: link to "${raw}" points at a missing file.`);
        continue;
      }
      if (fragment && target.endsWith(".html")) {
        const ids = await idsIn(target);
        if (!ids.has(fragment)) problems.push(`${rel}: link to "${raw}" points at a missing #${fragment}.`);
      }
    }
    // Duplicate ids break anchors and labels
    const seen = new Set();
    for (const m of text.matchAll(/\sid="([^"]+)"/g)) {
      if (seen.has(m[1])) problems.push(`${rel}: id "${m[1]}" is used more than once.`);
      seen.add(m[1]);
    }
  }
  return { problems, checked, pages: files.length };
}
