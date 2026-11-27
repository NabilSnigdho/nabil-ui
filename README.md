# Nabil UI

A small collection of components built on top of [shadcn/ui](https://ui.shadcn.com).
Like shadcn/ui, it isn't a package: the shadcn CLI copies the source into your
project, so you own and edit it.

Every component has three implementations, one per primitive library shadcn
supports: **Radix UI**, **Base UI** and **React Aria**. The CLI picks the one
matching your `components.json` style, and resolves the visual style (vega,
nova, maia, lyra, mira, luma, sera, rhea) the same way official components do.

## Installation

Add the `@nabil` registry to your `components.json`:

```json
{
  "registries": {
    "@nabil": "https://www.nabilsnigdho.dev/nabil-ui/r/{style}/{name}.json"
  }
}
```

Then add a component:

```bash
npx shadcn@latest add @nabil/multi-view-calendar
```

Official dependencies (`calendar`, `button`, …) are installed from the official
shadcn registry.

## Components

| Component             | Description                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `multi-view-calendar` | Calendar with month, year, decade and century views. Click the caption to go up a view, pick a tile to go down. |

## Development

Requires Node 26, pnpm and Google Chrome (for browser tests). The toolchain is
[Vite+](https://viteplus.dev) (`vp`); all config lives in `vite.config.ts`.

```bash
pnpm install
pnpm dev              # docs site + registry JSON served at /r
pnpm check            # format, lint and type check (--fix to fix)
pnpm test             # Vitest browser mode
pnpm build            # registry JSON + docs site into dist/
pnpm vendor [name...] # refresh vendored official shadcn sources
```

The docs site is an App Router app built with [vinext](https://vinext.dev),
statically exported (HTML + RSC payloads) and deployed to GitHub Pages.

To test an install locally, point a shadcn app's registry at the dev server:

```json
{ "registries": { "@nabil": "http://localhost:5173/r/{style}/{name}.json" } }
```

### Layout

- `registry/bases/{radix,base,aria}/` — the components, one implementation per
  primitive library, plus a `registry.json` per base.
- `registry/shadcn/` — vendored official shadcn sources and styles. Never edit
  by hand; refresh with `pnpm vendor`.
- `scripts/build.ts` — builds `public/r/<base>-<style>/<name>.json` for every
  combination.
- `src/` — the docs site.

See [docs/registry-research.md](docs/registry-research.md) for why the registry
is laid out this way.

## Contributing

Issues and pull requests are welcome. Keep the three base implementations in
sync, and run `pnpm check` and `pnpm test` before opening a PR.

## License

[MIT](LICENSE)
