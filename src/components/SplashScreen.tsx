import { useState, useEffect, useRef } from 'react';
import upathionLogo from '@/assets/upathion-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * Splash: logo fades+scales in, then wordmark reveals left-to-right.
 * Uses a single RAF-driven timeline to avoid setTimeout race conditions.
 */
const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    startRef.current = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const ms = now - startRef.current;
      setElapsed(ms);
      if (ms < 2300) {
        raf = requestAnimationFrame(tick);
      } else {
        completeRef.current();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Timeline: 0-600ms logo fades in, 500ms+ wordmark reveals, hold until 2300ms
  const logoProgress = Math.min(1, elapsed / 600);
  const showText = elapsed > 500;
  const textProgress = showText ? Math.min(1, (elapsed - 500) / 800) : 0;

  // Eased values (ease-out cubic)
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const logoEased = easeOut(logoProgress);
  const textEased = easeOut(textProgress);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      <div className="relative z-10 flex items-center gap-3">
        {/* Logo — fade + scale in */}
        <div
          style={{
            opacity: logoEased,
            transform: `scale(${0.85 + 0.15 * logoEased})`,
            willChange: 'opacity, transform',
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
            willChange: 'max-width',
          }}
        >
          <span
            className="text-3xl md:text-4xl font-bold gradient-text whitespace-nowrap block"
            style={{
              opacity: textEased,
              transform: `translateX(${(1 - textEased) * -20}px)`,
              willChange: 'opacity, transform',
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
