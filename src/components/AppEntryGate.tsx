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

  // Persistent logo is always mounted to avoid remount-flicker. We just fade
  // its opacity in once the splash finishes — at exactly the same instant the
  // splash overlay fades out — so the handoff is invisible.
  const persistentVisible = isReady && !fadeOut;

  return (
    <>
      {showOverlay && (
        <div
          className={`fixed inset-0 z-[99] transition-opacity duration-300 ${
            fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />
      )}

      {(showSplash || showWelcome) && !fadeOut && (
        <SplashScreen onComplete={handleComplete} />
      )}

      <div
        className={`transition-opacity duration-300 ${
          persistentVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!persistentVisible}
      >
        <PersistentLogoLayer />
      </div>

      {isReady && children}
    </>
  );
};

export default AppEntryGate;
