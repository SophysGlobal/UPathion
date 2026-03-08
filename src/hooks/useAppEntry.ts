import { useState, useCallback } from 'react';

const DEVICE_SIGNED_IN_KEY = 'upathion_has_signed_in_on_device';
const ADMIN_LAST_SESSION_KEY = 'upathion_last_session_was_admin';
const SESSION_SPLASH_SHOWN_KEY = 'upathion_splash_shown_this_session';

interface AppEntryState {
  showSplash: boolean;
  showWelcome: boolean;
  isReady: boolean;
}

const wasSplashShownThisSession = (): boolean => {
  try { return sessionStorage.getItem(SESSION_SPLASH_SHOWN_KEY) === 'true'; } catch { return false; }
};

const markSplashShownThisSession = (): void => {
  try { sessionStorage.setItem(SESSION_SPLASH_SHOWN_KEY, 'true'); } catch {}
};

export const useAppEntry = () => {
  const splashAlreadyShown = wasSplashShownThisSession();

  const [state, setState] = useState<AppEntryState>(() => {
    if (splashAlreadyShown) {
      return { showSplash: false, showWelcome: false, isReady: true };
    }
    return { showSplash: true, showWelcome: false, isReady: false };
  });

  const hasSignedInOnDevice = useCallback((): boolean => {
    try { return localStorage.getItem(DEVICE_SIGNED_IN_KEY) === 'true'; } catch { return false; }
  }, []);

  const wasLastSessionAdmin = useCallback((): boolean => {
    try { return localStorage.getItem(ADMIN_LAST_SESSION_KEY) === 'true'; } catch { return false; }
  }, []);

  const markDeviceSignedIn = useCallback(() => {
    try { localStorage.setItem(DEVICE_SIGNED_IN_KEY, 'true'); } catch {}
  }, []);

  const markAdminSession = useCallback((isAdmin: boolean) => {
    try { localStorage.setItem(ADMIN_LAST_SESSION_KEY, isAdmin ? 'true' : 'false'); } catch {}
  }, []);

  const clearAdminSessionFlag = useCallback(() => {
    try { localStorage.removeItem(ADMIN_LAST_SESSION_KEY); } catch {}
  }, []);

  const shouldShowWelcome = useCallback((): boolean => {
    return !hasSignedInOnDevice() || wasLastSessionAdmin();
  }, [hasSignedInOnDevice, wasLastSessionAdmin]);

  // Called when splash phase ends (even if welcome follows)
  const onSplashComplete = useCallback(() => {
    markSplashShownThisSession();
    // If welcome is handled by the unified component, just mark splash done
    // The unified SplashScreen handles both phases
    setState(prev => {
      if (prev.showWelcome || prev.isReady) return prev; // already transitioned
      const needsWelcome = shouldShowWelcome();
      if (needsWelcome) {
        return { ...prev, showSplash: false, showWelcome: true, isReady: false };
      }
      return { ...prev, showSplash: false, showWelcome: false, isReady: true };
    });
  }, [shouldShowWelcome]);

  const onWelcomeComplete = useCallback(() => {
    markSplashShownThisSession();
    setState({ showSplash: false, showWelcome: false, isReady: true });
  }, []);

  const resetAppEntry = useCallback(() => {
    try {
      localStorage.removeItem(DEVICE_SIGNED_IN_KEY);
      localStorage.removeItem(ADMIN_LAST_SESSION_KEY);
      sessionStorage.removeItem(SESSION_SPLASH_SHOWN_KEY);
    } catch {}
  }, []);

  return {
    ...state,
    onSplashComplete,
    onWelcomeComplete,
    markDeviceSignedIn,
    markAdminSession,
    clearAdminSessionFlag,
    shouldShowWelcome,
    resetAppEntry,
  };
};

export default useAppEntry;
