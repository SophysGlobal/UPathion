import { useState, useCallback, useEffect } from 'react';

const DEVICE_SIGNED_IN_KEY = 'upathion_has_signed_in_on_device';
const ADMIN_LAST_SESSION_KEY = 'upathion_last_session_was_admin';
const SESSION_SPLASH_SHOWN_KEY = 'upathion_splash_shown_this_session';

interface AppEntryState {
  showSplash: boolean;
  showWelcome: boolean;
  isReady: boolean;
}

// Check if splash was already shown this session (survives navigation but not page reload)
const wasSplashShownThisSession = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_SPLASH_SHOWN_KEY) === 'true';
  } catch {
    return false;
  }
};

const markSplashShownThisSession = (): void => {
  try {
    sessionStorage.setItem(SESSION_SPLASH_SHOWN_KEY, 'true');
  } catch {
    console.error('Failed to save splash shown state');
  }
};

export const useAppEntry = () => {
  // Check immediately if splash was already shown this session
  const splashAlreadyShown = wasSplashShownThisSession();
  
  const [state, setState] = useState<AppEntryState>(() => {
    // If splash was already shown this session, skip to ready
    if (splashAlreadyShown) {
      return {
        showSplash: false,
        showWelcome: false,
        isReady: true,
      };
    }
    return {
      showSplash: true,
      showWelcome: false,
      isReady: false,
    };
  });

  // Check if this device has previously signed in
  const hasSignedInOnDevice = useCallback((): boolean => {
    try {
      return localStorage.getItem(DEVICE_SIGNED_IN_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  // Check if the last session was an admin session
  const wasLastSessionAdmin = useCallback((): boolean => {
    try {
      return localStorage.getItem(ADMIN_LAST_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  // Mark that this device has signed in
  const markDeviceSignedIn = useCallback(() => {
    try {
      localStorage.setItem(DEVICE_SIGNED_IN_KEY, 'true');
    } catch {
      console.error('Failed to save device sign-in state');
    }
  }, []);

  // Mark if the current session is an admin session
  const markAdminSession = useCallback((isAdmin: boolean) => {
    try {
      localStorage.setItem(ADMIN_LAST_SESSION_KEY, isAdmin ? 'true' : 'false');
    } catch {
      console.error('Failed to save admin session state');
    }
  }, []);

  // Clear the admin flag (for when admin logs out, we want welcome to show next time)
  const clearAdminSessionFlag = useCallback(() => {
    try {
      localStorage.removeItem(ADMIN_LAST_SESSION_KEY);
    } catch {
      console.error('Failed to clear admin session flag');
    }
  }, []);

  // Determine if welcome should show
  const shouldShowWelcome = useCallback((): boolean => {
    const hasSignedIn = hasSignedInOnDevice();
    const wasAdmin = wasLastSessionAdmin();
    
    // Show welcome if:
    // 1. First time on this device, OR
    // 2. Last session was admin (for QA purposes)
    return !hasSignedIn || wasAdmin;
  }, [hasSignedInOnDevice, wasLastSessionAdmin]);

  // Handle splash completion
  const onSplashComplete = useCallback(() => {
    markSplashShownThisSession();
    const showWelcome = shouldShowWelcome();
    setState(prev => ({
      ...prev,
      showSplash: false,
      showWelcome,
      isReady: !showWelcome,
    }));
  }, [shouldShowWelcome]);

  // Handle welcome completion
  const onWelcomeComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      showWelcome: false,
      isReady: true,
    }));
  }, []);

  // Reset for testing (admin QA)
  const resetAppEntry = useCallback(() => {
    try {
      localStorage.removeItem(DEVICE_SIGNED_IN_KEY);
      localStorage.removeItem(ADMIN_LAST_SESSION_KEY);
      sessionStorage.removeItem(SESSION_SPLASH_SHOWN_KEY);
    } catch {
      console.error('Failed to reset app entry state');
    }
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
