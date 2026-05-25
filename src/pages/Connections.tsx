import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import { GradientInput } from "@/components/ui/GradientInput";
import { Search, ArrowLeft, Users } from "lucide-react";
import { seedPeople } from "@/data/seedData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Connection = {
  id: string;
  name: string;
  headline: string;
  school: string;
  initials: string;
  status: "online" | "away" | "offline";
  lastActive: string;
  avatarColor: string;
};

const STATUS_LABEL: Record<Connection["status"], string> = {
  online: "Active now",
  away: "Away",
  offline: "Offline",
};

const STATUS_RING: Record<Connection["status"], string> = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  offline: "bg-muted-foreground/50",
};

// Deterministic mock data derived from the seed people set so the page feels
// alive even before a real connections backend ships.
const buildConnections = (): Connection[] => {
  const statuses: Connection["status"][] = ["online", "away", "offline"];
  const lastActive = [
    "Just now",
    "5m ago",
    "20m ago",
    "1h ago",
    "3h ago",
    "Yesterday",
    "2d ago",
    "Last week",
  ];
  return seedPeople.map((p, i) => ({
    id: p.id,
    name: p.name,
    headline: p.bio,
    school: p.school,
    initials: p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
    status: statuses[i % statuses.length],
    lastActive: lastActive[i % lastActive.length],
    avatarColor: p.avatarColor,
  }));
};

const Connections = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const all = useMemo(buildConnections, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.school.toLowerCase().includes(q),
    );
  }, [all, query]);

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative animate-fade-in">
      <AppHeader
        title="Connections"
        subtitle={`${all.length} people`}
        leftSlot={
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            aria-label="Back"
            className="-ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />

      <main className="relative z-10 px-5 py-5 space-y-4">
        <div className="relative animate-fade-in">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <GradientInput
            placeholder="Search your connections…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No connections found</h3>
            <p className="text-sm text-muted-foreground">Try a different search term.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((c, i) => (
              <li
                key={c.id}
                className="gradient-border animate-fade-in"
                style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
              >
                <button
                  onClick={() => navigate(`/user/${c.id}`)}
                  className="w-full text-left bg-card/90 backdrop-blur-sm rounded-lg p-3.5 flex items-center gap-3 hover:bg-secondary/40 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-foreground",
                        c.avatarColor,
                      )}
                    >
                      {c.initials}
                    </div>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                        STATUS_RING[c.status],
                      )}
                      aria-label={STATUS_LABEL[c.status]}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {c.lastActive}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.headline}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_RING[c.status])} />
                      <span className="text-[10px] text-muted-foreground">
                        {STATUS_LABEL[c.status]} · Connected
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Connections;