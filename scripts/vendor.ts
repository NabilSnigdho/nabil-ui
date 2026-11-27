// Copies official shadcn sources into registry/shadcn so our components and the
// playground import them the way consumers' projects will:
// `@/registry/shadcn/<base>/ui/<name>` is rewritten to the consumer's `ui`
// alias at install time. Sources keep their `cn-*` style tokens; the style CSS
// (registry/shadcn/styles) resolves them in the playground and in our build.
//
// Usage: node scripts/vendor.ts [name...]   (default: calendar)
import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"

const REPO =
  "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry"
const BASES = ["radix", "base", "aria"] as const
const STYLES = ["vega", "nova", "maia", "lyra", "mira", "luma", "sera", "rhea"]
const names = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["calendar"]

async function get(path: string) {
  const res = await fetch(`${REPO}/${path}`)
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return res.text()
}

const written: string[] = []

function write(path: string, content: string) {
  written.push(path)
  mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true })
  writeFileSync(path, content)
  console.log("wrote", path)
}

for (const base of BASES) {
  const queue = names.map((name) => `ui/${name}`)
  const seen = new Set<string>()
  while (queue.length) {
    const file = queue.shift()!
    if (seen.has(file)) continue
    seen.add(file)
    // Components are .tsx, hooks (e.g. hooks/use-mobile) are .ts.
    const ext = file.startsWith("hooks/") ? "ts" : "tsx"
    const source = await get(`bases/${base}/${file}.${ext}`)
    // Follow imports of other official files, e.g. calendar -> button.
    for (const [, dep] of source.matchAll(
      new RegExp(`from "@/registry/bases/${base}/([^"]+)"`, "g")
    )) {
      queue.push(dep)
    }
    write(
      `registry/shadcn/${base}/${file}.${ext}`,
      source
        .replaceAll(`@/registry/bases/${base}/`, `@/registry/shadcn/${base}/`)
        .replaceAll(
          "@/app/(create)/components/icon-placeholder",
          "@/registry/shadcn/icon-placeholder"
        )
    )
  }
}

for (const style of STYLES) {
  write(
    `registry/shadcn/styles/style-${style}.css`,
    await get(`styles/style-${style}.css`)
  )
}

// Vendored files must stay byte-identical to upstream, but the pre-commit hook
// runs `vp check --fix` on them. Fail now if the formatter would rewrite any.
try {
  execFileSync("node_modules/.bin/vp", ["fmt", "--check", ...written], {
    stdio: "inherit",
  })
} catch {
  throw new Error(
    "The formatter would change the vendored files above. Add them to " +
      "fmt.ignorePatterns in vite.config.ts so they stay identical to upstream."
  )
}
