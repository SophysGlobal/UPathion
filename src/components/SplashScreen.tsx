import { useState, useEffect } from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';
import upathionLogo from '@/assets/upathion-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'hold' | 'done'>('logo');

  useEffect(() => {
    // Phase 1: Logo appears (already visible, start text reveal immediately)
    const textTimer = setTimeout(() => {
      setPhase('text');
    }, 300); // Brief moment for logo to settle

    // Phase 2: After text animation completes, hold for 1 second
    const holdTimer = setTimeout(() => {
      setPhase('hold');
    }, 1100); // 300ms + 800ms for text reveal

    // Phase 3: Complete and transition out
    const completeTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2100); // 1100ms + 1000ms hold

    return () => {
      clearTimeout(textTimer);
      clearTimeout(holdTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden">
      <AnimatedBackground />
      
      <div 
        className={`relative z-10 flex items-center gap-3 transition-all duration-500 ease-out ${
          phase === 'logo' ? 'translate-x-0' : '-translate-x-0'
        }`}
      >
        {/* Logo */}
        <div 
          className={`transition-all duration-500 ease-out ${
            phase === 'logo' 
              ? 'opacity-0 scale-90' 
              : 'opacity-100 scale-100'
          }`}
          style={{ 
            animationDelay: '0ms',
            animationFillMode: 'both'
          }}
        >
          <img 
            src={upathionLogo} 
            alt="UPathion Logo" 
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
          />
        </div>

        {/* Text with reveal animation */}
        <div 
          className="overflow-hidden"
          style={{
            width: phase === 'logo' ? '0px' : 'auto',
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <span 
            className={`text-3xl md:text-4xl font-bold gradient-text whitespace-nowrap transition-all duration-700 ease-out ${
              phase === 'logo' 
                ? 'opacity-0 translate-x-[-20px]' 
                : 'opacity-100 translate-x-0'
            }`}
            style={{
              transitionDelay: '200ms',
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
