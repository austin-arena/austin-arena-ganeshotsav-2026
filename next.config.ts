import type { NextConfig } from "next";

/**
 * The project supports two deployment targets:
 *
 * - **Vercel (default)** — server rendering, ISR and API routes.
 * - **GitHub Pages** — a fully static export (`out/`), no server.
 *
 * Set `GITHUB_PAGES=true` to build the static variant.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";

/**
 * Project Pages are served from `https://<user>.github.io/<repo>/`, so assets
 * need a base path. Set `GITHUB_PAGES_BASE_PATH=""` when deploying to a user
 * or custom-domain site served from the root.
 */
const basePath = isGithubPages
  ? (process.env.GITHUB_PAGES_BASE_PATH ?? "/austin-arena-ganeshotsav-2026")
  : "";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  ...(isGithubPages
    ? {
        // Emit plain HTML/CSS/JS into `out/`.
        output: "export" as const,
        basePath,
        // Directory-style URLs so `/events` resolves to `/events/index.html`.
        trailingSlash: true,
        images: {
          // GitHub Pages cannot run the Next.js image optimizer.
          unoptimized: true,
          dangerouslyAllowSVG: true,
        },
      }
    : {
        images: {
          // Local SVG assets (logo, motifs, ornaments) are trusted, first-party files.
          dangerouslyAllowSVG: true,
          contentDispositionType: "inline",
          contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
          formats: ["image/avif", "image/webp"],
        },
        // Custom headers require a server, so they are skipped on GitHub Pages.
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "SAMEORIGIN" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
              ],
            },
          ];
        },
      }),

  env: {
    // Exposed to the client so components can prefix non-Next asset URLs.
    NEXT_PUBLIC_BASE_PATH: basePath,
    // Lets the registration form know there is no API route to post to.
    NEXT_PUBLIC_STATIC_EXPORT: isGithubPages ? "true" : "",
  },
};

export default config;
