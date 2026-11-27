import type { NextConfig } from "next"

export default {
  // Static HTML + RSC payloads for GitHub Pages.
  output: "export",
  // Emit dir/index.html so GitHub Pages serves every route.
  trailingSlash: true,
  // GitHub Pages serves the site under /nabil-ui/ (set in CI).
  basePath: process.env.BASE_PATH,
} satisfies NextConfig
