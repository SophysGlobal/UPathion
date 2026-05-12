import { ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import WeeklySubscriptionPrompt from '@/components/WeeklySubscriptionPrompt';

interface AuthGateProps {
  children: ReactNode;
}

const SESSION_SIGNED_IN_KEY = 'upathion_signed_in_this_session';

export const markSessionSignedIn = () => {
  try {
    sessionStorage.setItem(SESSION_SIGNED_IN_KEY, 'true');
  } catch {}
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
  '/onboarding/extracurriculars',
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

  const needsSecondaryData = !!user && signedInThisSession;
  const secondaryStillLoading = needsSecondaryData && (profileLoading || adminLoading) && !secondaryTimedOut;
  const isLoading = authLoading || secondaryStillLoading;

  useEffect(() => {
    if (needsSecondaryData && (profileLoading || adminLoading)) {
      secondaryTimeoutRef.current = setTimeout(() => {
        setSecondaryTimedOut(true);
      }, SECONDARY_LOADING_TIMEOUT_MS);
    } else {
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

    const isPremium = profile?.is_premium ?? false;

    // RULE 2: Authenticated + signed in this session — entry routing
    if (isAuthRoute || currentPath === '/') {
      if (isAdmin) {
        // ADMINS: always forced through questionnaire (QA mode) and then
        // ALWAYS through the subscription screen — every login, no exception.
        if (!adminQuestionnaireDone) {
          navigate('/onboarding/name', { replace: true });
        } else {
          navigate('/subscription', { replace: true });
        }
      } else if (!hasCompletedOnboarding) {
        // First-time normal user: send into the questionnaire. The
        // questionnaire's final step navigates to /subscription, then to app.
        navigate('/onboarding/name', { replace: true });
      } else {
        // Returning normal user (premium or not): straight to the app.
        // Weekly subscription nudge is handled in-app by WeeklySubscriptionPrompt.
        navigate('/dashboard', { replace: true });
      }
      setHasRouted(true);
      return;
    }

    // Admin QA mode: admins go through questionnaire each session
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

    // Admins who completed the questionnaire are intentionally KEPT on
    // /subscription — they must see the subscription screen every login.

    // Normal users: if completed onboarding, skip onboarding routes (except subscription)
    if (!isAdmin && hasCompletedOnboarding && isOnboardingRoute && currentPath !== '/subscription') {
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
    profile?.is_premium,
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
      <div className="fixed inset-0 flex items-center justify-center px-4">
        <div className="flex flex-col items-center justify-center gap-3 text-center mx-auto">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm leading-none text-center">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Weekly gentle subscription nudge for returning, non-admin,
          non-premium users who finished onboarding. Self-gates internally. */}
      {user && signedInThisSession && isProtectedAppRoute && (
        <WeeklySubscriptionPrompt />
      )}
    </>
  );
};

export default AuthGate;
