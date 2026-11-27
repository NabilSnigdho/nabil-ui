import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import type { DateRange } from "react-day-picker"

import {
  MultiViewCalendar as AriaMultiViewCalendar,
  MultiViewRangeCalendar as AriaMultiViewRangeCalendar,
} from "@/registry/bases/aria/ui/multi-view-calendar"
import {
  MultiViewCalendar as BaseMultiViewCalendar,
  type CalendarView,
} from "@/registry/bases/base/ui/multi-view-calendar"
import { MultiViewCalendar as RadixMultiViewCalendar } from "@/registry/bases/radix/ui/multi-view-calendar"

export const Route = createFileRoute("/components/multi-view-calendar")({
  head: () => ({ meta: [{ title: "Multi-view Calendar · Nabil UI" }] }),
  component: MultiViewCalendarPage,
})

function Demo({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="w-fit rounded-lg border">{children}</div>
    </section>
  )
}

function MultiViewCalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(() => new Date())
  const [range, setRange] = React.useState<DateRange | undefined>()
  const [view, setView] = React.useState<CalendarView>("month")
  const [log, setLog] = React.useState<string[]>([])

  return (
    <div className="flex flex-col gap-8">
      <header className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Multi-view Calendar
        </h1>
        <p className="text-muted-foreground">
          Calendar with month, year, decade and century views. Click the caption
          to go up a view, pick a tile to go down.
        </p>
        <pre className="w-fit max-w-full overflow-x-auto rounded-lg border bg-muted px-4 py-2 text-sm">
          npx shadcn@latest add @nabil/multi-view-calendar
        </pre>
      </header>

      <div className="flex flex-wrap items-start gap-8">
        <Demo title="Base UI · single">
          <BaseMultiViewCalendar
            mode="single"
            selected={date}
            onSelect={setDate}
          />
        </Demo>
        <Demo title="Radix · single">
          <RadixMultiViewCalendar
            mode="single"
            selected={date}
            onSelect={setDate}
          />
        </Demo>
        <Demo title="React Aria · single">
          <AriaMultiViewCalendar aria-label="Date" />
        </Demo>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <Demo title="Base UI · range, 2 months">
          <BaseMultiViewCalendar
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelect={setRange}
          />
        </Demo>
        <Demo title="React Aria · range, 2 months">
          <AriaMultiViewRangeCalendar aria-label="Range" numberOfMonths={2} />
        </Demo>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <Demo title="Base UI · controlled view, 2020–2030, can't open century">
          <BaseMultiViewCalendar
            mode="single"
            startMonth={new Date(2020, 0)}
            endMonth={new Date(2030, 11)}
            view={view}
            onViewChange={(next, details) => {
              setLog((l) => [`${next} (${details.reason})`, ...l].slice(0, 5))
              if (next === "century") details.cancel()
              else setView(next)
            }}
          />
        </Demo>
        <pre className="text-xs text-muted-foreground">
          view: {view}
          {"\n"}
          {log.join("\n")}
        </pre>
      </div>
    </div>
  )
}
