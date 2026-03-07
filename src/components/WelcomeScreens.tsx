import { useState, useEffect, useRef, useCallback } from 'react';
import upathionLogo from '@/assets/upathion-logo.png';

interface WelcomeScreensProps {
  onComplete: () => void;
}

/**
 * Welcome flow: single RAF-driven timeline.
 * All elements start invisible (elapsed = -1) to prevent pre-render flash.
 * 
 * Timeline:
 * 0–100ms: enter (logo centered, visible)
 * 100–900ms: logo shifts up smoothly
 * 200–700ms: "Welcome" fades in
 * 2100–2500ms: "Welcome" fades out
 * 2500–3000ms: "Let's Get You Started" fades in
 * 4500ms: complete
 */
const WelcomeScreens = ({ onComplete }: WelcomeScreensProps) => {
  const [elapsed, setElapsed] = useState(-1); // -1 = not started
  const startRef = useRef(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const doneRef = useRef(false);

  const tick = useCallback((now: number) => {
    if (doneRef.current) return;
    const ms = now - startRef.current;
    setElapsed(ms);
    if (ms >= 4500) {
      doneRef.current = true;
      completeRef.current();
    }
  }, []);

  useEffect(() => {
    let raf: number;

    const loop = (now: number) => {
      if (!startRef.current) startRef.current = now;
      tick(now);
      if (!doneRef.current) {
        raf = requestAnimationFrame(loop);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  const easeOut = (t: number) => {
    const clamped = Math.min(1, Math.max(0, t));
    return 1 - Math.pow(1 - clamped, 3);
  };

  const t = Math.max(0, elapsed);

  // Logo shift: 100ms–900ms (smooth translateY)
  const shiftProgress = easeOut((t - 100) / 800);
  const logoY = -40 * shiftProgress;

  // "Welcome": fade in 200–700ms, fade out 2100–2500ms
  const welcomeIn = easeOut((t - 200) / 500);
  const welcomeOut = t > 2100 ? easeOut((t - 2100) / 400) : 0;
  const welcomeOpacity = Math.max(0, welcomeIn - welcomeOut);

  // "Let's Get You Started": fade in 2500–3000ms
  const startedIn = easeOut((t - 2500) / 500);

  // Everything invisible until first RAF tick
  const visible = elapsed >= 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
      <div
        className="relative z-10 flex flex-col items-center w-full max-w-md px-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${logoY}px) translateZ(0)`,
        }}
      >
        {/* Logo + wordmark — single block, no layout changes */}
        <div className="flex items-center gap-3 mb-10">
          <img
            src={upathionLogo}
            alt="UPathion Logo"
            className="w-12 h-12 object-contain"
          />
          <span className="text-2xl font-bold gradient-text">UPathion</span>
        </div>

        {/* Text container — fixed height, absolute positioning prevents reflow */}
        <div className="h-20 flex items-center justify-center relative w-full">
          <h1
            className="text-5xl md:text-6xl font-semibold text-foreground absolute font-display"
            style={{
              opacity: welcomeOpacity,
              transform: `translateY(${(1 - welcomeIn) * 12}px) scale(${0.97 + 0.03 * welcomeIn}) translateZ(0)`,
              pointerEvents: 'none',
            }}
          >
            Welcome
          </h1>

          <h1
            className="text-3xl md:text-4xl font-semibold text-foreground absolute whitespace-nowrap font-display"
            style={{
              opacity: startedIn,
              transform: `translateY(${(1 - startedIn) * -8}px) scale(${0.97 + 0.03 * startedIn}) translateZ(0)`,
              pointerEvents: 'none',
            }}
          >
            Let's Get You Started
          </h1>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreens;
