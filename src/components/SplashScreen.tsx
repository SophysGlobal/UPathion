import { useState, useEffect } from 'react';
import upathionLogo from '@/assets/upathion-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'initial' | 'logo' | 'text' | 'hold'>('initial');

  useEffect(() => {
    // Kick off after a single frame to ensure mount
    const startTimer = requestAnimationFrame(() => {
      setPhase('logo');
    });

    // Phase 2: Start text reveal
    const textTimer = setTimeout(() => setPhase('text'), 400);

    // Phase 3: Hold combined lockup
    const holdTimer = setTimeout(() => setPhase('hold'), 1200);

    // Phase 4: Complete
    const completeTimer = setTimeout(() => onComplete(), 2200);

    return () => {
      cancelAnimationFrame(startTimer);
      clearTimeout(textTimer);
      clearTimeout(holdTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const showLogo = phase !== 'initial';
  const showText = phase === 'text' || phase === 'hold';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Content: logo + wordmark as a single centered block */}
      <div className="relative z-10 flex items-center gap-3">
        {/* Logo */}
        <div 
          className="transition-all duration-600 ease-out"
          style={{
            opacity: showLogo ? 1 : 0,
            transform: showLogo ? 'scale(1)' : 'scale(0.85)',
            transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <img 
            src={upathionLogo} 
            alt="UPathion Logo" 
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
          />
        </div>

        {/* Wordmark with clip reveal */}
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
