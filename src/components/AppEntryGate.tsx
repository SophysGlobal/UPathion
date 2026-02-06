import { ReactNode, useEffect } from 'react';
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
 * Flow:
 * 1. Always show splash animation first (logo + text reveal)
 * 2. After splash, conditionally show welcome screens:
 *    - First time on device: Show welcome
 *    - Previous session was admin: Show welcome (for QA)
 *    - Otherwise: Skip welcome
 * 3. Then render children (auth gate + app)
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

  // When user signs in successfully, mark the device as having signed in
  useEffect(() => {
    if (user) {
      markDeviceSignedIn();
    }
  }, [user, markDeviceSignedIn]);

  // Track if current session is admin (for next app entry)
  useEffect(() => {
    if (user && isAdmin !== undefined) {
      markAdminSession(isAdmin);
    }
  }, [user, isAdmin, markAdminSession]);

  // Show splash first
  if (showSplash) {
    return <SplashScreen onComplete={onSplashComplete} />;
  }

  // Then welcome screens if needed
  if (showWelcome) {
    return <WelcomeScreens onComplete={onWelcomeComplete} />;
  }

  // Finally render the app
  if (isReady) {
    return <>{children}</>;
  }

  // Fallback loading state (should not happen normally)
  return null;
};

export default AppEntryGate;
