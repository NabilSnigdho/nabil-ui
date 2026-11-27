"use client"

import * as React from "react"
import { cn } from "cn"
import {
  useDayPicker,
  type CaptionLabelProps,
  type DateRange,
  type MonthsProps,
} from "react-day-picker"

import { IconPlaceholder } from "@/registry/shadcn/icon-placeholder"
import { buttonVariants } from "@/registry/shadcn/radix/ui/button"
import { Calendar } from "@/registry/shadcn/radix/ui/calendar"

type CalendarView = "month" | "year" | "decade" | "century"

const VIEWS: CalendarView[] = ["month", "year", "decade", "century"]
// Years covered by one tile in each upper view.
const TILE_SPAN = { year: 0, decade: 1, century: 10 } as const

const MultiViewContext = React.createContext<{
  view: CalendarView
  changeView: (view: CalendarView) => void
  // Set when the user changed the view, so the new view takes focus.
  shouldFocusRef: React.RefObject<boolean>
} | null>(null)

function useMultiView() {
  const context = React.useContext(MultiViewContext)
  if (!context) throw new Error("Must be used within <MultiViewCalendar>")
  return context
}

function MultiViewCalendar({
  view: viewProp,
  defaultView = "month",
  onViewChange,
  components,
  ...props
}: React.ComponentProps<typeof Calendar> & {
  view?: CalendarView
  defaultView?: CalendarView
  onViewChange?: (view: CalendarView) => void
}) {
  const [uncontrolledView, setUncontrolledView] = React.useState(defaultView)
  const view = viewProp ?? uncontrolledView
  const shouldFocusRef = React.useRef(false)

  const changeView = (next: CalendarView) => {
    onViewChange?.(next)
    shouldFocusRef.current = true
    if (viewProp === undefined) setUncontrolledView(next)
  }

  return (
    <MultiViewContext.Provider value={{ view, changeView, shouldFocusRef }}>
      <Calendar
        data-view={view}
        components={{
          CaptionLabel: MultiViewCaptionLabel,
          Months: MultiViewMonths,
          ...components,
        }}
        {...props}
        // The caption is the view switcher, so dropdown captions don't apply.
        captionLayout="label"
      />
    </MultiViewContext.Provider>
  )
}

function MultiViewCaptionLabel({ className, children }: CaptionLabelProps) {
  const { view, changeView, shouldFocusRef } = useMultiView()
  const ref = React.useRef<HTMLButtonElement>(null)

  // With several months, the first caption to mount takes focus and clears the flag.
  React.useEffect(() => {
    if (view === "month" && shouldFocusRef.current) {
      shouldFocusRef.current = false
      ref.current?.focus()
    }
  }, [view, shouldFocusRef])

  return (
    <CaptionButton
      ref={ref}
      aria-live="polite"
      className={className}
      onClick={() => changeView("year")}
    >
      {children}
    </CaptionButton>
  )
}

function MultiViewMonths({ className, children, ...props }: MonthsProps) {
  const { view } = useMultiView()
  return (
    // The month grid stays rendered but invisible so the calendar keeps its size.
    <div className={cn(className, view !== "month" && "invisible")} {...props}>
      {children}
      {view !== "month" && <UpperView view={view} />}
    </div>
  )
}

