import { ReactNode, useEffect, useState } from 'react';
import SplashScreen from './SplashScreen';
import WelcomeScreens from './WelcomeScreens';
import { useAppEntry } from '@/hooks/useAppEntry';
import { useAuth } from '@/context/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';

interface AppEntryGateProps {
  children: ReactNode;
}

/**
 * AppEntryGate - Manages the app entry experience
 * 
 * Background lives at App.tsx level (never remounts).
 * This component only renders splash/welcome overlays ON TOP of it.
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
  } = useAppEntry();

  // Fade-out overlay: when transitioning from welcome/splash to app
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (user) {
      markDeviceSignedIn();
    }
  }, [user, markDeviceSignedIn]);

  useEffect(() => {
    if (user && isAdmin !== undefined) {
      markAdminSession(isAdmin);
    }
  }, [user, isAdmin, markAdminSession]);

  // When welcome completes, start fade-out then show children
  const handleWelcomeComplete = () => {
    setFadeOut(true);
    setTimeout(() => {
      onWelcomeComplete();
      setFadeOut(false);
    }, 500);
  };

  // When splash completes and no welcome needed, also fade
  const handleSplashComplete = () => {
    onSplashComplete();
  };

  const showOverlay = showSplash || showWelcome || fadeOut;

  return (
    <>
      {/* Overlay that blocks app content during splash/welcome */}
      {showOverlay && (
        <div 
          className={`fixed inset-0 z-[99] bg-background transition-opacity duration-500 ${
            fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />
      )}

      {/* Splash content */}
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* Welcome content */}
      {showWelcome && !showSplash && (
        <WelcomeScreens onComplete={handleWelcomeComplete} />
      )}

      {/* App content - render underneath, becomes visible when overlay fades */}
      {isReady && <>{children}</>}
    </>
  );
};

export default AppEntryGate;
