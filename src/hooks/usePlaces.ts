import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LivePlace {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  google_maps_url: string | null;
  visibility: "public" | "school_only" | "private";
  school_name: string | null;
  created_at: string;
}

export function useLivePlaces() {
  return useQuery({
    queryKey: ["live-places"],
    staleTime: 30_000,
    queryFn: async (): Promise<LivePlace[]> => {
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("[live-places]", error);
        return [];
      }
      return (data ?? []) as LivePlace[];
    },
  });
}

/**
 * Build a Google Maps URL from either a raw maps URL or coordinates.
 * Also validates a user-provided URL is actually a Google Maps link.
 */
export function isValidGoogleMapsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      /^(www\.)?google\.[a-z.]+$/i.test(u.hostname) &&
      (u.pathname.startsWith("/maps") || u.searchParams.has("q")) ||
      u.hostname === "maps.app.goo.gl" ||
      u.hostname === "goo.gl"
    );
  } catch {
    return false;
  }
}

export function mapsUrlFor(place: {
  google_maps_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
}): string | null {
  if (place.google_maps_url && isValidGoogleMapsUrl(place.google_maps_url)) {
    return place.google_maps_url;
  }
  if (place.latitude != null && place.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }
  if (place.name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
  }
  return null;
}