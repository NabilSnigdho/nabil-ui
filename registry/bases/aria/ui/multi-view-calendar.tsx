"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import {
  Calendar as AriaCalendar,
  CalendarGridHeader as AriaCalendarGridHeader,
  RangeCalendar as AriaRangeCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarStateContext,
  RangeCalendarStateContext,
  useLocale,
  type CalendarCellRenderProps,
  type CalendarProps,
  type DateValue,
  type RangeCalendarProps,
} from "react-aria-components"

import { Button, buttonVariants } from "@/registry/shadcn/aria/ui/button"
import { IconPlaceholder } from "@/registry/shadcn/icon-placeholder"

type CalendarView = "month" | "year" | "decade" | "century"

const VIEWS: CalendarView[] = ["month", "year", "decade", "century"]
// Years covered by one tile in each upper view.
const TILE_SPAN = { year: 0, decade: 1, century: 10 } as const

type ViewProps = {
  view?: CalendarView
  defaultView?: CalendarView
  onViewChange?: (view: CalendarView) => void
}

type InnerProps = {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  numberOfMonths?: number
  showWeekNumber?: boolean
  headerFormat?: Intl.DateTimeFormatOptions
  renderCell?: (
    renderProps: CalendarCellRenderProps & { defaultChildren: React.ReactNode }
  ) => React.ReactNode
}

const cellVariants = cva(
  "group/day relative mt-2 aspect-square h-full w-full cursor-default rounded-(--cell-radius) p-0 text-center select-none [&:is(:last-child>[data-selected=true])>div]:rounded-r-(--cell-radius)",
  {
    variants: {
      showWeekNumber: {
        false:
          "[&:is(:first-child>[data-selected=true])>div]:rounded-l-(--cell-radius)",
        true: "[&:is(:nth-child(2)>[data-selected=true])>div]:rounded-l-(--cell-radius)",
      },
      isToday: {
        true: "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
      },
      isSelectionStart: {
        true: "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
      },
      isSelectionEnd: {
        true: "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
      },
      isUnavailable: {
        true: "text-muted-foreground opacity-50 [&>div]:line-through",
      },
      isDisabled: {
        true: "text-muted-foreground opacity-50",
      },
      isOutsideMonth: {
        true: "text-muted-foreground aria-selected:text-muted-foreground",
      },
    },
  }
)

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

function useViewState({
  view: viewProp,
  defaultView = "month",
  onViewChange,
}: ViewProps) {
  const [uncontrolledView, setUncontrolledView] = React.useState(defaultView)
  const shouldFocusRef = React.useRef(false)
  return {
    view: viewProp ?? uncontrolledView,
    shouldFocusRef,
    changeView: (next: CalendarView) => {
      onViewChange?.(next)
      shouldFocusRef.current = true
      if (viewProp === undefined) setUncontrolledView(next)
    },
  }
}

function useCalendarState() {
  const calendar = React.useContext(CalendarStateContext)
  const range = React.useContext(RangeCalendarStateContext)
  return (calendar ?? range)!
}

function MultiViewCalendar<
  T extends DateValue,
  M extends "single" | "multiple" = "single",
>({
  view,
  defaultView,
  onViewChange,
  ...props
}: Omit<CalendarProps<T, M>, "visibleDuration"> & InnerProps & ViewProps) {
  const viewState = useViewState({ view, defaultView, onViewChange })
  return (
    <AriaCalendar
      {...props}
      data-slot="calendar"
      data-view={viewState.view}
      visibleDuration={{ months: props.numberOfMonths || 1 }}
      className={cn(
        "cn-calendar group/calendar w-fit bg-background in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        props.className
      )}
    >
      <MultiViewContext.Provider value={viewState}>
        <CalendarInner {...props} />
      </MultiViewContext.Provider>
    </AriaCalendar>
  )
}

function MultiViewRangeCalendar<T extends DateValue>({
  view,
  defaultView,
  onViewChange,
  ...props
}: RangeCalendarProps<T> & InnerProps & ViewProps) {
  const viewState = useViewState({ view, defaultView, onViewChange })
  return (
    <AriaRangeCalendar
      {...props}
      data-slot="calendar"
      data-view={viewState.view}
      visibleDuration={{ months: props.numberOfMonths || 1 }}
      className={cn(
        "cn-calendar group/calendar w-fit bg-background in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        props.className
      )}
    >
      <MultiViewContext.Provider value={viewState}>
        <CalendarInner {...props} isRange />
      </MultiViewContext.Provider>
    </AriaRangeCalendar>
  )
}

