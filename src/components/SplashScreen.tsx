import { useState, useEffect, useRef, useCallback } from 'react';
import upathionLogo from '@/assets/upathion-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * Splash screen — single RAF timeline, zero remounts.
 *
 * Timeline (total ~2300ms):
 *   0–600ms     logo fades + scales in (centered)
 *   500–1300ms  "UPathion" wordmark clip-reveals
 *   1500–2300ms logo+wordmark migrate to final top-center position
 *               (matches PersistentLogoLayer's centered placement so the
 *                handoff is invisible)
 *   2300ms      complete → fade overlay + mount persistent logo
 *
 * The persistent top logo only appears AFTER this completes, so there is
 * never a duplicate logo on screen.
 */
const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [elapsed, setElapsed] = useState(-1);
  const startRef = useRef(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const doneRef = useRef(false);

  const TOTAL = 2300;

  const tick = useCallback((now: number) => {
    if (doneRef.current) return;
    const ms = now - startRef.current;
    setElapsed(ms);
    if (ms >= TOTAL) {
      doneRef.current = true;
      completeRef.current();
    }
  }, []);

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

  const easeOut = (v: number) => {
    const c = Math.min(1, Math.max(0, v));
    return 1 - Math.pow(1 - c, 3);
  };

  const t = Math.max(0, elapsed);
  const visible = elapsed >= 0;

  // Phase 1: logo + wordmark intro
  const logoFade = easeOut(t / 600);
  const textReveal = t > 500 ? easeOut((t - 500) / 800) : 0;

  // Phase 2: migrate from screen-center to final top-center position.
  // PersistentLogoLayer renders the logo at top-6 (24px) horizontally
  // centered. We drive a translateY from screen-center to that point.
  // A longer, gentler curve removes any feeling of "snapping".
  const migrate = t > 1400 ? easeOut((t - 1400) / 900) : 0;
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
  // top-6 (24px) + half final logo height (24px) = 48px from top to logo center
  const finalCenterOffset = 24 + 24;
  const shiftY = -(centerY - finalCenterOffset) * migrate;

  // Logo is 48px in PersistentLogoLayer; splash starts a bit larger.
  const startSize = 80;
  const endSize = 48;
  const logoSize = startSize - (startSize - endSize) * migrate;

  // Wordmark scales from 1 to ~0.75 to match Logo's text-2xl size.
  const textScale = 1 - 0.25 * migrate;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ contain: 'layout style paint', isolation: 'isolate' }}
    >
      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${shiftY}px) translateZ(0)`,
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex items-center gap-3" style={{ transform: 'translateZ(0)' }}>
          <div
            style={{
              opacity: logoFade,
              transform: `scale(${0.85 + 0.15 * logoFade}) translateZ(0)`,
              width: logoSize,
              height: logoSize,
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
      </div>
    </div>
  );
};

export default SplashScreen;
