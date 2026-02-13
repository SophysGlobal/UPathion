import { useState, useEffect, useCallback } from 'react';
import upathionLogo from '@/assets/upathion-logo.png';

interface WelcomeScreensProps {
  onComplete: () => void;
}

type WelcomePhase = 'enter' | 'welcome' | 'transition' | 'started' | 'done';

const WelcomeScreens = ({ onComplete }: WelcomeScreensProps) => {
  const [phase, setPhase] = useState<WelcomePhase>('enter');

  const stableComplete = useCallback(onComplete, []);

  useEffect(() => {
    // Coordinated state machine — each phase drives the next
    // enter → welcome (show "Welcome")
    const t1 = setTimeout(() => setPhase('welcome'), 100);
    // welcome → transition (fade out "Welcome")
    const t2 = setTimeout(() => setPhase('transition'), 2100);
    // transition → started (show "Let's Get You Started")
    const t3 = setTimeout(() => setPhase('started'), 2500);
    // started → done (complete)
    const t4 = setTimeout(() => {
      setPhase('done');
      stableComplete();
    }, 4500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [stableComplete]);

  const isWelcomeVisible = phase === 'welcome';
  const isStartedVisible = phase === 'started' || phase === 'done';

  // Logo shifts up after enter phase
  const logoAtTop = phase !== 'enter';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
      <div 
        className="relative z-10 flex flex-col items-center w-full max-w-md px-4"
        style={{
          transform: logoAtTop ? 'translateY(-40px)' : 'translateY(0px)',
          transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
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

        {/* Text container with fixed height */}
        <div className="h-20 flex items-center justify-center relative w-full">
          {/* "Welcome" — only visible during welcome phase */}
          <h1 
            className="text-5xl md:text-6xl font-semibold text-foreground absolute font-display"
            style={{
              opacity: isWelcomeVisible ? 1 : 0,
              transform: isWelcomeVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
              transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
              pointerEvents: 'none',
            }}
          >
            Welcome
          </h1>

          {/* "Let's Get You Started" — single line, visible during started phase */}
          <h1 
            className="text-3xl md:text-4xl font-semibold text-foreground absolute whitespace-nowrap font-display"
            style={{
              opacity: isStartedVisible ? 1 : 0,
              transform: isStartedVisible ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
              transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
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
