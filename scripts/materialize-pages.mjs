#!/usr/bin/env node
import { resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { materializeGitHubPages } from "./static-site-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const result = materializeGitHubPages({
  projectRoot: root,
  publicBase: process.env.PUBLIC_BASE_URL || "https://omarreact.github.io/meta-gray-label",
  basePath: process.env.BASE_PATH || "/meta-gray-label"
});
console.log(`GITHUB PAGES MATERIALIZE PASS: ${result.files.length} structured routes generated.`);
