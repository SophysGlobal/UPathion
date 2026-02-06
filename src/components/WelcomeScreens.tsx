import { useState, useEffect } from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';
import upathionLogo from '@/assets/upathion-logo.png';

interface WelcomeScreensProps {
  onComplete: () => void;
}

const WelcomeScreens = ({ onComplete }: WelcomeScreensProps) => {
  const [phase, setPhase] = useState<'welcome-in' | 'welcome' | 'transition' | 'started-in' | 'started' | 'done'>('welcome-in');

  useEffect(() => {
    // Phase 1: "Welcome" animates in
    const welcomeShowTimer = setTimeout(() => {
      setPhase('welcome');
    }, 100);

    // Phase 2: After ~2 seconds total, start transition to next text
    const transitionTimer = setTimeout(() => {
      setPhase('transition');
    }, 2000);

    // Phase 3: "Let's Get You Started" animates in
    const startedInTimer = setTimeout(() => {
      setPhase('started-in');
    }, 2300); // 300ms for fade out

    // Phase 4: Show "Let's Get You Started" 
    const startedTimer = setTimeout(() => {
      setPhase('started');
    }, 2400);

    // Phase 5: After ~2 more seconds, complete
    const completeTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 4400); // 2000ms + 300ms transition + 2100ms for second text

    return () => {
      clearTimeout(welcomeShowTimer);
      clearTimeout(transitionTimer);
      clearTimeout(startedInTimer);
      clearTimeout(startedTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const isWelcomePhase = phase === 'welcome-in' || phase === 'welcome' || phase === 'transition';
  const isStartedPhase = phase === 'started-in' || phase === 'started' || phase === 'done';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo - consistent with questionnaire placement */}
        <div className="flex items-center gap-3">
          <img 
            src={upathionLogo} 
            alt="UPathion Logo" 
            className="w-12 h-12 object-contain"
          />
          <span className="text-2xl font-bold gradient-text">UPathion</span>
        </div>

        {/* Text container with fixed height to prevent layout shift */}
        <div className="h-20 flex items-center justify-center">
          {/* Welcome text */}
          <h1 
            className={`text-5xl md:text-6xl font-bold text-foreground transition-all duration-500 ease-out absolute ${
              isWelcomePhase && phase !== 'transition'
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-4 scale-95'
            }`}
          >
            Welcome
          </h1>

          {/* Let's Get You Started text */}
          <h1 
            className={`text-4xl md:text-5xl font-bold text-foreground transition-all duration-500 ease-out absolute text-center ${
              isStartedPhase && phase !== 'started-in'
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-[-10px] scale-95'
            }`}
          >
            Let's Get You Started
          </h1>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreens;