function CalendarInner({
  buttonVariant = "ghost",
  numberOfMonths = 1,
  showWeekNumber = false,
  headerFormat,
  renderCell,
  isRange,
}: InnerProps & { isRange?: boolean }) {
  const { view } = useMultiView()
  return (
    // The month grid stays rendered but invisible so the calendar keeps its size.
    <div
      className={cn(
        "relative flex flex-col gap-4 md:flex-row",
        view !== "month" && "invisible"
      )}
    >
      <header className="absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1">
        <Button
          variant={buttonVariant}
          slot="previous"
          className="size-(--cell-size) p-0 select-none aria-disabled:opacity-50"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant={buttonVariant}
          slot="next"
          className="size-(--cell-size) p-0 select-none aria-disabled:opacity-50"
        >
          <ChevronRight />
        </Button>
      </header>
      {Array.from({ length: numberOfMonths }, (_, i) => (
        <div key={i} className="flex w-full flex-col gap-4">
          <div
            aria-live="polite"
            className="flex h-(--cell-size) w-full items-center justify-center gap-1 px-(--cell-size)"
          >
            <MonthCaption offset={i} format={headerFormat} />
          </div>
          <CalendarGrid
            className="w-full border-collapse"
            offset={{ months: i }}
          >
            <AriaCalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none">
                  {day}
                </CalendarHeaderCell>
              )}
            </AriaCalendarGridHeader>
            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  date={date}
                  className={(renderProps) =>
                    cellVariants({ ...renderProps, showWeekNumber })
                  }
                >
                  {(renderProps) => (
                    <div
                      data-selected-single={renderProps.isSelected && !isRange}
                      data-range-start={renderProps.isSelectionStart && isRange}
                      data-range-end={renderProps.isSelectionEnd && isRange}
                      data-range-middle={
                        renderProps.isSelected &&
                        !renderProps.isSelectionStart &&
                        !renderProps.isSelectionEnd &&
                        isRange
                      }
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "cn-calendar-day-button relative isolate z-10 flex aspect-square h-full w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70"
                      )}
                    >
                      {renderCell
                        ? renderCell(renderProps)
                        : renderProps.defaultChildren}
                    </div>
                  )}
                </CalendarCell>
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </div>
      ))}
      {view !== "month" && (
        <UpperView view={view} buttonVariant={buttonVariant} />
      )}
    </div>
  )
}

function MonthCaption({
  offset,
  format = { month: "long", year: "numeric" },
}: {
  offset: number
  format?: Intl.DateTimeFormatOptions
}) {
  const { view, changeView, shouldFocusRef } = useMultiView()
  const state = useCalendarState()
  const { locale } = useLocale()
  const ref = React.useRef<HTMLButtonElement>(null)

  // With several months, the first caption to mount takes focus and clears the flag.
  React.useEffect(() => {
    if (view === "month" && shouldFocusRef.current) {
      shouldFocusRef.current = false
      ref.current?.focus()
    }
  }, [view, shouldFocusRef])

  const month = state.visibleRange.start.add({ months: offset })
  return (
    <CaptionButton ref={ref} onPress={() => changeView("year")}>
      {new Intl.DateTimeFormat(locale, {
        ...format,
        timeZone: state.timeZone,
      }).format(month.toDate(state.timeZone))}
    </CaptionButton>
  )
}

