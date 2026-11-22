#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { buildStaticSite, normalizeBasePath, normalizePublicBase } from "./static-site-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicBase = normalizePublicBase(process.env.PUBLIC_BASE_URL || "https://omarreact.github.io/meta-gray-label");
const inferredPath = new URL(publicBase).pathname.replace(/\/$/, "");
const basePath = normalizeBasePath(process.env.BASE_PATH ?? inferredPath);
const result = buildStaticSite({
  projectRoot: root,
  outRoot: resolve(root, "dist/public"),
  publicBase,
  basePath
});
console.log(`STATIC BUILD PASS: ${result.generatedCount} structured routes + special pages; base=${result.publicBase}; path=${result.basePath || "/"}`);
