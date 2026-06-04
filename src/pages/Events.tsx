import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import EventDetailModal from "@/components/EventDetailModal";
import FullCalendar from "@/components/FullCalendar";
import { USE_SEED_DATA, seedEvents, type SeedEvent } from "@/data/seedData";
import { CalendarDays } from "lucide-react";

const Events = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [selected, setSelected] = useState<SeedEvent | null>(null);

  const events = USE_SEED_DATA ? seedEvents : [];

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AppHeader title="Events" subtitle="Your calendar, events, and registrations" />
      <main className="relative z-10 px-4 sm:px-5 py-5 space-y-5 max-w-4xl mx-auto">
        {loading ? (
          <div className="space-y-3">
            <div className="h-16 rounded-lg bg-secondary/30 animate-pulse" />
            <div className="h-[480px] rounded-lg bg-secondary/30 animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-center text-sm text-destructive py-10">{error}</div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 p-10 text-center">
            <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-sm text-muted-foreground">No events yet</p>
          </div>
        ) : (
          <FullCalendar events={events} onSelectEvent={setSelected} />
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