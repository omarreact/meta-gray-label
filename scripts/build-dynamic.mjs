#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist/public");
if (!out.startsWith(root + sep)) throw new Error("Unsafe output directory");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const copy = (source, target = source) => {
  const from = resolve(root, source);
  const to = resolve(out, target);
  if (!existsSync(from)) throw new Error("Missing dynamic asset: " + source);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
};

for (const path of ["assets", "media", "data/content.json", "header.html", "footer.html", "index.html",
  "services.html", "solutions/index.html", "insights/index.html", "contact/index.html", "robots.txt"]) {
  copy(path);
}
writeFileSync(resolve(out, ".nojekyll"), "", "utf8");
console.log("DYNAMIC ASSET BUILD PASS: shared assets + 4 special HTML templates; structured inner routes are rendered at the edge.");
