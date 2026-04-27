import { ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useAdminStatus } from '@/hooks/useAdminStatus';

interface AuthGateProps {
  children: ReactNode;
}

const SESSION_SIGNED_IN_KEY = 'upathion_signed_in_this_session';
const SUBSCRIPTION_SHOWN_KEY = 'upathion_sub_shown_timestamps';
const MAX_SUB_SHOWS_PER_WEEK = 2;

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

/** Check if subscription screen should be shown (max 2x per week for non-premium) */
const shouldShowSubscription = (): boolean => {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_SHOWN_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentShows = timestamps.filter((t) => t > oneWeekAgo);
    return recentShows.length < MAX_SUB_SHOWS_PER_WEEK;
  } catch {
    return true;
  }
};

const markSubscriptionShown = () => {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_SHOWN_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentShows = timestamps.filter((t) => t > oneWeekAgo);
    recentShows.push(Date.now());
    localStorage.setItem(SUBSCRIPTION_SHOWN_KEY, JSON.stringify(recentShows));
  } catch {}
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

    // RULE 2: Authenticated + signed in this session
    if (isAuthRoute || currentPath === '/') {
    if (isAdmin && !adminQuestionnaireDone) {
        // Admins always go through questionnaire
        navigate('/onboarding/name', { replace: true });
      } else if (isAdmin) {
        navigate('/dashboard', { replace: true });
      } else if (isPremium) {
        // Premium users go straight to dashboard
        navigate('/dashboard', { replace: true });
      } else if (!hasCompletedOnboarding) {
        // Normal first-time users go to subscription (questionnaire navigates there)
        if (shouldShowSubscription()) {
          markSubscriptionShown();
          navigate('/subscription', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        // Returning non-premium: show subscription 2x/week
        if (shouldShowSubscription()) {
          markSubscriptionShown();
          navigate('/subscription', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
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

    // Admin who completed questionnaire: skip subscription, go to dashboard
    if (isAdmin && adminQuestionnaireDone && currentPath === '/subscription') {
      navigate('/dashboard', { replace: true });
      setHasRouted(true);
      return;
    }

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm leading-none">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
