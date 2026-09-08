/**
 * Verifies the exported `out/` directory is safe to publish on GitHub Pages.
 *
 * Checks that:
 *  - the expected entry points exist (including `.nojekyll` and `404.html`)
 *  - every internal reference is prefixed with the configured base path
 *  - every referenced local file is actually present in the export
 *
 * Usage:
 *   npm run verify:static
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(root, "out");
const BASE_PATH = (
  process.env.GITHUB_PAGES_BASE_PATH ?? "/austin-arena-ganeshotsav-2026"
).replace(/\/$/, "");

const REQUIRED_FILES = [
  ".nojekyll",
  "404.html",
  "index.html",
  "events/index.html",
  "sitemap.xml",
  "robots.txt",
];

const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

if (!fs.existsSync(OUT_DIR)) {
  console.error("✗ No out/ directory. Run `npm run build:static` first.");
  process.exit(1);
}

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(OUT_DIR, file))) {
    fail(`Missing required file: ${file}`);
  }
}

/** Collects every `src="…"` / `href="…"` that points at this site. */
function collectRefs(html) {
  return [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((match) => match[1]);
}

const htmlFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) htmlFiles.push(full);
  }
})(OUT_DIR);

let checkedRefs = 0;

for (const file of htmlFiles) {
  const relativeName = path.relative(OUT_DIR, file);
  const html = fs.readFileSync(file, "utf8");

  for (const ref of new Set(collectRefs(html))) {
    checkedRefs += 1;

    if (BASE_PATH && !ref.startsWith(`${BASE_PATH}/`) && ref !== BASE_PATH) {
      fail(`${relativeName}: reference is missing the base path → ${ref}`);
      continue;
    }

    // Confirm the file exists in the export (ignore anchors and queries).
    const cleaned = ref.slice(BASE_PATH.length).split(/[?#]/)[0];
    if (!cleaned || cleaned === "/") continue;

    const target = path.join(OUT_DIR, cleaned);
    const exists =
      fs.existsSync(target) ||
      fs.existsSync(`${target}.html`) ||
      fs.existsSync(path.join(target, "index.html"));

    if (!exists) {
      fail(`${relativeName}: referenced file not found in export → ${ref}`);
    }
  }
}

// The CSS mandala pattern is injected as a custom property on <html>.
const home = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf8");
if (!home.includes(`--pattern-mandala:url(&quot;${BASE_PATH}/pattern-mandala.svg`)) {
  notes.push("Background pattern custom property was not found with the base path.");
}

if (fs.existsSync(path.join(OUT_DIR, "api"))) {
  fail("An `api/` directory was exported — route handlers cannot run on GitHub Pages.");
}

console.log(`Checked ${htmlFiles.length} HTML files and ${checkedRefs} references.`);
notes.forEach((note) => console.warn(`! ${note}`));

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} problem(s) found:`);
  failures.forEach((message) => console.error(`  - ${message}`));
  process.exit(1);
}

console.log(`✓ Export looks correct for GitHub Pages (base path: ${BASE_PATH || "root"}).`);

