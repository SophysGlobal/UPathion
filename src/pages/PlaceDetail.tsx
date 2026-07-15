import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, Bookmark, ExternalLink } from "lucide-react";
import { USE_SEED_DATA, seedPlaces } from "@/data/seedData";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapsUrlFor, type LivePlace } from "@/hooks/usePlaces";

// Helper function to open Google Maps
const openGoogleMaps = (location: string) => {
  const encodedLocation = encodeURIComponent(location);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  window.open(mapsUrl, '_blank');
};

const PlaceDetail = () => {
  const navigate = useNavigate();
  const { placeId } = useParams();

  const isUuid = !!placeId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(placeId);
  const { data: liveP } = useQuery({
    queryKey: ["place", placeId],
    enabled: isUuid,
    queryFn: async (): Promise<LivePlace | null> => {
      const { data } = await supabase.from("places").select("*").eq("id", placeId!).maybeSingle();
      return (data as LivePlace) ?? null;
    },
  });

  const seedP = USE_SEED_DATA ? seedPlaces.find((p) => p.id === placeId) : null;
  const place = liveP
    ? {
        name: liveP.name,
        type: liveP.category || "Place",
        area: liveP.school_name || liveP.address || "",
        description: liveP.description || "",
        _live: liveP,
      }
    : seedP
    ? { ...seedP, _live: null as LivePlace | null }
    : null;

  const handleGetDirections = () => {
    if (place?._live) {
      const url = mapsUrlFor(place._live);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("No location");
      return;
    }
    if (place?.name && place?.area) {
      const fullLocation = `${place.name}, ${place.area}`;
      openGoogleMaps(fullLocation);
    } else if (place?.area) {
      openGoogleMaps(place.area);
    } else {
      toast.error('Location not available');
    }
  };

  const handleSavePlace = () => {
    toast.success(`${place?.name} saved!`);
  };

  if (!place) {
    return (
      <div className="min-h-screen bg-background/80 pb-20 relative">
        
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-4 px-6 py-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Place Not Found</h1>
          </div>
        </header>
        <main className="relative z-10 px-6 py-12 text-center">
          <p className="text-muted-foreground">This place doesn't exist.</p>
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
          <h1 className="text-lg font-semibold text-foreground truncate">{place.name}</h1>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* Place Header */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{place.name}</h2>
            <span className="px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs">
              {place.type}
            </span>
            <p className="text-sm text-primary mt-3">{place.area}</p>
          </div>
        </div>

        {/* Description */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.04s', animationFillMode: 'both' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">About</h3>
            <p className="text-sm text-muted-foreground">{place.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.08s', animationFillMode: 'both' }}>
          <Button className="w-full py-6" onClick={handleSavePlace}>
            <Bookmark className="w-4 h-4 mr-2" />
            Save Place
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

export default PlaceDetail;
