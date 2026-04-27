import { ReactNode, useEffect, useState } from 'react';
import SplashScreen from './SplashScreen';
import { useAppEntry } from '@/hooks/useAppEntry';
import { useAuth } from '@/context/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import PersistentLogoLayer from './PersistentLogoLayer';

interface AppEntryGateProps {
  children: ReactNode;
}

/**
 * AppEntryGate — single SplashScreen component handles both splash + welcome
 * in one continuous animation. No unmount/remount = no flicker.
 */
const AppEntryGate = ({ children }: AppEntryGateProps) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminStatus();
  const {
    showSplash,
    showWelcome,
    isReady,
    onSplashComplete,
    markDeviceSignedIn,
    markAdminSession,
  } = useAppEntry();

  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (user) markDeviceSignedIn();
  }, [user, markDeviceSignedIn]);

  useEffect(() => {
    if (user && isAdmin !== undefined) markAdminSession(isAdmin);
  }, [user, isAdmin, markAdminSession]);

  // Splash sequence complete — fade out, then mark ready so the persistent
  // top logo and routed children become visible in one frame.
  const handleComplete = () => {
    setFadeOut(true);
    setTimeout(() => {
      onSplashComplete();
      setFadeOut(false);
    }, 300);
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
          onComplete={handleComplete}
        />
      )}

      {isReady && (
        <>
          <PersistentLogoLayer />
          {children}
        </>
      )}
    </>
  );
};

export default AppEntryGate;
