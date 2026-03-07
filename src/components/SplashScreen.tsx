import { useState, useEffect, useRef, useCallback } from 'react';
import upathionLogo from '@/assets/upathion-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * Splash: logo fades+scales in, then wordmark reveals left-to-right.
 * Single RAF timeline. All elements start at opacity 0 to prevent flash.
 */
const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [elapsed, setElapsed] = useState(-1); // -1 = not started yet
  const startRef = useRef(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const doneRef = useRef(false);

  const tick = useCallback((now: number) => {
    if (doneRef.current) return;
    const ms = now - startRef.current;
    setElapsed(ms);
    if (ms >= 2300) {
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

  // Before first tick, everything is invisible (elapsed = -1)
  const t = Math.max(0, elapsed);
  
  // Timeline: 0-600ms logo fades in, 500ms+ wordmark reveals, hold until 2300ms
  const logoProgress = Math.min(1, t / 600);
  const textProgress = t > 500 ? Math.min(1, (t - 500) / 800) : 0;

  // Eased values (ease-out cubic)
  const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);
  const logoEased = easeOut(logoProgress);
  const textEased = easeOut(textProgress);

  // Don't render visible content until first RAF tick
  const visible = elapsed >= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      <div
        className="relative z-10 flex items-center gap-3"
        style={{
          opacity: visible ? 1 : 0,
          transform: 'translateZ(0)', // Force GPU layer
        }}
      >
        {/* Logo — fade + scale in */}
        <div
          style={{
            opacity: logoEased,
            transform: `scale(${0.85 + 0.15 * logoEased}) translateZ(0)`,
          }}
        >
          <img
            src={upathionLogo}
            alt="UPathion Logo"
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
          />
        </div>

        {/* Wordmark — clip reveal left-to-right */}
        <div
          className="overflow-hidden"
          style={{
            maxWidth: `${textEased * 200}px`,
          }}
        >
          <span
            className="text-3xl md:text-4xl font-bold gradient-text whitespace-nowrap block"
            style={{
              opacity: textEased,
              transform: `translateX(${(1 - textEased) * -20}px) translateZ(0)`,
            }}
          >
            UPathion
          </span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
