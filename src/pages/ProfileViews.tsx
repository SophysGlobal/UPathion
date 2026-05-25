import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Eye, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Range = "daily" | "weekly" | "monthly";

// Deterministic pseudo-random series so the page looks consistent across reloads.
const seededSeries = (count: number, seed: number, max: number) => {
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(Math.round((s / 233280) * max));
  }
  return out;
};

const buildData = (range: Range) => {
  if (range === "daily") {
    const labels = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    });
    return labels.map((label, i) => ({ label, views: seededSeries(14, 7, 60)[i] }));
  }
  if (range === "weekly") {
    const labels = Array.from({ length: 8 }, (_, i) => `W${i + 1}`);
    return labels.map((label, i) => ({ label, views: seededSeries(8, 13, 320)[i] + 40 }));
  }
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return labels.map((label, i) => ({ label, views: seededSeries(12, 19, 1200)[i] + 200 }));
};

const ProfileViews = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>("daily");
  const data = useMemo(() => buildData(range), [range]);

  const total = data.reduce((s, d) => s + d.views, 0);
  const peak = data.reduce((m, d) => (d.views > m.views ? d : m), data[0]);
  const half = Math.floor(data.length / 2);
  const first = data.slice(0, half).reduce((s, d) => s + d.views, 0) || 1;
  const second = data.slice(half).reduce((s, d) => s + d.views, 0);
  const growth = Math.round(((second - first) / first) * 100);

  const ranges: { key: Range; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  const stats = [
    { icon: Eye, label: "Total views", value: total.toLocaleString() },
    {
      icon: TrendingUp,
      label: "Growth",
      value: `${growth >= 0 ? "+" : ""}${growth}%`,
      accent: growth >= 0 ? "text-emerald-500" : "text-destructive",
    },
    { icon: Calendar, label: "Peak day", value: peak?.label ?? "—" },
  ];

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative animate-fade-in">
      <AppHeader
        title="Profile Views"
        subtitle="Who's been checking you out"
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

      <main className="relative z-10 px-5 py-5 space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          {stats.map((s) => (
            <div key={s.label} className="gradient-border">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
                <s.icon className="w-4 h-4 text-primary mb-2" />
                <p className={cn("text-lg font-bold text-foreground", s.accent)}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Range filter */}
        <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                range === r.key
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div
          className="gradient-border animate-fade-in"
          style={{ animationDelay: "120ms", animationFillMode: "both" }}
        >
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.3 }}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#viewsFill)"
                    isAnimationActive
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Profile traffic over the selected period.
        </p>
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default ProfileViews;