/**
 * Serves the exported `out/` directory the way GitHub Pages does.
 *
 * Mounts the site under its base path and falls back to `404.html`, so the
 * preview matches production instead of the root-served default of most static
 * servers (which would make every asset URL look broken).
 *
 * Usage:
 *   npm run preview:static
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(root, "out");
const PORT = Number(process.env.PORT ?? 4173);
const BASE_PATH = (
  process.env.GITHUB_PAGES_BASE_PATH ?? "/austin-arena-ganeshotsav-2026"
).replace(/\/$/, "");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2",
};

if (!fs.existsSync(OUT_DIR)) {
  console.error("No out/ directory found. Run `npm run build:static` first.");
  process.exit(1);
}

function send(response, status, body, contentType) {
  response.writeHead(status, { "Content-Type": contentType });
  response.end(body);
}

function resolveFile(urlPath) {
  const candidates = [
    path.join(OUT_DIR, urlPath),
    path.join(OUT_DIR, `${urlPath}.html`),
    path.join(OUT_DIR, urlPath, "index.html"),
  ];

  for (const candidate of candidates) {
    // Block path traversal outside the export directory.
    if (!candidate.startsWith(OUT_DIR)) continue;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

const server = http.createServer((request, response) => {
  const { pathname } = new URL(request.url, `http://localhost:${PORT}`);

  // Mirror GitHub Pages: anything outside the base path does not exist.
  if (BASE_PATH && !pathname.startsWith(`${BASE_PATH}/`) && pathname !== BASE_PATH) {
    if (pathname === "/") {
      response.writeHead(302, { Location: `${BASE_PATH}/` });
      response.end();
      return;
    }
    send(response, 404, "Not found (outside base path)", "text/plain; charset=utf-8");
    return;
  }

  const relative = decodeURIComponent(pathname.slice(BASE_PATH.length)) || "/";
  const file = resolveFile(relative);

  if (!file) {
    const notFound = path.join(OUT_DIR, "404.html");
    if (fs.existsSync(notFound)) {
      send(response, 404, fs.readFileSync(notFound), MIME[".html"]);
      return;
    }
    send(response, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  send(response, 200, fs.readFileSync(file), MIME[path.extname(file)] ?? "application/octet-stream");
});

server.listen(PORT, () => {
  console.log(`Static preview: http://localhost:${PORT}${BASE_PATH}/`);
});

