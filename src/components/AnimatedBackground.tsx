import { memo } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Persistent animated background. Mounted once at App.tsx root level.
 * All blur elements use translateZ(0) to force GPU compositing layers,
 * preventing tiled/square redraw artifacts from CSS blur filters.
 */
const AnimatedBackground = () => {
  const { resolvedTheme } = useTheme();

  // Shared style to force GPU compositing and prevent square artifacts
  const gpuLayer: React.CSSProperties = { transform: 'translateZ(0)', backfaceVisibility: 'hidden' };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" style={gpuLayer}>
      {/* Morphing gradient blobs */}
      <div className="absolute top-0 -left-1/4 w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] bg-primary/25 rounded-full blur-[120px] animate-morph-1" style={gpuLayer} />
      <div className="absolute -top-20 right-0 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-accent/20 rounded-full blur-[100px] animate-morph-2" style={gpuLayer} />
      <div className="absolute bottom-0 left-1/3 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-primary/20 rounded-full blur-[140px] animate-morph-3" style={gpuLayer} />

      {/* Secondary pulsing orbs */}
      <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-accent/30 rounded-full blur-[60px] animate-pulse-glow" style={gpuLayer} />
      <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-primary/35 rounded-full blur-[50px] animate-pulse-glow-delayed" style={gpuLayer} />
      <div className="absolute top-2/3 right-1/3 w-24 h-24 bg-accent/25 rounded-full blur-[40px] animate-pulse-glow" style={{ ...gpuLayer, animationDelay: "1.5s" }} />

      {/* Floating particles */}
      <div className="absolute top-[10%] left-[15%] w-3 h-3 bg-primary/60 rounded-full animate-float-particle" style={gpuLayer} />
      <div className="absolute top-[20%] right-[20%] w-2 h-2 bg-accent/70 rounded-full animate-float-particle" style={{ ...gpuLayer, animationDelay: "1s" }} />
      <div className="absolute top-[40%] left-[10%] w-2.5 h-2.5 bg-primary/50 rounded-full animate-float-particle" style={{ ...gpuLayer, animationDelay: "2s" }} />
      <div className="absolute top-[60%] right-[15%] w-2 h-2 bg-accent/60 rounded-full animate-float-particle" style={{ ...gpuLayer, animationDelay: "0.5s" }} />
      <div className="absolute top-[75%] left-[25%] w-3 h-3 bg-primary/40 rounded-full animate-float-particle" style={{ ...gpuLayer, animationDelay: "3s" }} />
      <div className="absolute top-[85%] right-[30%] w-2 h-2 bg-accent/50 rounded-full animate-float-particle" style={{ ...gpuLayer, animationDelay: "1.5s" }} />

      {/* Rotating gradient rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] rounded-full border border-primary/10 animate-spin-ultra-slow" style={gpuLayer} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full border border-accent/10 animate-spin-reverse" style={gpuLayer} />

      {/* Diagonal light streaks */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden" style={gpuLayer}>
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent rotate-[35deg] animate-streak" style={gpuLayer} />
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-0.5 bg-gradient-to-r from-transparent via-accent/15 to-transparent rotate-[35deg] animate-streak" style={{ ...gpuLayer, animationDelay: "3s" }} />
      </div>

      {/* Noise/grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          ...gpuLayer,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className={`absolute inset-0 ${
          resolvedTheme === "dark"
            ? "bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]"
            : "bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)]"
        } bg-[size:60px_60px]`}
        style={gpuLayer}
      />

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.4)_70%,hsl(var(--background)/0.8)_100%)]" style={gpuLayer} />
    </div>
  );
};

export default memo(AnimatedBackground);
