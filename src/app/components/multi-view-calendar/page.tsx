import type { Metadata } from "next"

import { MultiViewCalendarDemos } from "./demos"

export const metadata: Metadata = { title: "Multi-view Calendar" }

export default function Page() {
  return <MultiViewCalendarDemos />
}
