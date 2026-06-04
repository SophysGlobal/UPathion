import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import EventDetailModal from "@/components/EventDetailModal";
import FullCalendar from "@/components/FullCalendar";
import { USE_SEED_DATA, seedEvents, type SeedEvent } from "@/data/seedData";

const CalendarPage = () => {
  const navigate = useNavigate();
  const events = USE_SEED_DATA ? seedEvents : [];
  const [selected, setSelected] = useState<SeedEvent | null>(null);

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AppHeader title="Calendar" subtitle="Your events at a glance" />
      <main className="relative z-10 px-5 py-6 space-y-6">
        <FullCalendar events={events} onSelectEvent={setSelected} />
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

export default CalendarPage;