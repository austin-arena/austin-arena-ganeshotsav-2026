/**
 * Static export build for GitHub Pages.
 *
 * Runs the CSV → JSON snapshot, produces the static `out/` export, and writes
 * `.nojekyll` (without which GitHub Pages silently drops the `_next/` directory
 * and the site loads unstyled).
 *
 * Usage:
 *   npm run build:static
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const OUT_DIR = path.join(root, "out");
const NEXT_DIR = path.join(root, ".next");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env },
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.status}`);
  }
}

run("node", ["scripts/csv-to-json.mjs"]);

// Start from a clean cache so stale route types never leak into the export.
fs.rmSync(NEXT_DIR, { recursive: true, force: true });
fs.rmSync(OUT_DIR, { recursive: true, force: true });

run("npx", ["next", "build"]);

if (!fs.existsSync(OUT_DIR)) {
  throw new Error("Expected an `out/` directory after the export.");
}

// Stop GitHub Pages' Jekyll pipeline from ignoring `_next/`.
fs.writeFileSync(path.join(OUT_DIR, ".nojekyll"), "");

// GitHub Pages serves 404.html for unknown paths; Next emits it from
// `not-found.tsx`. Warn if that ever stops happening.
if (!fs.existsSync(path.join(OUT_DIR, "404.html"))) {
  console.warn("! 404.html was not generated — custom not-found page will not be served.");
}

const basePath = process.env.GITHUB_PAGES_BASE_PATH ?? "/austin-arena-ganeshotsav-2026";

console.log("\n✓ Static site exported to out/");
console.log(`  base path: ${basePath || "(root)"}`);
console.log("  next step: npm run deploy");

