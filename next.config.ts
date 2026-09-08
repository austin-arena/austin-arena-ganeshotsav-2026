import type { NextConfig } from "next";

/**
 * The site is deployed as a fully static export to GitHub Pages — there is no
 * server, so events are read at build time and refreshed in the browser on
 * every page load.
 *
 * Project Pages are served from `https://<user>.github.io/<repo>/`, so assets
 * need a base path. Set `GITHUB_PAGES_BASE_PATH=""` when deploying to a user or
 * custom-domain site served from the root.
 */
const basePath = process.env.GITHUB_PAGES_BASE_PATH ?? "/austin-arena-ganeshotsav-2026";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Emit plain HTML/CSS/JS into `out/`.
  output: "export",
  basePath,
  // Directory-style URLs so `/events` resolves to `/events/index.html`.
  trailingSlash: true,
  images: {
    // GitHub Pages cannot run the Next.js image optimizer.
    unoptimized: true,
    dangerouslyAllowSVG: true,
  },

  env: {
    // Exposed to the client so components can prefix non-Next asset URLs.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default config;
