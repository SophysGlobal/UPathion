import { useState, useEffect, useRef } from 'react';
import upathionLogo from '@/assets/upathion-logo.png';

interface WelcomeScreensProps {
  onComplete: () => void;
}

/**
 * Welcome flow: single RAF-driven timeline.
 * 0–100ms: enter (logo centered)
 * 100–900ms: logo shifts up
 * 200–700ms: "Welcome" fades in
 * 2100–2500ms: "Welcome" fades out
 * 2500–3000ms: "Let's Get You Started" fades in
 * 4500ms: complete
 */
const WelcomeScreens = ({ onComplete }: WelcomeScreensProps) => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const doneRef = useRef(false);

  useEffect(() => {
    startRef.current = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const ms = now - startRef.current;
      setElapsed(ms);
      if (ms >= 4500 && !doneRef.current) {
        doneRef.current = true;
        completeRef.current();
        return;
      }
      if (!doneRef.current) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

  // Logo shift: 100ms–900ms
  const shiftProgress = easeOut((elapsed - 100) / 800);
  const logoY = -40 * shiftProgress;

  // "Welcome": fade in 200–700ms, fade out 2100–2500ms
  const welcomeIn = easeOut((elapsed - 200) / 500);
  const welcomeOut = elapsed > 2100 ? easeOut((elapsed - 2100) / 400) : 0;
  const welcomeOpacity = Math.max(0, welcomeIn - welcomeOut);

  // "Let's Get You Started": fade in 2500–3000ms
  const startedOpacity = easeOut((elapsed - 2500) / 500);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
      <div
        className="relative z-10 flex flex-col items-center w-full max-w-md px-4"
        style={{
          transform: `translateY(${logoY}px)`,
          willChange: 'transform',
        }}
      >
        {/* Logo + wordmark */}
        <div className="flex items-center gap-3 mb-10">
          <img
            src={upathionLogo}
            alt="UPathion Logo"
            className="w-12 h-12 object-contain"
          />
          <span className="text-2xl font-bold gradient-text">UPathion</span>
        </div>

        {/* Text container — fixed height prevents reflow */}
        <div className="h-20 flex items-center justify-center relative w-full">
          <h1
            className="text-5xl md:text-6xl font-semibold text-foreground absolute font-display"
            style={{
              opacity: welcomeOpacity,
              transform: `translateY(${(1 - welcomeIn) * 12}px) scale(${0.97 + 0.03 * welcomeIn})`,
              pointerEvents: 'none',
              willChange: 'opacity, transform',
            }}
          >
            Welcome
          </h1>

          <h1
            className="text-3xl md:text-4xl font-semibold text-foreground absolute whitespace-nowrap font-display"
            style={{
              opacity: startedOpacity,
              transform: `translateY(${(1 - startedOpacity) * -8}px) scale(${0.97 + 0.03 * startedOpacity})`,
              pointerEvents: 'none',
              willChange: 'opacity, transform',
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
