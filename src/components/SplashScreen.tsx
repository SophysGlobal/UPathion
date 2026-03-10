import { useState, useEffect, useRef, useCallback } from 'react';
import upathionLogo from '@/assets/upathion-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
  /** If true, run full sequence (splash + welcome). If false, splash only. */
  includeWelcome?: boolean;
  onSplashPhaseComplete?: () => void;
}

/**
 * Unified splash sequence — single RAF timeline, zero remounts.
 *
 * Timeline (includeWelcome=true):
 *   Phase 1 – Splash (0–2300ms)
 *     0–600ms   logo fades+scales in
 *     500–1300ms wordmark clip-reveals
 *     2300ms     splash phase done
 *
 *   Phase 2 – Welcome (2300–6800ms)
 *     2300–3100ms logo+wordmark shrink & shift up
 *     2500–3000ms "Welcome" fades in
 *     4400–4800ms "Welcome" fades out
 *     4800–5300ms "Let's Get You Started" fades in
 *     6800ms      complete
 *
 * All transforms are GPU-composited (translateZ(0)).
 * Logo never unmounts — it morphs in place.
 */
const SplashScreen = ({
  onComplete,
  includeWelcome = false,
  onSplashPhaseComplete,
}: SplashScreenProps) => {
  const [elapsed, setElapsed] = useState(-1);
  const startRef = useRef(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const splashCbRef = useRef(onSplashPhaseComplete);
  splashCbRef.current = onSplashPhaseComplete;
  const doneRef = useRef(false);
  const splashFiredRef = useRef(false);

  const totalDuration = includeWelcome ? 6800 : 2300;

  const tick = useCallback(
    (now: number) => {
      if (doneRef.current) return;
      const ms = now - startRef.current;
      setElapsed(ms);

      // Fire splash-phase callback once
      if (includeWelcome && ms >= 2300 && !splashFiredRef.current) {
        splashFiredRef.current = true;
        splashCbRef.current?.();
      }

      if (ms >= totalDuration) {
        doneRef.current = true;
        completeRef.current();
      }
    },
    [includeWelcome, totalDuration],
  );

  useEffect(() => {
    let raf: number;
    const loop = (now: number) => {
      if (!startRef.current) startRef.current = now;
      tick(now);
      if (!doneRef.current) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  // Easing
  const easeOut = (v: number) => {
    const c = Math.min(1, Math.max(0, v));
    return 1 - Math.pow(1 - c, 3);
  };

  const t = Math.max(0, elapsed);
  const visible = elapsed >= 0;

  // ── Phase 1: splash logo + wordmark ──
  const logoFade = easeOut(t / 600);
  const textReveal = t > 500 ? easeOut((t - 500) / 800) : 0;

  // ── Phase 2: welcome morph (only when includeWelcome) ──
  let morphProgress = 0;
  let welcomeOpacity = 0;
  let startedOpacity = 0;

  if (includeWelcome) {
    // Morph from center-big to top-small: 2300–3100ms
    morphProgress = easeOut((t - 2300) / 800);

    // "Welcome" in 2500–3000ms, out 4400–4800ms
    const wIn = easeOut((t - 2500) / 500);
    const wOut = t > 4400 ? easeOut((t - 4400) / 400) : 0;
    welcomeOpacity = Math.max(0, wIn - wOut);

    // "Let's Get You Started" in 4800–5300ms
    startedOpacity = easeOut((t - 4800) / 500);
  }

  // Interpolated values for morph
  // Splash: logo 64–80px, text 1.875–2.25rem, centered
  // Welcome end: logo 48px, text ~1.5rem, shifted up 40px
  const logoSize = 64 + (80 - 64) * (window.innerWidth >= 768 ? 1 : 0); // md breakpoint
  const logoSizeMorphed = logoSize - (logoSize - 48) * morphProgress;
  const textScale = 1 - 0.18 * morphProgress; // shrink wordmark ~18%
  const shiftY = -50 * morphProgress; // shift up

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden" style={{ contain: 'layout style paint', isolation: 'isolate' }}>
      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${shiftY}px) translateZ(0)`,
          willChange: 'transform, opacity',
        }}
      >
        {/* Logo + wordmark row — never unmounts */}
        <div
          className="flex items-center gap-3"
          style={{ transform: 'translateZ(0)' }}
        >
          <div
            style={{
              opacity: logoFade,
              transform: `scale(${0.85 + 0.15 * logoFade}) translateZ(0)`,
              width: logoSizeMorphed,
              height: logoSizeMorphed,
              transition: 'none',
              willChange: 'transform, opacity',
            }}
          >
            <img
              src={upathionLogo}
              alt="UPathion Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div
            className="overflow-hidden"
            style={{ maxWidth: `${textReveal * 200}px` }}
          >
            <span
              className="text-3xl md:text-4xl font-bold gradient-text whitespace-nowrap block"
              style={{
                opacity: textReveal,
                transform: `translateX(${(1 - textReveal) * -20}px) scale(${textScale}) translateZ(0)`,
                transformOrigin: 'left center',
                willChange: 'transform, opacity',
              }}
            >
              UPathion
            </span>
          </div>
        </div>

        {/* Welcome texts — only rendered when includeWelcome */}
        {includeWelcome && (
          <div
            className="h-20 flex items-center justify-center relative w-full mt-10"
            style={{ transform: 'translateZ(0)' }}
          >
            <h1
              className="text-5xl md:text-6xl font-semibold text-foreground absolute font-display"
              style={{
                opacity: welcomeOpacity,
                transform: `translateY(${(1 - easeOut((t - 2500) / 500)) * 12}px) scale(${0.97 + 0.03 * easeOut((t - 2500) / 500)}) translateZ(0)`,
                pointerEvents: 'none',
                willChange: 'transform, opacity',
              }}
            >
              Welcome
            </h1>

            <h1
              className="text-3xl md:text-4xl font-semibold text-foreground absolute whitespace-nowrap font-display"
              style={{
                opacity: startedOpacity,
                transform: `translateY(${(1 - startedOpacity) * -8}px) scale(${0.97 + 0.03 * startedOpacity}) translateZ(0)`,
                pointerEvents: 'none',
                willChange: 'transform, opacity',
              }}
            >
              Let's Get You Started
            </h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
