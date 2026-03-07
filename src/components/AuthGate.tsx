import { ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useAdminStatus } from '@/hooks/useAdminStatus';

interface AuthGateProps {
  children: ReactNode;
}

// Session-level sign-in gate key
const SESSION_SIGNED_IN_KEY = 'upathion_signed_in_this_session';

export const markSessionSignedIn = () => {
  try {
    sessionStorage.setItem(SESSION_SIGNED_IN_KEY, 'true');
  } catch {
    // sessionStorage unavailable
  }
};

const hasSignedInThisSession = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_SIGNED_IN_KEY) === 'true';
  } catch {
    return false;
  }
};

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/signin', '/signup', '/email-confirmation', '/auth/callback', '/password-reset', '/update-password', '/welcome'];

// Onboarding routes
const ONBOARDING_ROUTES = [
  '/onboarding/name',
  '/onboarding/name-confirm',
  '/onboarding/how-did-you-hear',
  '/onboarding/school',
  '/onboarding/aspirational-school',
  '/onboarding/interests',
  '/onboarding/school-confirm',
  '/subscription',
];

// Protected app routes
const PROTECTED_APP_ROUTES = [
  '/school-community',
  '/school/',
  '/user/',
  '/messages',
  '/feed',
  '/explore',
  '/dashboard',
  '/profile',
  '/edit-profile',
  '/settings',
  '/plan-management',
  '/privacy-settings',
];

// Maximum time to wait for profile/admin data before proceeding anyway
const SECONDARY_LOADING_TIMEOUT_MS = 4000;

const AuthGate = ({ children }: AuthGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, hasCompletedOnboarding } = useProfileCompletion();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [adminQuestionnaireDone, setAdminQuestionnaireDone] = useState(() => {
    return sessionStorage.getItem('admin-questionnaire-done') === 'true';
  });

  const [hasRouted, setHasRouted] = useState(false);
  const [secondaryTimedOut, setSecondaryTimedOut] = useState(false);
  const secondaryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setHasRouted(false);
    if (user?.id) {
      setAdminQuestionnaireDone(false);
      sessionStorage.removeItem('admin-questionnaire-done');
    }
  }, [user?.id]);

  const currentPath = location.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);
  const isOnboardingRoute = ONBOARDING_ROUTES.includes(currentPath);
  const isAuthRoute = currentPath === '/signin' || currentPath === '/signup';
  const isProtectedAppRoute = PROTECTED_APP_ROUTES.some(route => currentPath.startsWith(route));

  const signedInThisSession = hasSignedInThisSession();

  // Primary loading: auth state must resolve (handled by AuthContext timeout)
  // Secondary loading: profile + admin status, only when user is signed in this session
  const needsSecondaryData = !!user && signedInThisSession;
  const secondaryStillLoading = needsSecondaryData && (profileLoading || adminLoading) && !secondaryTimedOut;
  const isLoading = authLoading || secondaryStillLoading;

  // Safety timeout for secondary data (profile/admin queries)
  useEffect(() => {
    if (needsSecondaryData && (profileLoading || adminLoading)) {
      secondaryTimeoutRef.current = setTimeout(() => {
        setSecondaryTimedOut(true);
      }, SECONDARY_LOADING_TIMEOUT_MS);
    } else {
      // Data resolved, clear timeout
      if (secondaryTimeoutRef.current) {
        clearTimeout(secondaryTimeoutRef.current);
      }
      setSecondaryTimedOut(false);
    }
    return () => {
      if (secondaryTimeoutRef.current) clearTimeout(secondaryTimeoutRef.current);
    };
  }, [needsSecondaryData, profileLoading, adminLoading]);

  const performRouting = useCallback(() => {
    // RULE 1: No session sign-in flag → treat as unauthenticated
    if (!user || !signedInThisSession) {
      if (isPublicRoute) {
        setHasRouted(true);
        return;
      }
      navigate('/signin', { replace: true });
      setHasRouted(true);
      return;
    }

    // RULE 2: Authenticated + signed in this session
    if (isAuthRoute || currentPath === '/') {
      if (isAdmin && !adminQuestionnaireDone) {
        navigate('/onboarding/name', { replace: true });
      } else if (!isAdmin && !hasCompletedOnboarding) {
        navigate('/onboarding/name', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      setHasRouted(true);
      return;
    }

    // Admin QA mode
    if (isAdmin && !adminQuestionnaireDone) {
      if (isProtectedAppRoute) {
        setHasRouted(true);
        return;
      }
      if (!isOnboardingRoute) {
        navigate('/onboarding/name', { replace: true });
      }
      setHasRouted(true);
      return;
    }

    // Normal users: completed onboarding → skip questionnaire
    if (!isAdmin && hasCompletedOnboarding && isOnboardingRoute) {
      navigate('/dashboard', { replace: true });
      setHasRouted(true);
      return;
    }

    setHasRouted(true);
  }, [
    user,
    signedInThisSession,
    isAdmin,
    hasCompletedOnboarding,
    adminQuestionnaireDone,
    currentPath,
    isPublicRoute,
    isOnboardingRoute,
    isProtectedAppRoute,
    isAuthRoute,
    navigate,
  ]);

  useEffect(() => {
    if (isLoading) {
      setHasRouted(false);
      return;
    }
    performRouting();
  }, [isLoading, performRouting]);

  useEffect(() => {
    const handleAdminQuestionnaireDone = () => {
      setAdminQuestionnaireDone(true);
      sessionStorage.setItem('admin-questionnaire-done', 'true');
    };
    window.addEventListener('admin-questionnaire-complete', handleAdminQuestionnaireDone);
    return () => {
      window.removeEventListener('admin-questionnaire-complete', handleAdminQuestionnaireDone);
    };
  }, []);

  if (isLoading || !hasRouted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
