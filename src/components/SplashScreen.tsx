import { useState, useEffect, useCallback } from 'react';
import upathionLogo from '@/assets/upathion-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

type SplashPhase = 'initial' | 'logo' | 'text' | 'hold';

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<SplashPhase>('initial');

  const stableComplete = useCallback(onComplete, []);

  useEffect(() => {
    // Use a single coordinated timeline via a state machine
    // Phase 1: Show logo (frame after mount)
    const raf = requestAnimationFrame(() => setPhase('logo'));

    // Phase 2: Start text reveal after logo animates in
    const t1 = setTimeout(() => setPhase('text'), 500);

    // Phase 3: Hold combined lockup
    const t2 = setTimeout(() => setPhase('hold'), 1300);

    // Phase 4: Complete after 1s hold
    const t3 = setTimeout(() => stableComplete(), 2300);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [stableComplete]);

  const showLogo = phase !== 'initial';
  const showText = phase === 'text' || phase === 'hold';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Content: logo + wordmark as a single centered block */}
      <div className="relative z-10 flex items-center gap-3">
        {/* Logo — fade + scale in */}
        <div 
          style={{
            opacity: showLogo ? 1 : 0,
            transform: showLogo ? 'scale(1)' : 'scale(0.85)',
            transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
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
            maxWidth: showText ? '200px' : '0px',
            transition: 'max-width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <span 
            className="text-3xl md:text-4xl font-bold gradient-text whitespace-nowrap block"
            style={{
              opacity: showText ? 1 : 0,
              transform: showText ? 'translateX(0)' : 'translateX(-20px)',
              transition: 'opacity 0.6s ease-out 0.15s, transform 0.6s ease-out 0.15s',
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
