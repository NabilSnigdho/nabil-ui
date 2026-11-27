// Builds public/r/<base>-<style>/<name>.json for every base × style, the URL
// layout the shadcn CLI requests with `"@nabil": ".../r/{style}/{name}.json"`.
// `cn-*` style tokens are resolved per style the same way official shadcn does.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { registryItemSchema, registrySchema } from "shadcn/schema"
import { createStyleMap, transformStyle } from "shadcn/utils"

const BASES = ["radix", "base", "aria"]
const STYLES = ["vega", "nova", "maia", "lyra", "mira", "luma", "sera", "rhea"]
// Projects created before base-prefixed styles still request these names.
const LEGACY = {
  "new-york-v4": "radix-nova",
  "new-york": "radix-nova",
  default: "radix-nova",
}
const OUT = "public/r"

rmSync(OUT, { recursive: true, force: true })
const built = new Map<string, Map<string, string>>()

for (const style of STYLES) {
  const styleMap = createStyleMap(
    readFileSync(`registry/shadcn/styles/style-${style}.css`, "utf8")
  )
  for (const base of BASES) {
    const registry = registrySchema.parse(
      JSON.parse(readFileSync(`registry/bases/${base}/registry.json`, "utf8"))
    )
    const items = new Map<string, string>()
    for (const item of registry.items) {
      const files = await Promise.all(
        (item.files ?? []).map(async (file) => ({
          ...file,
          content: await transformStyle(readFileSync(file.path, "utf8"), {
            styleMap,
          }),
        }))
      )
      const json = registryItemSchema.parse({ ...item, files })
      items.set(
        item.name,
        JSON.stringify(
          {
            $schema: "https://ui.shadcn.com/schema/registry-item.json",
            ...json,
          },
          null,
          2
        )
      )
    }
    built.set(`${base}-${style}`, items)
  }
}
for (const [legacy, from] of Object.entries(LEGACY))
  built.set(legacy, built.get(from)!)

for (const [combo, items] of built) {
  mkdirSync(`${OUT}/${combo}`, { recursive: true })
  for (const [name, json] of items)
    writeFileSync(`${OUT}/${combo}/${name}.json`, json)
}
console.log(
  `built ${built.size} styles × ${built.values().next().value!.size} items into ${OUT}`
)
