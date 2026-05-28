import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Bookmark,
  Check,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeedEvent } from "@/data/seedData";

const CATEGORY_BG: Record<string, string> = {
  Networking: "bg-sky-500/15 text-sky-400",
  Academic: "bg-violet-500/15 text-violet-400",
  Club: "bg-emerald-500/15 text-emerald-400",
  Social: "bg-pink-500/15 text-pink-400",
  Career: "bg-amber-500/15 text-amber-400",
  Service: "bg-teal-500/15 text-teal-400",
};

interface EventDetailModalProps {
  event: SeedEvent | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onViewFull?: (e: SeedEvent) => void;
}

const EventDetailModal = ({
  event,
  open,
  onOpenChange,
  onViewFull,
}: EventDetailModalProps) => {
  const [rsvpd, setRsvpd] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setRsvpd(!!event?.rsvpd);
    setBookmarked(!!event?.bookmarked);
  }, [event]);

  if (!event) return null;
  const cat = event.category ?? "Academic";
  const max = event.maxAttendees ?? Math.max(event.attendees + 20, 50);
  const pct = Math.min(100, Math.round((event.attendees / max) * 100));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-[calc(100%-2rem)] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50 max-h-[90dvh] flex flex-col"
      >
        <div className="gradient-bg p-5">
          <span
            className={cn(
              "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-white/20 text-white",
            )}
          >
            {cat}
          </span>
          <DialogHeader className="mt-2">
            <DialogTitle className="text-xl font-bold text-primary-foreground text-left">
              {event.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-primary-foreground/80 text-xs mt-1">{event.school}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {event.description && (
            <p className="text-sm text-foreground/90 leading-relaxed">
              {event.description}
            </p>
          )}

          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{event.location}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" /> Participants
              </span>
              <span className="text-foreground font-medium">
                {event.attendees} / {max}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full gradient-bg transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                CATEGORY_BG[cat] ?? "bg-secondary text-foreground",
              )}
            >
              {cat}
            </span>
            {rsvpd && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
                <Check className="w-3 h-3" /> RSVP'd
              </span>
            )}
            {bookmarked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
                <Bookmark className="w-3 h-3" /> Saved
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-border/40 p-4 flex items-center gap-2 bg-card/80">
          <Button
            variant={rsvpd ? "secondary" : "default"}
            className="flex-1"
            onClick={() => setRsvpd((r) => !r)}
          >
            {rsvpd ? "RSVP'd" : "RSVP"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setBookmarked((b) => !b)}
            aria-label="Bookmark event"
          >
            <Bookmark
              className={cn("w-4 h-4", bookmarked && "fill-current text-primary")}
            />
          </Button>
          {onViewFull && (
            <Button variant="ghost" size="icon" onClick={() => onViewFull(event)} aria-label="View full event">
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;