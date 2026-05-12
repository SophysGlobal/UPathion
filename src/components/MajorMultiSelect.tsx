import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { searchMajors } from "@/data/majors";
import { cn } from "@/lib/utils";

interface MajorMultiSelectProps {
  /** Comma-separated string of selected majors (matches profiles.major schema). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxSelections?: number;
  className?: string;
}

const splitMajors = (raw: string): string[] =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const MajorMultiSelect = ({
  value,
  onChange,
  placeholder = "Search majors...",
  maxSelections = 3,
  className,
}: MajorMultiSelectProps) => {
  const selected = useMemo(() => splitMajors(value), [value]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => searchMajors(query, 80), [query]);

  const toggle = (major: string) => {
    if (selected.includes(major)) {
      onChange(selected.filter((m) => m !== major).join(", "));
    } else if (selected.length < maxSelections) {
      onChange([...selected, major].join(", "));
    }
  };

  const remove = (major: string) =>
    onChange(selected.filter((m) => m !== major).join(", "));

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-12 px-3 py-2 rounded-lg bg-card border border-border hover:border-muted-foreground/60 transition-colors flex items-center gap-2 text-left"
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
          {selected.length === 0 ? (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {m}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(m);
                  }}
                  className="hover:text-destructive"
                  aria-label={`Remove ${m}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden animate-fade-in">
          <div className="px-3 py-2 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full h-9 pl-8 pr-2 rounded-md bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {!query && (
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
                Popular first · {maxSelections} max
              </p>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {results.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                No majors match your search
              </p>
            ) : (
              results.map((m) => {
                const isSelected = selected.includes(m);
                const disabled = !isSelected && selected.length >= maxSelections;
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(m)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors border-b border-border/30 last:border-0",
                      isSelected
                        ? "bg-primary/10 text-foreground"
                        : "text-foreground hover:bg-secondary/50",
                      disabled && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <span className="truncate">{m}</span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 ml-2">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MajorMultiSelect;