function UpperView({ view }: { view: Exclude<CalendarView, "month"> }) {
  const { changeView, shouldFocusRef } = useMultiView()
  const { months, goToMonth, classNames, selected, dayPickerProps } =
    useDayPicker()
  const { locale, startMonth, endMonth, disableNavigation } = dayPickerProps
  const current = months[0].date
  const span = TILE_SPAN[view]
  const tilesRef = React.useRef<HTMLFieldSetElement>(null)

  // Year view: 12 months in 3 columns. Decade/century: their 10 years or
  // decades in 2 columns, so the tiles are bigger.
  // Like centuries (2001–2100), decades run from year 1 to 10 (2021–2030).
  const columns = view === "year" ? 3 : 2
  const pageStep = view === "year" ? 1 : span * 10
  const pageStart =
    view === "year"
      ? current.getFullYear()
      : Math.floor((current.getFullYear() - 1) / pageStep) * pageStep + 1
  const tiles = Array.from({ length: view === "year" ? 12 : 10 }, (_, i) => {
    if (view === "year") {
      const start = new Date(pageStart, i, 1)
      return { start, end: new Date(pageStart, i + 1, 0) }
    }
    const year = pageStart + i * span
    return {
      start: new Date(year, 0, 1),
      end: new Date(year + span - 1, 11, 31),
    }
  })

  const fmtYear = (date: Date) =>
    date.toLocaleDateString(locale?.code, { year: "numeric" })
  const label = (tile: (typeof tiles)[number]) =>
    view === "year"
      ? tile.start.toLocaleDateString(locale?.code, { month: "short" })
      : view === "decade"
        ? fmtYear(tile.start)
        : `${fmtYear(tile.start)} – ${fmtYear(tile.end)}`
  const caption =
    view === "year"
      ? fmtYear(current)
      : `${fmtYear(tiles[0].start)} – ${fmtYear(tiles[9].end)}`

  const selectedDates = toDates(selected)
  const [today] = React.useState(() => new Date())
  const contains = (tile: (typeof tiles)[number], date: Date) =>
    date >= tile.start && date <= endOfDay(tile.end)
  const isDisabled = (tile: (typeof tiles)[number]) =>
    Boolean(disableNavigation) ||
    Boolean(startMonth && tile.end < startMonth) ||
    Boolean(endMonth && tile.start > endOfMonth(endMonth))

  // Focus the tile containing the displayed month after a user-triggered change.
  React.useEffect(() => {
    if (!shouldFocusRef.current) return
    shouldFocusRef.current = false
    tilesRef.current
      ?.querySelector<HTMLButtonElement>("[data-current=true]:not(:disabled)")
      ?.focus()
  }, [view, shouldFocusRef])

  const shiftPage = (direction: -1 | 1) => {
    const date = new Date(current)
    date.setFullYear(current.getFullYear() + direction * pageStep)
    goToMonth(date)
  }

  const selectTile = (tile: (typeof tiles)[number]) => {
    const date =
      view === "year"
        ? tile.start
        : new Date(tile.start.getFullYear(), current.getMonth(), 1)
    goToMonth(date)
    changeView(VIEWS[VIEWS.indexOf(view) - 1])
  }

  // ponytail: arrows move within the visible page only; add page flipping at edges if asked.
  const onTileKeyDown = (event: {
    key: string
    target: EventTarget
    preventDefault: () => void
  }) => {
    const delta = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columns,
      ArrowDown: columns,
    }[event.key]
    const tile = event.target as HTMLButtonElement
    const buttons = [...tile.parentElement!.querySelectorAll("button")]
    const next = delta && buttons[buttons.indexOf(tile) + delta]
    if (next) {
      event.preventDefault()
      next.focus()
    }
  }

  return (
    <div
      data-slot="calendar-upper-view"
      className="visible absolute inset-0 flex flex-col gap-4"
    >
      <nav className={classNames.nav}>
        <button
          type="button"
          className={classNames.button_previous}
          aria-label={`Previous ${view}`}
          disabled={Boolean(disableNavigation)}
          onClick={() => shiftPage(-1)}
        >
          <IconPlaceholder
            lucide="ChevronLeftIcon"
            tabler="IconChevronLeft"
            hugeicons="ArrowLeftIcon"
            phosphor="CaretLeftIcon"
            remixicon="RiArrowLeftSLine"
            className="cn-rtl-flip size-4"
          />
        </button>
        <button
          type="button"
          className={classNames.button_next}
          aria-label={`Next ${view}`}
          disabled={Boolean(disableNavigation)}
          onClick={() => shiftPage(1)}
        >
          <IconPlaceholder
            lucide="ChevronRightIcon"
            tabler="IconChevronRight"
            hugeicons="ArrowRightIcon"
            phosphor="CaretRightIcon"
            remixicon="RiArrowRightSLine"
            className="cn-rtl-flip size-4"
          />
        </button>
      </nav>
      <div className={classNames.month_caption}>
        <CaptionButton
          className={classNames.caption_label}
          disabled={view === "century"}
          onClick={() => changeView(VIEWS[VIEWS.indexOf(view) + 1])}
        >
          {caption}
        </CaptionButton>
      </div>
      <fieldset
        ref={tilesRef}
        aria-label={caption}
        className={cn(
          "grid flex-1 gap-1",
          columns === 2 ? "grid-cols-2 grid-rows-5" : "grid-cols-3 grid-rows-4"
        )}
      >
        {tiles.map((tile) => {
          const isSelected = selectedDates.some((d) => contains(tile, d))
          return (
            <button
              key={tile.start.getTime()}
              type="button"
              data-current={contains(tile, current)}
              data-selected={isSelected}
              data-today={!isSelected && contains(tile, today)}
              aria-pressed={isSelected}
              onKeyDown={onTileKeyDown}
              disabled={isDisabled(tile)}
              onClick={() => selectTile(tile)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-full w-full rounded-(--cell-radius) px-1 font-normal",
                "data-[today=true]:bg-muted",
                "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
              )}
            >
              {label(tile)}
            </button>
          )
        })}
      </fieldset>
    </div>
  )
}

function CaptionButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="calendar-caption"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "relative h-(--cell-size) w-full px-2",
        // `relative`: paint above the full-width absolute nav, which otherwise
        // swallows clicks on the caption.
        // Not `transition-all`: a transitioning `visibility` keeps the caption
        // unfocusable right after the month grid is shown again.
        "transition-[color,background-color,border-color,box-shadow,translate]",
        className
      )}
      {...props}
    />
  )
}

function toDates(selected: unknown): Date[] {
  if (selected instanceof Date) return [selected]
  if (Array.isArray(selected)) return selected
  const range = selected as DateRange | undefined
  return [range?.from, range?.to].filter((d): d is Date => d instanceof Date)
}

const endOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
const endOfMonth = (date: Date) =>
  endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0))

export { MultiViewCalendar, type CalendarView }
