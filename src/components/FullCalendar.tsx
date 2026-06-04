import { useMemo, useState, useEffect, useRef } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Bookmark, Check, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeedEvent } from "@/data/seedData";

export type CalendarView = "month" | "week" | "day";

const CATEGORY_COLORS: Record<string, string> = {
  Networking: "bg-sky-500/85 text-white",
  Academic: "bg-violet-500/85 text-white",
  Club: "bg-emerald-500/85 text-white",
  Social: "bg-pink-500/85 text-white",
  Career: "bg-amber-500/90 text-black",
  Service: "bg-teal-500/85 text-white",
};

const CATEGORY_DOT: Record<string, string> = {
  Networking: "bg-sky-500",
  Academic: "bg-violet-500",
  Club: "bg-emerald-500",
  Social: "bg-pink-500",
  Career: "bg-amber-500",
  Service: "bg-teal-500",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface FullCalendarProps {
  events: SeedEvent[];
  onSelectEvent: (e: SeedEvent) => void;
}

const parseEventDate = (iso?: string): Date | null => {
  if (!iso) return null;
  try {
    return startOfDay(parseISO(iso));
  } catch {
    return null;
  }
};

const FullCalendar = ({ events, onSelectEvent }: FullCalendarProps) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState<Date>(today);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);

  // Index events by date string for fast lookup
  const eventsByDay = useMemo(() => {
    const map = new Map<string, SeedEvent[]>();
    for (const ev of events) {
      const d = parseEventDate(ev.isoDate);
      if (!d) continue;
      const key = format(d, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const eventsForDay = (d: Date) => eventsByDay.get(format(d, "yyyy-MM-dd")) ?? [];

  const goPrev = () => {
    setCursor((c) => (view === "month" ? subMonths(c, 1) : view === "week" ? subWeeks(c, 1) : addDays(c, -1)));
    setTransitionKey((k) => k + 1);
  };
  const goNext = () => {
    setCursor((c) => (view === "month" ? addMonths(c, 1) : view === "week" ? addWeeks(c, 1) : addDays(c, 1)));
    setTransitionKey((k) => k + 1);
  };
  const goToday = () => {
    setCursor(today);
    setTransitionKey((k) => k + 1);
  };

  const openDay = (d: Date) => {
    setSelectedDay(d);
    setDayModalOpen(true);
  };

  const yearOptions = useMemo(() => {
    const cy = today.getFullYear();
    const arr: number[] = [];
    for (let y = cy - 3; y <= cy + 6; y++) arr.push(y);
    return arr;
  }, [today]);

  const headerLabel =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "week"
      ? `Week of ${format(startOfWeek(cursor), "MMM d, yyyy")}`
      : format(cursor, "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="gradient-border animate-fade-in">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary/15 hover:bg-primary/25 text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5" /> Today
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-semibold text-foreground ml-1 mr-auto">
            {headerLabel}
          </h2>

          <div className="flex items-center gap-2">
            <select
              value={cursor.getMonth()}
              onChange={(e) => {
                const d = new Date(cursor);
                d.setMonth(Number(e.target.value));
                setCursor(d);
                setTransitionKey((k) => k + 1);
              }}
              className="bg-secondary/60 hover:bg-secondary text-foreground text-xs sm:text-sm rounded-lg px-2 py-1.5 outline-none border border-border/40"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={cursor.getFullYear()}
              onChange={(e) => {
                const d = new Date(cursor);
                d.setFullYear(Number(e.target.value));
                setCursor(d);
                setTransitionKey((k) => k + 1);
              }}
              className="bg-secondary/60 hover:bg-secondary text-foreground text-xs sm:text-sm rounded-lg px-2 py-1.5 outline-none border border-border/40"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <div className="inline-flex rounded-lg bg-secondary/50 p-0.5 border border-border/40">
              {(["month", "week", "day"] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setView(v);
                    setTransitionKey((k) => k + 1);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md capitalize transition-colors",
                    view === v
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View body */}
      <div key={transitionKey} className="animate-fade-in">
        {view === "month" && (
          <MonthView
            cursor={cursor}
            today={today}
            eventsForDay={eventsForDay}
            onSelectEvent={onSelectEvent}
            onOpenDay={openDay}
          />
        )}
        {view === "week" && (
          <WeekView
            cursor={cursor}
            today={today}
            eventsForDay={eventsForDay}
            onSelectEvent={onSelectEvent}
            onOpenDay={openDay}
          />
        )}
        {view === "day" && (
          <DayView
            cursor={cursor}
            today={today}
            events={eventsForDay(cursor)}
            onSelectEvent={onSelectEvent}
          />
        )}
      </div>

      {/* Legend */}
      <div className="gradient-border animate-fade-in">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 sm:p-4">
          <p className="text-[11px] font-medium text-muted-foreground mb-2">Categories</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_DOT).map(([label, dot]) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-xs text-foreground"
              >
                <span className={cn("w-2 h-2 rounded-full", dot)} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Day events modal */}
      <DayEventsModal
        open={dayModalOpen}
        onOpenChange={setDayModalOpen}
        day={selectedDay}
        events={selectedDay ? eventsForDay(selectedDay) : []}
        onSelectEvent={(e) => {
          setDayModalOpen(false);
          onSelectEvent(e);
        }}
      />
    </div>
  );
};

/* -------------------- Month view -------------------- */
const MonthView = ({
  cursor,
  today,
  eventsForDay,
  onSelectEvent,
  onOpenDay,
}: {
  cursor: Date;
  today: Date;
  eventsForDay: (d: Date) => SeedEvent[];
  onSelectEvent: (e: SeedEvent) => void;
  onOpenDay: (d: Date) => void;
}) => {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  return (
    <div className="gradient-border">
      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-[10px] sm:text-xs font-medium text-muted-foreground text-center py-1.5"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const inMonth = isSameMonth(day, cursor);
            const isCurrentDay = isSameDay(day, today);
            const dayEvents = eventsForDay(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => onOpenDay(day)}
                className={cn(
                  "min-h-[70px] sm:min-h-[96px] rounded-md p-1 sm:p-1.5 text-left transition-all hover:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/50",
                  inMonth ? "bg-secondary/20" : "bg-transparent opacity-50",
                  isCurrentDay && "ring-1 ring-primary/70 bg-primary/10"
                )}
              >
                <div
                  className={cn(
                    "text-[11px] sm:text-xs font-medium mb-1 flex items-center justify-between",
                    isCurrentDay
                      ? "text-primary"
                      : inMonth
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center",
                      isCurrentDay &&
                        "w-5 h-5 rounded-full bg-primary text-primary-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[9px] text-muted-foreground">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      className={cn(
                        "block truncate rounded px-1 py-0.5 text-[9px] sm:text-[10px] font-medium cursor-pointer hover:scale-[1.02] transition-transform",
                        CATEGORY_COLORS[ev.category ?? "Academic"] ??
                          "bg-primary/70 text-primary-foreground"
                      )}
                      title={ev.title}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {ev.rsvpd && <Check className="w-2.5 h-2.5" />}
                        <span className="truncate">{ev.title}</span>
                      </span>
                    </span>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="block text-[9px] sm:text-[10px] text-muted-foreground px-1">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* -------------------- Week view -------------------- */
const WeekView = ({
  cursor,
  today,
  eventsForDay,
  onSelectEvent,
  onOpenDay,
}: {
  cursor: Date;
  today: Date;
  eventsForDay: (d: Date) => SeedEvent[];
  onSelectEvent: (e: SeedEvent) => void;
  onOpenDay: (d: Date) => void;
}) => {
  const weekStart = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="gradient-border">
      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 space-y-2">
        {days.map((day) => {
          const dayEvents = eventsForDay(day);
          const isCurrentDay = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "rounded-lg p-3 flex gap-3 items-start transition-colors",
                isCurrentDay
                  ? "bg-primary/10 ring-1 ring-primary/40"
                  : "bg-secondary/20 hover:bg-secondary/30"
              )}
            >
              <button
                onClick={() => onOpenDay(day)}
                className="flex flex-col items-center justify-center min-w-[52px] py-1.5 rounded-md bg-secondary/40 hover:bg-secondary/60 transition-colors"
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {format(day, "EEE")}
                </span>
                <span
                  className={cn(
                    "text-xl font-semibold leading-none mt-0.5",
                    isCurrentDay ? "text-primary" : "text-foreground"
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
              <div className="flex-1 min-w-0 space-y-1.5">
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No events</p>
                ) : (
                  dayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className={cn(
                        "w-full rounded-md px-3 py-2 text-left transition-transform hover:scale-[1.01]",
                        CATEGORY_COLORS[ev.category ?? "Academic"] ??
                          "bg-primary/70 text-primary-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold truncate">
                          {ev.title}
                        </span>
                        {ev.rsvpd && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                            <Check className="w-2.5 h-2.5" /> Going
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[10px] opacity-90">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {ev.time}
                        </span>
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="w-2.5 h-2.5" /> {ev.location}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------- Day view (agenda) -------------------- */
const DayView = ({
  cursor,
  today,
  events,
  onSelectEvent,
}: {
  cursor: Date;
  today: Date;
  events: SeedEvent[];
  onSelectEvent: (e: SeedEvent) => void;
}) => {
  const isCurrentDay = isSameDay(cursor, today);
  return (
    <div className="gradient-border">
      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] py-2 rounded-lg",
              isCurrentDay ? "bg-primary/20" : "bg-secondary/40"
            )}
          >
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {format(cursor, "EEE")}
            </span>
            <span
              className={cn(
                "text-2xl font-semibold leading-none mt-0.5",
                isCurrentDay ? "text-primary" : "text-foreground"
              )}
            >
              {cursor.getDate()}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {format(cursor, "MMM yyyy")}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {format(cursor, "EEEE")}
            </p>
            <p className="text-xs text-muted-foreground">
              {events.length} {events.length === 1 ? "event" : "events"} scheduled
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 p-8 text-center">
            <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-sm text-muted-foreground">No events scheduled</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Enjoy your free day!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="w-full text-left rounded-lg p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors flex gap-3"
              >
                <span
                  className={cn(
                    "w-1.5 rounded-full flex-shrink-0",
                    CATEGORY_DOT[ev.category ?? "Academic"] ?? "bg-primary"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {ev.title}
                    </p>
                    <div className="flex items-center gap-1 text-primary flex-shrink-0">
                      {ev.rsvpd && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/20 px-2 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" /> Going
                        </span>
                      )}
                      {ev.bookmarked && <Bookmark className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {ev.time}
                    </span>
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3" /> {ev.location}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------- Day events modal -------------------- */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DayEventsModal = ({
  open,
  onOpenChange,
  day,
  events,
  onSelectEvent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  day: Date | null;
  events: SeedEvent[];
  onSelectEvent: (e: SeedEvent) => void;
}) => {
  if (!day) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85dvh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{format(day, "EEEE, MMMM d, yyyy")}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto -mx-2 px-2 space-y-2">
          {events.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No events scheduled for this day.
            </div>
          ) : (
            events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="w-full text-left rounded-lg p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors flex gap-3"
              >
                <span
                  className={cn(
                    "w-1.5 rounded-full flex-shrink-0",
                    CATEGORY_DOT[ev.category ?? "Academic"] ?? "bg-primary"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {ev.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {ev.time}
                    </span>
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3" /> {ev.location}
                    </span>
                  </div>
                </div>
                {ev.rsvpd && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/20 text-primary px-2 py-0.5 rounded-full self-start">
                    <Check className="w-2.5 h-2.5" /> Going
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullCalendar;