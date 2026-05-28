import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Bookmark, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeedEvent } from "@/data/seedData";

const CATEGORY_COLORS: Record<string, string> = {
  Networking: "bg-sky-500/80 text-white",
  Academic: "bg-violet-500/80 text-white",
  Club: "bg-emerald-500/80 text-white",
  Social: "bg-pink-500/80 text-white",
  Career: "bg-amber-500/90 text-black",
  Service: "bg-teal-500/80 text-white",
};

const CATEGORY_DOT: Record<string, string> = {
  Networking: "bg-sky-500",
  Academic: "bg-violet-500",
  Club: "bg-emerald-500",
  Social: "bg-pink-500",
  Career: "bg-amber-500",
  Service: "bg-teal-500",
};

interface EventCalendarProps {
  events: SeedEvent[];
  onSelectEvent: (e: SeedEvent) => void;
}

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const fmtMonth = (d: Date) =>
  d.toLocaleString(undefined, { month: "long", year: "numeric" });

const EventCalendar = ({ events, onSelectEvent }: EventCalendarProps) => {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const startDay = first.getDay(); // 0=Sun
    const daysInMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
    ).getDate();
    const cells: { date: Date | null; iso: string | null }[] = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null, iso: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date, iso });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, iso: null });
    return cells;
  }, [cursor]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, SeedEvent[]>();
    events.forEach((e) => {
      if (!e.isoDate) return;
      const arr = map.get(e.isoDate) ?? [];
      arr.push(e);
      map.set(e.isoDate, arr);
    });
    return map;
  }, [events]);

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => !!e.isoDate)
        .sort((a, b) => (a.isoDate! < b.isoDate! ? -1 : 1))
        .slice(0, 6),
    [events],
  );

  return (
    <div className="space-y-5">
      {/* Month header */}
      <div className="flex items-center justify-between animate-fade-in">
        <h2 className="text-lg font-semibold text-foreground">{fmtMonth(cursor)}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="px-3 py-1.5 text-xs rounded-lg bg-secondary/60 hover:bg-secondary text-foreground transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="gradient-border animate-fade-in">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-[10px] sm:text-xs font-medium text-muted-foreground text-center py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, idx) => {
              const isToday = cell.iso === todayIso;
              const dayEvents = cell.iso ? eventsByDate.get(cell.iso) ?? [] : [];
              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[64px] sm:min-h-[88px] rounded-md p-1 sm:p-1.5 text-left transition-colors",
                    cell.date
                      ? "bg-secondary/20 hover:bg-secondary/40"
                      : "bg-transparent",
                    isToday && "ring-1 ring-primary/60 bg-primary/10",
                  )}
                >
                  {cell.date && (
                    <>
                      <div
                        className={cn(
                          "text-[10px] sm:text-xs font-medium mb-1",
                          isToday ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {cell.date.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => onSelectEvent(ev)}
                            className={cn(
                              "w-full truncate rounded px-1 py-0.5 text-[9px] sm:text-[10px] font-medium text-left transition-transform hover:scale-[1.02]",
                              CATEGORY_COLORS[ev.category ?? "Academic"] ??
                                "bg-primary/70 text-primary-foreground",
                            )}
                            title={ev.title}
                          >
                            <span className="inline-flex items-center gap-0.5">
                              {ev.rsvpd && <Check className="w-2.5 h-2.5" />}
                              {ev.bookmarked && (
                                <Bookmark className="w-2.5 h-2.5" />
                              )}
                              <span className="truncate">{ev.title}</span>
                            </span>
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <button
                            onClick={() => onSelectEvent(dayEvents[0])}
                            className="text-[9px] sm:text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            +{dayEvents.length - 2} more
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="gradient-border animate-fade-in">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Legend</p>
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-xs text-foreground">
              <Check className="w-3 h-3 text-primary" />
              RSVP'd
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-xs text-foreground">
              <Bookmark className="w-3 h-3 text-primary" />
              Bookmarked
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming list */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Upcoming</p>
        <div className="space-y-2">
          {upcoming.map((ev, i) => (
            <button
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              className="w-full gradient-border animate-fade-in text-left"
              style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "both" }}
            >
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 hover:bg-card transition-colors">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full flex-shrink-0",
                    CATEGORY_DOT[ev.category ?? "Academic"] ?? "bg-primary",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {ev.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {ev.date} · {ev.time} · {ev.location}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {ev.rsvpd && <Check className="w-3.5 h-3.5 text-primary" />}
                  {ev.bookmarked && <Bookmark className="w-3.5 h-3.5 text-primary" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;