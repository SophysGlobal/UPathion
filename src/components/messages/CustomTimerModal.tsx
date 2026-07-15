import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatExpirationLabel } from "@/hooks/useMessages";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSeconds?: number | null;
  onSave: (seconds: number) => void | Promise<void>;
}

const HOURS = Array.from({ length: 24 * 365 + 1 }, (_, i) => i); // 0..8760
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function Wheel({
  values,
  value,
  onChange,
  label,
  formatter = (v) => String(v).padStart(2, "0"),
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
  formatter?: (v: number) => string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="relative w-24 h-48 rounded-2xl border border-border/60 bg-secondary/30 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/90 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 rounded-lg border border-primary/40 bg-primary/5 z-0" />
        <ScrollArea className="h-full">
          <div className="py-[76px]">
            {values.map((v) => {
              const active = v === value;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange(v)}
                  className={cn(
                    "block w-full text-center h-10 leading-10 text-lg transition-all",
                    active
                      ? "text-primary font-semibold scale-110"
                      : "text-muted-foreground/70 hover:text-foreground",
                  )}
                >
                  {formatter(v)}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default function CustomTimerModal({ open, onOpenChange, initialSeconds, onSave }: Props) {
  const initial = useMemo(() => {
    const s = initialSeconds ?? 24 * 3600;
    return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60) };
  }, [initialSeconds]);

  const [hours, setHours] = useState(initial.h);
  const [minutes, setMinutes] = useState(initial.m);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setHours(initial.h);
      setMinutes(initial.m);
    }
  }, [open, initial.h, initial.m]);

  const totalSeconds = hours * 3600 + minutes * 60;
  const min = 60; // 1 minute
  const max = 365 * 24 * 3600;
  const valid = totalSeconds >= min && totalSeconds <= max;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await onSave(totalSeconds);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Custom disappearing timer</DialogTitle>
          <DialogDescription>
            Messages disappear this long after being read. Min 1 minute, max 365 days.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start justify-center gap-6 py-4">
          <Wheel
            label="Hours"
            values={HOURS}
            value={hours}
            onChange={setHours}
            formatter={(v) => String(v)}
          />
          <Wheel label="Minutes" values={MINUTES} value={minutes} onChange={setMinutes} />
        </div>

        <div className="rounded-xl bg-secondary/40 border border-border/50 p-3 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Preview</p>
          <p className="text-sm font-medium">
            {valid ? formatExpirationLabel(totalSeconds) : "Choose at least 1 minute"}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!valid || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}