// ponytail: tiles assume the Gregorian calendar; other calendar systems would need @internationalized/date math.
function UpperView({
  view,
  buttonVariant,
}: {
  view: Exclude<CalendarView, "month">
  buttonVariant: InnerProps["buttonVariant"]
}) {
  const { changeView, shouldFocusRef } = useMultiView()
  const state = useCalendarState()
  const { locale } = useLocale()
  const tilesRef = React.useRef<HTMLFieldSetElement>(null)
  const current = state.focusedDate
  const span = TILE_SPAN[view]

  // Year view: 12 months in 3 columns. Decade/century: their 10 years or
  // decades in 2 columns, so the tiles are bigger.
  // Like centuries (2001–2100), decades run from year 1 to 10 (2021–2030).
  const columns = view === "year" ? 3 : 2
  // Tiles cover month indexes [from, to], where index = year * 12 + month - 1.
  const pageStep = view === "year" ? 1 : span * 10
  const pageStart =
    view === "year"
      ? current.year
      : Math.floor((current.year - 1) / pageStep) * pageStep + 1
  const tiles = Array.from({ length: view === "year" ? 12 : 10 }, (_, i) => {
    if (view === "year") {
      const index = pageStart * 12 + i
      return {
        year: pageStart,
        month: i + 1,
        from: index,
        to: index,
      }
    }
    const year = pageStart + i * span
    return {
      year,
      month: current.month,
      from: year * 12,
      to: (year + span) * 12 - 1,
    }
  })
  type Tile = (typeof tiles)[number]

  const fmtYear = (year: number) =>
    new Date(year, 0, 1).toLocaleDateString(locale, { year: "numeric" })
  const label = (tile: Tile) =>
    view === "year"
      ? new Date(tile.year, tile.month - 1, 1).toLocaleDateString(locale, {
          month: "short",
        })
      : view === "decade"
        ? fmtYear(tile.year)
        : `${fmtYear(tile.year)} – ${fmtYear(tile.year + span - 1)}`
  const caption =
    view === "year"
      ? fmtYear(current.year)
      : `${fmtYear(tiles[0].year)} – ${fmtYear(tiles[9].year + span - 1)}`

  const index = (date: { year: number; month: number }) =>
    date.year * 12 + date.month - 1
  const contains = (tile: Tile, date: { year: number; month: number }) =>
    tile.from <= index(date) && index(date) <= tile.to
  const [now] = React.useState(() => new Date())
  const today = { year: now.getFullYear(), month: now.getMonth() + 1 }
  const selectedDates = toDates(state.value)
  const isDisabled = (tile: Tile) =>
    state.isDisabled ||
    Boolean(state.minValue && tile.to < index(state.minValue)) ||
    Boolean(state.maxValue && tile.from > index(state.maxValue))

  // Focus the tile containing the focused date after a user-triggered change.
  React.useEffect(() => {
    if (!shouldFocusRef.current) return
    shouldFocusRef.current = false
    tilesRef.current
      ?.querySelector<HTMLButtonElement>("[data-current=true]:not(:disabled)")
      ?.focus()
  }, [view, shouldFocusRef])

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
      <header className="absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1">
        <Button
          slot={null}
          variant={buttonVariant}
          aria-label={`Previous ${view}`}
          isDisabled={state.isDisabled}
          onPress={() =>
            state.setFocusedDate(current.add({ years: -pageStep }))
          }
          className="size-(--cell-size) p-0 select-none aria-disabled:opacity-50"
        >
          <ChevronLeft />
        </Button>
        <Button
          slot={null}
          variant={buttonVariant}
          aria-label={`Next ${view}`}
          isDisabled={state.isDisabled}
          onPress={() => state.setFocusedDate(current.add({ years: pageStep }))}
          className="size-(--cell-size) p-0 select-none aria-disabled:opacity-50"
        >
          <ChevronRight />
        </Button>
      </header>
      <div className="flex h-(--cell-size) w-full items-center justify-center gap-1 px-(--cell-size)">
        <CaptionButton
          isDisabled={view === "century"}
          onPress={() => changeView(VIEWS[VIEWS.indexOf(view) + 1])}
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
            <Button
              key={tile.from}
              slot={null}
              variant="ghost"
              data-current={contains(tile, current)}
              data-selected={isSelected}
              data-today={!isSelected && contains(tile, today)}
              aria-pressed={isSelected}
              onKeyDown={onTileKeyDown}
              isDisabled={isDisabled(tile)}
              onPress={() => {
                state.setFocusedDate(
                  current.set({ year: tile.year, month: tile.month })
                )
                changeView(VIEWS[VIEWS.indexOf(view) - 1])
              }}
              className={cn(
                "h-full w-full rounded-(--cell-radius) px-1 font-normal",
                "data-[today=true]:bg-muted",
                "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
              )}
            >
              {label(tile)}
            </Button>
          )
        })}
      </fieldset>
    </div>
  )
}

function CaptionButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      slot={null}
      data-slot="calendar-caption"
      variant="ghost"
      size="sm"
      className={cn(
        "cn-calendar-caption relative h-(--cell-size) w-full px-2 text-sm font-medium select-none",
        // `relative`: paint above the full-width absolute nav, which otherwise
        // swallows clicks on the caption.
        // Not `transition-all`: a transitioning `visibility` keeps the caption
        // unfocusable right after the month grid is shown again.
        "transition-[color,background-color,border-color,box-shadow,translate]",
        className as string
      )}
      {...props}
    />
  )
}

function ChevronLeft() {
  return (
    <IconPlaceholder
      lucide="ChevronLeftIcon"
      tabler="IconChevronLeft"
      hugeicons="ArrowLeftIcon"
      phosphor="CaretLeftIcon"
      remixicon="RiArrowLeftSLine"
      className="cn-rtl-flip size-4"
    />
  )
}

function ChevronRight() {
  return (
    <IconPlaceholder
      lucide="ChevronRightIcon"
      tabler="IconChevronRight"
      hugeicons="ArrowRightIcon"
      phosphor="CaretRightIcon"
      remixicon="RiArrowRightSLine"
      className="cn-rtl-flip size-4"
    />
  )
}

function toDates(value: unknown): DateValue[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === "object" && "start" in value) {
    const range = value as { start: DateValue; end: DateValue }
    return [range.start, range.end]
  }
  return [value as DateValue]
}

export { MultiViewCalendar, MultiViewRangeCalendar, type CalendarView }
