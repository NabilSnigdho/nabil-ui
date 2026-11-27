import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { renderServerComponent } from "@tanstack/react-start/rsc"

const REGISTRY = `{
  "registries": {
    "@nabil": "https://nabilsnigdho.github.io/nabil-ui/r/{style}/{name}.json"
  }
}`

// Static content, so it's a server component: zero client JS for this markup.
function Introduction() {
  return (
    <article className="flex max-w-2xl flex-col gap-4 leading-7">
      <h1 className="text-3xl font-semibold tracking-tight">Introduction</h1>
      <p className="text-lg text-muted-foreground">
        Nabil UI is a small collection of components built on top of shadcn/ui.
        Like shadcn/ui, it isn't a package: the CLI copies the source into your
        project, so you own and edit it.
      </p>
      <p>
        Every component ships three implementations, one per primitive library
        shadcn supports: <strong>Radix UI</strong>, <strong>Base UI</strong> and{" "}
        <strong>React Aria</strong>. The CLI picks the one matching your{" "}
        <code>components.json</code> style, and resolves the visual style (vega,
        nova, maia, lyra, mira, luma, sera, rhea) the same way official
        components do.
      </p>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">
        Installation
      </h2>
      <p>
        Add the <code>@nabil</code> registry to your{" "}
        <code>components.json</code>:
      </p>
      <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
        {REGISTRY}
      </pre>
      <p>Then add a component:</p>
      <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
        npx shadcn@latest add @nabil/multi-view-calendar
      </pre>
    </article>
  )
}

const getIntroduction = createServerFn({ method: "GET" }).handler(async () => ({
  Introduction: await renderServerComponent(<Introduction />),
}))

export const Route = createFileRoute("/")({
  loader: () => getIntroduction(),
  // Content never changes at runtime; don't refetch on every visit.
  staleTime: Infinity,
  component: Home,
})

function Home() {
  const { Introduction } = Route.useLoaderData()
  return (
    <div className="flex flex-col gap-6">
      {Introduction}
      <Link
        to="/components/multi-view-calendar"
        className="w-fit text-sm font-medium underline underline-offset-4"
      >
        Browse components →
      </Link>
    </div>
  )
}
