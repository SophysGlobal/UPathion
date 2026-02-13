import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, Clock, MapPin, Users, ExternalLink } from "lucide-react";
import { USE_SEED_DATA, seedEvents } from "@/data/seedData";
import { toast } from "sonner";

// Helper function to open Google Maps
const openGoogleMaps = (location: string) => {
  const encodedLocation = encodeURIComponent(location);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  window.open(mapsUrl, '_blank');
};

const EventDetail = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  
  const event = USE_SEED_DATA 
    ? seedEvents.find(e => e.id === eventId) 
    : null;

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
          <Button className="w-full py-6">
            <Calendar className="w-4 h-4 mr-2" />
            RSVP to Event
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
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default EventDetail;
