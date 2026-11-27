import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import vinext from "vinext"
import { defineConfig, lazyPlugins } from "vite-plus"
import { playwright } from "vite-plus/test/browser-playwright"

// Same layout as shadcn-ui/ui's prettier `importOrder`: react, packages, then
// project aliases in a fixed order, then relative imports.
const aliasGroups = [
  "@/lib",
  "@/hooks",
  "@/components/ui",
  "@/components",
  "@/registry",
  "@/styles",
  "@/app",
]

export default defineConfig({
  // Options mirror shadcn-ui/ui's prettier.config.cjs.
  fmt: {
    endOfLine: "lf",
    semi: false,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "es5",
    printWidth: 80,
    // Upstream's own .prettierignore skips these generated style files too.
    ignorePatterns: ["registry/shadcn/styles/**", ".beads/**"],
    sortImports: {
      customGroups: [
        { groupName: "react", elementNamePattern: ["react", "react/**"] },
        ...aliasGroups.map((alias) => ({
          groupName: alias,
          elementNamePattern: [alias, `${alias}/**`],
        })),
      ],
      groups: [
        "react",
        { newlinesBetween: false },
        ["builtin", "external", "unknown"],
        ...aliasGroups.flatMap((alias, i) =>
          i === 0 ? [alias] : [{ newlinesBetween: false }, alias]
        ),
        ["parent", "sibling", "index"],
      ],
    },
    sortTailwindcss: {
      stylesheet: "./src/styles.css",
      functions: ["cn", "cva"],
    },
    overrides: [
      // Vendored upstream shadcn sources stay byte-identical (re-vendoring must
      // produce no diff), so don't sort their imports or classes.
      {
        files: ["registry/shadcn/**"],
        options: { sortImports: false, sortTailwindcss: false },
      },
    ],
  },
  lint: {
    // Oxlint's defaults (eslint, typescript, unicorn, oxc) plus React rules.
    plugins: [
      "eslint",
      "typescript",
      "unicorn",
      "oxc",
      "react",
      "jsx-a11y",
      "vitest",
    ],
    // Upstream shadcn code isn't ours to fix.
    ignorePatterns: ["registry/shadcn/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  // Run by the pre-commit hook (.beads/hooks/pre-commit).
  staged: { "*": "vp check --fix" },
  test: {
    include: ["registry/**/*.test.tsx"],
    // Real browser: focus and `visibility` behaviour don't reproduce in jsdom.
    browser: {
      enabled: true,
      headless: true,
      // System Chrome (also preinstalled on GitHub's Ubuntu runners), so no
      // Playwright browser download is needed.
      provider: playwright({
        launchOptions: { channel: "chrome" },
        contextOptions: { locale: "en-US" },
      }),
      instances: [{ browser: "chromium" }],
    },
  },
  plugins: lazyPlugins(() => [
    // Docs site (app router, config in next.config.ts); vinext registers the
    // React and RSC plugins itself. Vitest only needs React; vinext's dev
    // server would hijack it.
    ...(process.env.VITEST ? [react()] : [vinext()]),
    tailwindcss(),
    {
      // `vp build` can't be overridden, so build the registry JSON into
      // public/r here; it's copied into the static export with the site.
      name: "nabil-ui:registry",
      apply: "build",
      buildStart: () => import("./scripts/build.ts").then(() => {}),
    },
  ]),
  resolve: { alias: { "@": import.meta.dirname } },
})
