import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Bookmark, MapPin, Clock, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import EventDetailModal from "@/components/EventDetailModal";
import { USE_SEED_DATA, seedEvents, type SeedEvent } from "@/data/seedData";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const monthKey = (y: number, m: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}`;

const CATEGORY_DOT: Record<string, string> = {
  Networking: "bg-sky-500",
  Academic: "bg-violet-500",
  Club: "bg-emerald-500",
  Social: "bg-pink-500",
  Career: "bg-amber-500",
  Service: "bg-teal-500",
};

const Events = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [selected, setSelected] = useState<SeedEvent | null>(null);

  // Only events the user is registered for are highlighted; show all but accent RSVP'd.
  const allEvents = USE_SEED_DATA ? seedEvents : [];

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  // Build a rolling 13-month window (3 back, current, 9 forward) for vertical scroll.
  const months = useMemo(() => {
    const list: { year: number; month: number; key: string }[] = [];
    const base = new Date(cursor.year, cursor.month, 1);
    for (let i = -3; i <= 9; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      list.push({ year: d.getFullYear(), month: d.getMonth(), key: monthKey(d.getFullYear(), d.getMonth()) });
    }
    return list;
  }, [cursor.year, cursor.month]);

  const eventsByMonth = useMemo(() => {
    const map = new Map<string, SeedEvent[]>();
    for (const e of allEvents) {
      if (!e.isoDate) continue;
      const [y, m] = e.isoDate.split("-");
      const key = `${y}-${m}`;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.isoDate! < b.isoDate! ? -1 : 1));
    }
    return map;
  }, [allEvents]);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const jumpTo = (year: number, month: number) => {
    const key = monthKey(year, month);
    setCursor({ year, month });
    requestAnimationFrame(() => {
      const el = sectionRefs.current[key];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const stepMonth = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    jumpTo(d.getFullYear(), d.getMonth());
  };

  // Year range for jump selector
  const yearOptions = useMemo(() => {
    const cy = now.getFullYear();
    const arr: number[] = [];
    for (let y = cy - 2; y <= cy + 5; y++) arr.push(y);
    return arr;
  }, [now]);

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AppHeader title="Events" subtitle="Your registered events and upcoming dates" />
      <main className="relative z-10 px-5 py-5 space-y-5 max-w-2xl mx-auto">
        {/* Jump controls */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => stepMonth(-1)}
              className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={cursor.month}
              onChange={(e) => jumpTo(cursor.year, Number(e.target.value))}
              className="bg-secondary/60 hover:bg-secondary text-foreground text-sm rounded-lg px-3 py-1.5 outline-none border border-border/40"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={cursor.year}
              onChange={(e) => jumpTo(Number(e.target.value), cursor.month)}
              className="bg-secondary/60 hover:bg-secondary text-foreground text-sm rounded-lg px-3 py-1.5 outline-none border border-border/40"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => stepMonth(1)}
              className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => jumpTo(now.getFullYear(), now.getMonth())}
              className="ml-auto px-3 py-1.5 text-xs rounded-lg bg-primary/15 hover:bg-primary/25 text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5" /> Today
            </button>
          </div>
        </div>

        {/* Vertical month timeline */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-sm text-destructive py-10">{error}</div>
        ) : (
          <div className="space-y-8">
            {months.map(({ year, month, key }) => {
              const items = eventsByMonth.get(key) ?? [];
              const isCurrent = year === now.getFullYear() && month === now.getMonth();
              return (
                <section
                  key={key}
                  ref={(el) => (sectionRefs.current[key] = el)}
                  className="space-y-3 scroll-mt-24"
                >
                  <div className="flex items-baseline justify-between sticky top-[68px] z-10 bg-background/80 backdrop-blur-sm py-1.5">
                    <h2 className={cn(
                      "text-base font-semibold",
                      isCurrent ? "text-primary" : "text-foreground"
                    )}>
                      {MONTHS[month]} {year}
                    </h2>
                    <span className="text-[11px] text-muted-foreground">
                      {items.length} {items.length === 1 ? "event" : "events"}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                      No events this month
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((ev, i) => {
                        const day = ev.isoDate ? Number(ev.isoDate.split("-")[2]) : 0;
                        return (
                          <button
                            key={ev.id}
                            onClick={() => setSelected(ev)}
                            className="w-full gradient-border animate-fade-in text-left"
                            style={{ animationDelay: `${i * 0.03}s`, animationFillMode: "both" }}
                          >
                            <div className={cn(
                              "rounded-lg p-3 sm:p-4 flex items-stretch gap-3 transition-colors",
                              ev.rsvpd
                                ? "bg-primary/10 hover:bg-primary/15 ring-1 ring-primary/40"
                                : "bg-card/90 hover:bg-card backdrop-blur-sm"
                            )}>
                              <div className="flex flex-col items-center justify-center min-w-[44px] px-2 rounded-md bg-secondary/50">
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {MONTHS[month].slice(0, 3)}
                                </span>
                                <span className="text-lg font-semibold text-foreground leading-none mt-0.5">{day}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "w-2 h-2 rounded-full flex-shrink-0",
                                    CATEGORY_DOT[ev.category ?? "Academic"] ?? "bg-primary",
                                  )} />
                                  <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{ev.time}</span>
                                  <span className="inline-flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{ev.location}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-primary">
                                {ev.rsvpd && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" /> Going
                                  </span>
                                )}
                                {ev.bookmarked && <Bookmark className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
      <EventDetailModal
        event={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onViewFull={(ev) => {
          setSelected(null);
          navigate(`/event/${ev.id}`);
        }}
      />
      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Events;