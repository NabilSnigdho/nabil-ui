import * as React from "react"
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useLocation,
} from "@tanstack/react-router"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/registry/shadcn/base/ui/sidebar"

import css from "../styles.css?url"

const STYLES = ["vega", "nova", "maia", "lyra", "mira", "luma", "sera", "rhea"]

const NAV = [
  {
    label: "Getting Started",
    items: [{ title: "Introduction", to: "/" }],
  },
  {
    label: "Components",
    items: [
      { title: "Multi-view Calendar", to: "/components/multi-view-calendar" },
    ],
  },
] as const

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nabil UI" },
    ],
    links: [{ rel: "stylesheet", href: css }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // Style/dark classes live on <html> so portals (the mobile sidebar sheet,
    // tooltips) pick them up too.
    <html lang="en" className="style-nova">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium md:hidden">Nabil UI</span>
        </header>
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppSidebar() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="px-2 py-1 text-base font-semibold">
          Nabil UI
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={pathname === item.to}
                      render={<Link to={item.to} />}
                      onClick={() => setOpenMobile(false)}
                    >
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <ThemeControls />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function ThemeControls() {
  const [style, setStyle] = React.useState("nova")
  const [dark, setDark] = React.useState(false)

  React.useEffect(() => {
    const html = document.documentElement
    html.classList.remove(...STYLES.map((s) => `style-${s}`))
    html.classList.add(`style-${style}`)
    html.classList.toggle("dark", dark)
  }, [style, dark])

  return (
    <div className="flex flex-col gap-2 px-2 text-sm">
      <label className="flex items-center justify-between gap-2">
        Style
        <select
          className="rounded-md border bg-background px-2 py-1"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        >
          {STYLES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center justify-between gap-2">
        Dark
        <input
          type="checkbox"
          checked={dark}
          onChange={(e) => setDark(e.target.checked)}
        />
      </label>
    </div>
  )
}
