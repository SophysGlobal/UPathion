import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useSuspensionStatus } from "@/hooks/useSuspensionStatus";
import { useFilteredVisibility } from "@/hooks/useVisibilityOptions";
import { isValidGoogleMapsUrl } from "@/hooks/usePlaces";
import { ArrowLeft } from "lucide-react";

const CATEGORIES = [
  "Study spot","Restaurant","Café","Library","Recreation",
  "Campus building","Housing","Shopping","Health","Transportation","Scenic","Other",
] as const;

const VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "school_only", label: "School only" },
  { value: "private", label: "Private (only me)" },
] as const;

type InputMode = "maps" | "coords";

const CreatePlace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfileCompletion();
  const { isSuspended } = useSuspensionStatus();
  const visibilityOptions = useFilteredVisibility(VISIBILITY);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Study spot");
  const [mode, setMode] = useState<InputMode>("maps");
  const [mapsUrl, setMapsUrl] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [address, setAddress] = useState("");
  const [visibility, setVisibility] = useState<"public" | "school_only" | "private">("public");
  const [attachSchool, setAttachSchool] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("Sign in first");
    if (isSuspended) return toast.error("Your account is suspended");
    const n = name.trim();
    if (n.length < 2) return toast.error("Name is too short");
    if (n.length > 120) return toast.error("Name is too long");

    let latitude: number | null = null;
    let longitude: number | null = null;
    let google_maps_url: string | null = null;

    if (mode === "maps") {
      const url = mapsUrl.trim();
      if (!url) return toast.error("Paste a Google Maps link");
      if (!isValidGoogleMapsUrl(url)) return toast.error("That doesn't look like a Google Maps link");
      google_maps_url = url;
    } else {
      const la = parseFloat(lat);
      const lo = parseFloat(lng);
      if (!Number.isFinite(la) || la < -90 || la > 90) return toast.error("Latitude must be -90 to 90");
      if (!Number.isFinite(lo) || lo < -180 || lo > 180) return toast.error("Longitude must be -180 to 180");
      latitude = la;
      longitude = lo;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        creator_id: user.id,
        name: n,
        description: description.trim() || null,
        category,
        latitude,
        longitude,
        google_maps_url,
        address: address.trim() || null,
        visibility,
      };
      if (attachSchool && profile?.school_name) {
        payload.school_name = profile.school_name;
      }
      const { data, error } = await supabase
        .from("places")
        .insert(payload as never)
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Place added!");
      navigate(data?.id ? `/place/${data.id}` : "/explore?tab=places");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not add place";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/80 pb-24">
      <AppHeader title="Add a place" subtitle="Share a spot with your community" />
      <main className="relative z-10 px-5 py-6 max-w-2xl mx-auto space-y-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="space-y-2">
          <Label>Place name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="e.g. Snell Library 4th Floor" />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} placeholder="What makes it worth visiting?" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

        <div className="space-y-2">
          <Label>Location</Label>
          <div className="flex gap-2 p-1 bg-secondary/50 rounded-full w-fit text-xs">
            {(["maps","coords"] as InputMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-full ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {m === "maps" ? "Google Maps link" : "Coordinates"}
              </button>
            ))}
          </div>
        </div>

        {mode === "maps" ? (
          <div className="space-y-2">
            <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." />
            <p className="text-xs text-muted-foreground">Open Google Maps → Share → Copy link.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude (e.g. 42.3398)" />
            <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude (e.g. -71.0892)" />
          </div>
        )}

        <div className="space-y-2">
          <Label>Address (optional)</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
        </div>

        {profile?.school_name && (
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
            <div>
              <Label>Associate with my school</Label>
              <p className="text-xs text-muted-foreground">{profile.school_name}</p>
            </div>
            <Switch checked={attachSchool} onCheckedChange={setAttachSchool} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={() => navigate(-1)} disabled={submitting}>Cancel</Button>
          <Button className="flex-1" onClick={submit} disabled={submitting}>
            {submitting ? "Adding…" : "Add place"}
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default CreatePlace;