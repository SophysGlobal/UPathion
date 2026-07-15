import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, Clock, MapPin, Users, ExternalLink, Check, User as UserIcon } from "lucide-react";
import { USE_SEED_DATA, seedEvents } from "@/data/seedData";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useEventAttendees, useMyRsvps, useRsvpMutation, type LiveEvent } from "@/hooks/useEvents";
import { format, parseISO } from "date-fns";

// Helper function to open Google Maps
const openGoogleMaps = (location: string) => {
  const encodedLocation = encodeURIComponent(location);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  window.open(mapsUrl, '_blank');
};

const EventDetail = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user } = useAuth();

  const isUuid = !!eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);

  const { data: liveEvent } = useQuery({
    queryKey: ["event", eventId],
    enabled: isUuid,
    queryFn: async (): Promise<LiveEvent | null> => {
      const { data } = await supabase.from("events").select("*").eq("id", eventId!).maybeSingle();
      return (data as LiveEvent) ?? null;
    },
  });

  const seedEvent = USE_SEED_DATA ? seedEvents.find((e) => e.id === eventId) : null;

  const event = liveEvent
    ? {
        title: liveEvent.title,
        school: liveEvent.school_name || "",
        date: format(parseISO(liveEvent.starts_at), "EEE MMM d, yyyy"),
        time: liveEvent.all_day ? "All day" : format(parseISO(liveEvent.starts_at), "h:mm a"),
        location: liveEvent.location_name || (liveEvent.location_type === "virtual" ? "Virtual" : "—"),
        attendees: liveEvent.attendee_count,
        description: liveEvent.description,
        capacity: liveEvent.capacity,
        virtual_link: liveEvent.virtual_link,
        address: liveEvent.address,
        creator_id: liveEvent.creator_id,
        id: liveEvent.id,
      }
    : seedEvent
    ? {
        title: seedEvent.title,
        school: seedEvent.school,
        date: seedEvent.date,
        time: seedEvent.time,
        location: seedEvent.location,
        attendees: seedEvent.attendees,
        description: seedEvent.description,
        capacity: seedEvent.maxAttendees,
        virtual_link: null,
        address: null,
        creator_id: null as string | null,
        id: seedEvent.id,
      }
    : null;

  const isCreator = !!(user && event?.creator_id === user.id);
  const { data: myRsvps = [] } = useMyRsvps();
  const isGoing = !!(isUuid && myRsvps.find((r) => r.event_id === eventId && r.status === "going"));
  const rsvp = useRsvpMutation();
  const { data: attendees = [] } = useEventAttendees(isCreator ? eventId : undefined);

  const handleGetDirections = () => {
    if (event?.location && event?.school) {
      // Combine location with school for better search results
      const fullLocation = `${event.location}, ${event.school}`;
      openGoogleMaps(fullLocation);
    } else if (event?.location) {
      openGoogleMaps(event.location);
    } else {
      toast.error('Location not available');
    }
  };

  const handleRsvp = async () => {
    if (!isUuid) return toast.info("Seed events don't accept RSVPs");
    try {
      await rsvp.mutateAsync({ eventId: eventId!, going: !isGoing });
      toast.success(isGoing ? "RSVP cancelled" : "You're going!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not update RSVP");
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-background/80 pb-20 relative">
        
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-4 px-6 py-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Event Not Found</h1>
          </div>
        </header>
        <main className="relative z-10 px-6 py-12 text-center">
          <p className="text-muted-foreground">This event doesn't exist.</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      
      
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground truncate">{event.title}</h1>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* Event Header */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{event.title}</h2>
            <p className="text-sm text-primary">{event.school}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.04s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold text-foreground">{event.date}</p>
              </div>
            </div>
          </div>

          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.08s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-semibold text-foreground">{event.time}</p>
              </div>
            </div>
          </div>

          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.12s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-semibold text-foreground">{event.location}</p>
              </div>
            </div>
          </div>

          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.16s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Attending</p>
                <p className="font-semibold text-foreground">{event.attendees} people</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <Button className="w-full py-6" onClick={handleRsvp} disabled={rsvp.isPending}>
            {isGoing ? <Check className="w-4 h-4 mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
            {isGoing ? "Going — tap to cancel" : "RSVP to Event"}
          </Button>
          <Button 
            variant="outline" 
            className="w-full py-6"
            onClick={handleGetDirections}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Get Directions
          </Button>
        </div>

        {isCreator && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Attendees ({attendees.length}{event.capacity ? ` / ${event.capacity}` : ""})</h3>
            </div>
            {attendees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
            ) : (
              <div className="space-y-2">
                {attendees.map((a) => (
                  <button
                    key={a.user_id}
                    onClick={() => navigate(`/user/${a.user_id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-card/70 border border-border/50 hover:bg-card text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {a.profile?.avatar_url ? (
                        <img src={a.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.profile?.display_name || "Unknown"}</p>
                      {a.profile?.school_name && (
                        <p className="text-xs text-muted-foreground truncate">{a.profile.school_name}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default EventDetail;
