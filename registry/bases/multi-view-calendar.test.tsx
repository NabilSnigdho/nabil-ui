import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, test, vi } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser/context"

import { MultiViewCalendar as AriaCalendar } from "@/registry/bases/aria/ui/multi-view-calendar"
import {
  MultiViewCalendar as BaseCalendar,
  type CalendarView,
  type CalendarViewChangeEventDetails,
} from "@/registry/bases/base/ui/multi-view-calendar"
import { MultiViewCalendar as RadixCalendar } from "@/registry/bases/radix/ui/multi-view-calendar"

// Real styles: the hidden month grid relies on `visibility`, which affects focus.
import "@/src/styles.css"

let root: Root | undefined
afterEach(() => {
  root?.unmount()
  document.body.replaceChildren()
})

function render(ui: React.ReactNode) {
  const container = document.createElement("div")
  container.className = "style-nova"
  document.body.append(container)
  root = createRoot(container)
  root.render(ui)
}

// Query fresh every time: the official react-day-picker Calendar remounts its root.
const calendar = () =>
  document.querySelector<HTMLElement>("[data-slot=calendar]")!
const caption = () =>
  calendar().querySelector<HTMLButtonElement>(
    "[data-slot=calendar-upper-view] [data-slot=calendar-caption]"
  ) ??
  calendar().querySelector<HTMLButtonElement>("[data-slot=calendar-caption]")!
const tiles = () => [
  ...calendar().querySelectorAll<HTMLButtonElement>(
    "[data-slot=calendar-upper-view] fieldset button"
  ),
]
const expectCaption = (text: string) =>
  vi.waitFor(() => expect(caption().textContent).toBe(text))

const now = new Date()
const year = now.getFullYear()
// Decades and centuries start at year 1: 2021–2030, 2001–2100.
const decade = Math.floor((year - 1) / 10) * 10 + 1
const century = Math.floor((year - 1) / 100) * 100 + 1
const monthShort = (month: number) =>
  new Date(year, month).toLocaleDateString("en-US", { month: "short" })

describe.each([
  ["Base UI", () => <BaseCalendar mode="single" />],
  ["Radix", () => <RadixCalendar mode="single" />],
  ["React Aria", () => <AriaCalendar aria-label="Date" />],
])("%s", (_, Calendar) => {
  test("goes up to century and back down to a month", async () => {
    render(<Calendar />)
    await vi.waitFor(() => caption())
    const height = calendar().getBoundingClientRect().height

    await userEvent.click(caption())
    await expectCaption(String(year))
    expect(document.activeElement?.textContent).toBe(monthShort(now.getMonth()))

    await userEvent.click(caption())
    await expectCaption(`${decade} – ${decade + 9}`)
    await userEvent.click(caption())
    await expectCaption(`${century} – ${century + 99}`)
    expect(caption().disabled).toBe(true)
    expect(calendar().getBoundingClientRect().height).toBe(height)

    // Decade and century views show just their 10 years / decades.
    expect(tiles()).toHaveLength(10)
    await userEvent.click(tiles()[5])
    await expectCaption(`${century + 50} – ${century + 59}`)
    expect(tiles()).toHaveLength(10)
    await userEvent.click(tiles()[5])
    await expectCaption(String(century + 55))

    // Arrow keys move between tiles, three per row.
    await vi.waitFor(() =>
      expect(document.activeElement?.textContent).toBe(
        monthShort(now.getMonth())
      )
    )
    await userEvent.keyboard("{ArrowUp}")
    expect(document.activeElement?.textContent).toBe(
      monthShort(now.getMonth() - 3 < 0 ? now.getMonth() : now.getMonth() - 3)
    )

    await userEvent.click(tiles()[2])
    await expectCaption(`March ${century + 55}`)
    expect(calendar().dataset.view).toBe("month")
    expect(calendar().getBoundingClientRect().height).toBe(height)
    await vi.waitFor(() => expect(document.activeElement).toBe(caption()))
  })
})

test("Base UI: onViewChange can cancel a change", async () => {
  const onViewChange = vi.fn<
    (view: CalendarView, details: CalendarViewChangeEventDetails) => void
  >((view, details) => {
    if (view === "decade") details.cancel()
  })
  render(<BaseCalendar mode="single" onViewChange={onViewChange} />)
  await vi.waitFor(() => caption())

  await userEvent.click(caption())
  await expectCaption(String(year))
  await userEvent.click(caption())
  expect(onViewChange).toHaveBeenLastCalledWith(
    "decade",
    expect.objectContaining({ reason: "caption-press", isCanceled: true })
  )
  expect(calendar().dataset.view).toBe("year")
})

test("Radix: view can be controlled", async () => {
  function Controlled() {
    const [view, setView] = React.useState<
      "month" | "year" | "decade" | "century"
    >("decade")
    return <RadixCalendar mode="single" view={view} onViewChange={setView} />
  }
  render(<Controlled />)
  await expectCaption(`${decade} – ${decade + 9}`)
  await userEvent.click(tiles()[0])
  await expectCaption(String(decade))
  expect(calendar().dataset.view).toBe("year")
})

test("selected tile keeps its color on hover", async () => {
  render(<BaseCalendar mode="single" selected={new Date()} />)
  await userEvent.click(await vi.waitFor(() => caption()))
  const tile = () =>
    calendar().querySelector(
      "[data-slot=calendar-upper-view] [data-selected=true]"
    )!
  const before = await vi.waitFor(
    () => getComputedStyle(tile()).backgroundColor
  )
  await userEvent.hover(tile())
  // Wait out the button's color transition.
  await new Promise((resolve) => setTimeout(resolve, 300))
  expect(getComputedStyle(tile()).backgroundColor).toBe(before)
})
