import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface LiveEvent {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  location_type: "physical" | "virtual" | "hybrid";
  location_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  virtual_link: string | null;
  maps_url: string | null;
  image_url: string | null;
  visibility: "public" | "school_only" | "private";
  school_name: string | null;
  capacity: number | null;
  attendee_count: number;
  moderation_status: string;
}

export function useLiveEvents() {
  return useQuery({
    queryKey: ["live-events"],
    staleTime: 30_000,
    queryFn: async (): Promise<LiveEvent[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_deleted", false)
        .order("starts_at", { ascending: true });
      if (error) {
        console.error("[live-events]", error);
        return [];
      }
      return (data ?? []) as LiveEvent[];
    },
  });
}

export function useMyRsvps() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-rsvps", user?.id],
    enabled: !!user,
    staleTime: 10_000,
    queryFn: async () => {
      if (!user) return [] as { event_id: string; status: string }[];
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("event_id,status")
        .eq("user_id", user.id);
      if (error) return [];
      return data ?? [];
    },
  });
}

export function useRsvpMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, going }: { eventId: string; going: boolean }) => {
      if (!user) throw new Error("Not signed in");
      if (going) {
        const { error } = await supabase
          .from("event_rsvps")
          .upsert(
            { event_id: eventId, user_id: user.id, status: "going" },
            { onConflict: "event_id,user_id" },
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .update({ status: "cancelled" })
          .eq("event_id", eventId)
          .eq("user_id", user.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-rsvps"] });
      qc.invalidateQueries({ queryKey: ["live-events"] });
      qc.invalidateQueries({ queryKey: ["event-attendees"] });
    },
  });
}

export interface Attendee {
  user_id: string;
  status: string;
  created_at: string;
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    school_name: string | null;
  } | null;
}

export function useEventAttendees(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-attendees", eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<Attendee[]> => {
      if (!eventId) return [];
      const { data: rsvps, error } = await supabase
        .from("event_rsvps")
        .select("user_id,status,created_at")
        .eq("event_id", eventId)
        .eq("status", "going")
        .order("created_at", { ascending: false });
      if (error || !rsvps) return [];

      const withProfiles = await Promise.all(
        rsvps.map(async (r) => {
          const { data: profile } = await supabase
            .from("public_profiles")
            .select("id,display_name,avatar_url,school_name")
            .eq("id", r.user_id)
            .maybeSingle();
          return { ...r, profile } as Attendee;
        }),
      );
      return withProfiles;
    },
  });
}