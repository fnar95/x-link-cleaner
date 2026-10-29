// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages build (`bun run build:gh-pages`): the site is served as static files from
// https://fnar95.github.io/x-link-cleaner/, so it needs the repo sub-path as its base and
// the single page prerendered to plain HTML. Normal builds (Lovable hosting) are unchanged.
const isGitHubPages = process.env["GITHUB_PAGES"] === "true";
const GITHUB_PAGES_BASE = "/x-link-cleaner/";

export default defineConfig(
  isGitHubPages
    ? {
        vite: { base: GITHUB_PAGES_BASE },
        tanstackStart: {
          pages: [{ path: "/" }],
          prerender: {
            enabled: true,
            autoStaticPathsDiscovery: false,
            crawlLinks: false,
          },
        },
        // GitHub Pages serves static files only; do not build a server bundle.
        nitro: false,
      }
    : {
        tanstackStart: {
          // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
          // nitro/vite builds from this
          server: { entry: "server" },
        },
      },
);
