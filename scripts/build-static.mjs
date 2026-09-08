/**
 * Static export build for GitHub Pages.
 *
 * GitHub Pages serves plain files, so the Next.js route handlers under
 * `src/app/api` cannot be built (`output: "export"` rejects them). This script
 * temporarily moves that folder aside, runs the export, then always restores it
 * — even if the build fails or is interrupted.
 *
 * It also writes `.nojekyll`, without which GitHub Pages silently drops the
 * `_next/` directory and the site loads unstyled.
 *
 * Usage:
 *   npm run build:static
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const API_DIR = path.join(root, "src", "app", "api");
// Stashed outside `src/app`: Next routes any folder inside it, including
// dot-prefixed ones. Excluded from tsconfig so it is not type-checked either.
const API_STASH = path.join(root, ".api-routes-stash");
const OUT_DIR = path.join(root, "out");
const NEXT_DIR = path.join(root, ".next");

let stashed = false;

function stashApiRoutes() {
  if (fs.existsSync(API_STASH)) {
    // Left over from an interrupted run — restore it before starting.
    fs.rmSync(API_DIR, { recursive: true, force: true });
    fs.renameSync(API_STASH, API_DIR);
  }

  if (fs.existsSync(API_DIR)) {
    fs.renameSync(API_DIR, API_STASH);
    stashed = true;
    console.log("• API routes temporarily excluded from the static export");
  }
}

function restoreApiRoutes() {
  if (stashed && fs.existsSync(API_STASH)) {
    fs.rmSync(API_DIR, { recursive: true, force: true });
    fs.renameSync(API_STASH, API_DIR);
    stashed = false;
    console.log("• API routes restored");
  }
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.status}`);
  }
}

// Restore the folder even if the process is killed mid-build.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    restoreApiRoutes();
    process.exit(1);
  });
}

try {
  run("node", ["scripts/csv-to-json.mjs"]);

  // Start from a clean cache. Generated route types from the server build
  // reference the API folder that is about to be stashed, and `tsconfig.json`
  // type-checks them, so leaving them behind breaks the export.
  fs.rmSync(NEXT_DIR, { recursive: true, force: true });
  fs.rmSync(OUT_DIR, { recursive: true, force: true });

  stashApiRoutes();

  run("npx", ["next", "build"], { GITHUB_PAGES: "true" });

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
} finally {
  restoreApiRoutes();
}

