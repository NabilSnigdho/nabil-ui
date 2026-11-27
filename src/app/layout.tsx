import type { Metadata } from "next"

import { SiteShell } from "./site-shell"
import "../styles.css"

export const metadata: Metadata = {
  title: { default: "Nabil UI", template: "%s · Nabil UI" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Style/dark classes live on <html> so portals (the mobile sidebar sheet,
    // tooltips) pick them up too.
    <html lang="en" className="style-nova">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
