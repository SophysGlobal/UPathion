import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useSuspensionStatus } from "@/hooks/useSuspensionStatus";
import { useFilteredVisibility, useCanUseSchoolOnly } from "@/hooks/useVisibilityOptions";
import { ArrowLeft } from "lucide-react";

const EVENT_TYPES = [
  "Academic","Social","Networking","Career","Club","Athletics",
  "Arts","Workshop","Conference","Volunteer","Virtual","Other",
] as const;

const VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "school_only", label: "School only" },
  { value: "private", label: "Private (invite-only)" },
] as const;

const LOCATION_TYPES = [
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
  { value: "hybrid", label: "Hybrid" },
] as const;

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfileCompletion();
  const { isSuspended } = useSuspensionStatus();
  const { canUseSchoolOnly } = useCanUseSchoolOnly();
  const visibilityOptions = useFilteredVisibility(VISIBILITY);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<string>("Social");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [locationType, setLocationType] = useState<"physical" | "virtual" | "hybrid">("physical");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [virtualLink, setVirtualLink] = useState("");
  const [visibility, setVisibility] = useState<"public" | "school_only" | "private">(
    canUseSchoolOnly ? "school_only" : "public",
  );
  const [capacityEnabled, setCapacityEnabled] = useState(false);
  const [capacity, setCapacity] = useState("");
  const [attachSchool, setAttachSchool] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("Sign in first");
    if (isSuspended) return toast.error("Your account is suspended");
    const t = title.trim();
    if (t.length < 2) return toast.error("Title is too short");
    if (t.length > 140) return toast.error("Title is too long");
    if (!startDate) return toast.error("Start date is required");
    if (!allDay && !startTime) return toast.error("Start time is required");

    const startsAt = new Date(`${startDate}T${allDay ? "00:00" : startTime}`);
    if (isNaN(startsAt.getTime())) return toast.error("Invalid start date/time");
    let endsAt: Date | null = null;
    if (endDate) {
      endsAt = new Date(`${endDate}T${allDay ? "23:59" : endTime || startTime}`);
      if (isNaN(endsAt.getTime())) return toast.error("Invalid end date/time");
      if (endsAt < startsAt) return toast.error("End must be after start");
    }
    if (startsAt.getTime() < Date.now() - 60_000) {
      return toast.error("Start time is in the past");
    }

    if (locationType !== "virtual" && !locationName.trim()) {
      return toast.error("Add a location name");
    }
    if (locationType !== "physical" && !virtualLink.trim()) {
      return toast.error("Add a virtual meeting link");
    }

    let cap: number | null = null;
    if (capacityEnabled) {
      const n = parseInt(capacity, 10);
      if (!Number.isFinite(n) || n < 1) return toast.error("Capacity must be a positive whole number");
      cap = n;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        creator_id: user.id,
        title: t,
        description: description.trim() || null,
        event_type: eventType,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt?.toISOString() ?? null,
        all_day: allDay,
        location_type: locationType,
        location_name: locationName.trim() || null,
        address: address.trim() || null,
        virtual_link: virtualLink.trim() || null,
        visibility,
        capacity: cap,
      };
      if (attachSchool && profile?.school_name) {
        payload.school_name = profile.school_name;
      }
      const { data, error } = await supabase
        .from("events")
        .insert(payload as never)
        .select("id")
        .single();
      if (error) throw error;
      // Auto-RSVP creator so it lands in their calendar.
      if (data?.id) {
        await supabase.from("event_rsvps").insert({
          event_id: data.id,
          user_id: user.id,
          status: "going",
        } as never);
      }
      toast.success("Event created!");
      navigate(data?.id ? `/event/${data.id}` : "/explore?tab=events");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not create event";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/80 pb-24">
      <AppHeader title="Create event" subtitle="Add something to the community calendar" />
      <main className="relative z-10 px-5 py-6 max-w-2xl mx-auto space-y-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="space-y-2">
          <Label>Event name</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="e.g. Alumni Networking Night" />
          <p className="text-xs text-muted-foreground">{title.length}/140</p>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} placeholder="What's happening?" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Who can see</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
          <Label htmlFor="all-day" className="cursor-pointer">All-day event</Label>
          <Switch id="all-day" checked={allDay} onCheckedChange={setAllDay} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          {!allDay && (
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>End date (optional)</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          {!allDay && (
            <div className="space-y-2">
              <Label>End time (optional)</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Location type</Label>
          <Select value={locationType} onValueChange={(v) => setLocationType(v as typeof locationType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LOCATION_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {locationType !== "virtual" && (
          <>
            <div className="space-y-2">
              <Label>Venue / place name</Label>
              <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Student Center" />
            </div>
            <div className="space-y-2">
              <Label>Address (optional)</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
            </div>
          </>
        )}
        {locationType !== "physical" && (
          <div className="space-y-2">
            <Label>Meeting link</Label>
            <Input value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)} placeholder="https://…" />
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
          <Label htmlFor="cap-toggle" className="cursor-pointer">Limit capacity</Label>
          <Switch id="cap-toggle" checked={capacityEnabled} onCheckedChange={setCapacityEnabled} />
        </div>
        {capacityEnabled && (
          <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Max attendees" />
        )}

        {profile?.school_name && (
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
            <div>
              <Label className="cursor-pointer">Associate with my school</Label>
              <p className="text-xs text-muted-foreground">{profile.school_name}</p>
            </div>
            <Switch checked={attachSchool} onCheckedChange={setAttachSchool} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={() => navigate(-1)} disabled={submitting}>Cancel</Button>
          <Button className="flex-1" onClick={submit} disabled={submitting}>
            {submitting ? "Creating…" : "Create event"}
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default CreateEvent;