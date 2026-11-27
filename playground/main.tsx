import * as React from "react"
import type { DateRange } from "react-day-picker"
import { createRoot } from "react-dom/client"

import "./index.css"
import {
  MultiViewCalendar as AriaMultiViewCalendar,
  MultiViewRangeCalendar as AriaMultiViewRangeCalendar,
} from "@/registry/bases/aria/ui/multi-view-calendar"
import {
  MultiViewCalendar as BaseMultiViewCalendar,
  type CalendarView,
} from "@/registry/bases/base/ui/multi-view-calendar"
import { MultiViewCalendar as RadixMultiViewCalendar } from "@/registry/bases/radix/ui/multi-view-calendar"

const STYLES = ["vega", "nova", "maia", "lyra", "mira", "luma", "sera", "rhea"]

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

function App() {
  const [style, setStyle] = React.useState("nova")
  const [dark, setDark] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(() => new Date())
  const [range, setRange] = React.useState<DateRange | undefined>()
  const [view, setView] = React.useState<CalendarView>("month")
  const [log, setLog] = React.useState<string[]>([])

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <main className={`style-${style} flex flex-col gap-8 p-8`}>
      <header className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={dark}
            onChange={(e) => setDark(e.target.checked)}
          />
          Dark
        </label>
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
    </main>
  )
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
