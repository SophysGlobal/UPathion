import { ReactNode, useEffect, useState } from 'react';
import SplashScreen from './SplashScreen';
import { useAppEntry } from '@/hooks/useAppEntry';
import { useAuth } from '@/context/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';

interface AppEntryGateProps {
  children: ReactNode;
}

/**
 * AppEntryGate — single SplashScreen component handles both splash + welcome
 * in one continuous animation. No unmount/remount = no flicker.
 *
 * The AnimatedBackground lives in App.tsx and is always behind this gate.
 * The splash overlay is transparent so particles show through.
 */
const AppEntryGate = ({ children }: AppEntryGateProps) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminStatus();
  const {
    showSplash,
    showWelcome,
    isReady,
    onSplashComplete,
    onWelcomeComplete,
    markDeviceSignedIn,
    markAdminSession,
    shouldShowWelcome,
  } = useAppEntry();

  const [fadeOut, setFadeOut] = useState(false);
  const [includeWelcome] = useState(() => shouldShowWelcome());

  useEffect(() => {
    if (user) markDeviceSignedIn();
  }, [user, markDeviceSignedIn]);

  useEffect(() => {
    if (user && isAdmin !== undefined) markAdminSession(isAdmin);
  }, [user, isAdmin, markAdminSession]);

  // Full sequence complete (splash+welcome or splash-only)
  const handleComplete = () => {
    setFadeOut(true);
    setTimeout(() => {
      if (includeWelcome) {
        onWelcomeComplete();
      } else {
        onSplashComplete();
      }
      setFadeOut(false);
    }, 400);
  };

  const showOverlay = showSplash || showWelcome || fadeOut;

  return (
    <>
      {showOverlay && (
        <div
          className={`fixed inset-0 z-[99] transition-opacity duration-400 ${
            fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />
      )}

      {(showSplash || showWelcome) && !fadeOut && (
        <SplashScreen
          includeWelcome={includeWelcome}
          onSplashPhaseComplete={() => {
            onSplashComplete();
          }}
          onComplete={handleComplete}
        />
      )}

      {/* Always render children so AnimatedBackground persists; 
          hide with opacity during splash to prevent layout shifts */}
      <div style={{ 
        opacity: isReady ? 1 : 0, 
        pointerEvents: isReady ? 'auto' : 'none',
        transition: 'opacity 0.3s ease'
      }}>
        {children}
      </div>
    </>
  );
};

export default AppEntryGate;
