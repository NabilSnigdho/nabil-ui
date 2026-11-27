# shadcn registry R&D (nabil-ui-dsb)

Researched 2026-11-27 against shadcn-ui/ui `main@0e5b2e6` and `shadcn@4.23.1`. Claims marked
**(tested)** were verified end-to-end with the real CLI against a local fake registry.

## TL;DR

- The consumer's primitive library is the prefix of `components.json` `style`:
  `{radix|base|aria}-{vega|nova|maia|lyra|mira|luma|sera|rhea}` (e.g. `aria-nova`). No separate field.
  React Aria is first-class since 2026-07; Base UI is the default.
- The only way a third-party registry can serve per-primitive files is the `{style}` URL placeholder
  in a **namespaced** registry: `"@nabil": "https://<host>/r/{style}/{name}.json"` **(tested)**.
- **GitHub `owner/repo/item` installs do NOT support `{style}`**, so they can't pick a primitive.
  → Host static JSON instead (GitHub Pages from this repo), keep the repo itself as source.
- Icons: write `<IconPlaceholder lucide tabler hugeicons phosphor remixicon />`; the CLI swaps it for the
  consumer's `iconLibrary` on install, for third-party items too **(tested)**. Undocumented — may change.
- 20 registries in the official index already use `{style}` URLs, so this layout is index-compatible.

## How the CLI resolves a namespaced item

`packages/registry/src/registry/builder.ts`: `url = template.replace("{name}", item)`, then
`{style}` → full `config.style` (e.g. `base-nova`). There is no `{base}` placeholder, so every
`<base>-<style>` combo (24) must exist, plus legacy names that consumers may still have:
`new-york-v4`, `new-york`, `default` (all Radix).

Unprefixed `registryDependencies` (e.g. `"button"`) resolve via `@shadcn` with the consumer's style,
so depending on official components gets the right Radix/Base/Aria variant for free.

## Transforms the CLI applies to every installed file (third-party included)

Skipped entirely for `registry:file` / `registry:item` — use `registry:ui|component|block|hook|lib`.

| Transform                | Effect                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| import                   | `@/registry/<x>/{ui,components,lib,hooks}` and `@/components…` → consumer aliases             |
| rsc                      | strips `"use client"` when `rsc: false`                                                       |
| jsx                      | tsx → jsx when `tsx: false`                                                                   |
| cssVars / twPrefix / rtl | inline colors, apply `tailwind.prefix`, physical → logical classes                            |
| icons                    | `<IconPlaceholder …/>` → chosen library; drops imports whose path contains `icon-placeholder` |
| menu                     | `cn-menu-target` / `cn-menu-translucent` per `menuColor`                                      |
| asChild                  | `base-*` styles only: `asChild` → `render={…} nativeButton={false}`                           |
| cleanup                  | **deletes every `cn-*` class** (except `cn-font-heading`) — never use a real `cn-` class      |

Icon gotchas:

- Always pass all five library props. A missing prop leaves `<IconPlaceholder>` with its import removed → broken file.
- The icon package is not installed per item; `init` installs it. Legacy `new-york` uses `radix` icons, which the transformer ignores.
- Our own docs/previews need a runtime `IconPlaceholder` (official: `apps/v4/app/(app)/(create)/components/icon-placeholder.tsx`).

## How official builds per-style output

`apps/v4/scripts/build-registry.mts`: for each base × style, copy `registry/bases/<base>/`, run
`transformStyle(src, { styleMap: createStyleMap("style-<style>.css") })` (resolves `cn-*` style tokens
into Tailwind classes), rewrite `@/registry/bases/<base>/` → `@/registry/<base>-<style>/`, then
`shadcn build registry-<combo>.json -o public/r/styles/<combo>`. `createStyleMap`, `transformStyle`
and `transformIcons` are public exports of `shadcn/utils`. `shadcn build` itself is single-registry only.

## Decision (implemented 2026-11-27)

GitHub Pages hosts the built JSON. Consumers add
`"@nabil": "https://nabilsnigdho.github.io/nabil-ui/r/{style}/{name}.json"` and run
`npx shadcn@latest add @nabil/<name>`. The repo layout and commands are in `CLAUDE.md`.

- Unlike the first plan, `cn-*` tokens are resolved per style from day one, because the
  React Aria calendar can't wrap the official one (see below) and the styles differ in
  padding, `--cell-size` and `--cell-radius`.
- The official React Aria calendar is built on react-aria-components and has no `components`
  prop, so our aria components copy its markup. The Radix and Base UI versions wrap the
  official react-day-picker Calendar.

Gotchas found while building `multi-view-calendar`:

- The official react-day-picker Calendar defines `Root` inline, so React remounts its DOM on
  every render. Don't hold element references across renders, and don't keep state in DOM.
- The official buttons use `transition-all`, which also animates `visibility`. An element
  that becomes visible again is still `visibility: hidden` at transition time 0, so
  `focus()` silently fails. Override it with an explicit transition list.
- The obscura browser can't run React Aria (every element shares the `HTMLTemplateElement`
  prototype, which RAC patches). Use headless Chrome for aria checks.
