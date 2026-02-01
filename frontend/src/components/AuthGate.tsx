import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import AnimatedBackground from '@/components/AnimatedBackground';

interface AuthGateProps {
  children: ReactNode;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/signin', '/signup', '/email-confirmation', '/auth/callback', '/password-reset', '/update-password'];

// Onboarding routes
const ONBOARDING_ROUTES = [
  '/onboarding/name',
  '/onboarding/name-confirm',
  '/onboarding/school',
  '/onboarding/aspirational-school',
  '/onboarding/school-confirm',
];

// Subscription route - part of onboarding flow but accessible to all authenticated users
const SUBSCRIPTION_ROUTE = '/subscription';

// Protected app routes that should always be accessible to authenticated users
// These routes should NEVER redirect to onboarding
const PROTECTED_APP_ROUTES = [
  '/dashboard',
  '/feed',
  '/explore',
  '/profile',
  '/edit-profile',
  '/settings',
  '/plan-management',
  '/settings/plan',
  '/school-info',
  '/school-community',
  '/privacy-settings',
  '/messages',
  '/welcome',
  // Dynamic routes patterns
  '/school/',
  '/group/',
  '/event/',
  '/place/',
  '/messages/',
  '/user/',
];

const AuthGate = ({ children }: AuthGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, hasCompletedOnboarding } = useProfileCompletion();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track if admin has gone through questionnaire this session
  const [adminQuestionnaireDone, setAdminQuestionnaireDone] = useState(() => {
    return sessionStorage.getItem('admin-questionnaire-done') === 'true';
  });

  // Track if we've done initial routing decision
  const [hasRouted, setHasRouted] = useState(false);

  // When auth user changes (sign-in/sign-out/refresh), re-run routing deterministically.
  // Also reset the admin questionnaire flag so admins are forced through onboarding on every app launch/login.
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
  const isSubscriptionRoute = currentPath === SUBSCRIPTION_ROUTE;
  const isProtectedAppRoute = PROTECTED_APP_ROUTES.some(route => currentPath.startsWith(route));

  // Calculate loading state - only wait for dependent queries when user exists
  const isLoading = authLoading || (user && (profileLoading || adminLoading));

  const performRouting = useCallback(() => {
    // Not authenticated
    if (!user) {
      // Allow public routes
      if (isPublicRoute) {
        setHasRouted(true);
        return;
      }
      // Redirect to signin for protected routes
      navigate('/signin', { replace: true });
      setHasRouted(true);
      return;
    }

    // User is authenticated
    // If on auth routes (signin/signup), redirect appropriately
    if (isAuthRoute) {
      // Admin: go to questionnaire if not done
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

    // If authenticated and on landing page, treat it as an entry point and route to the correct stack
    if (currentPath === '/') {
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

    // IMPORTANT FIX: Allow access to protected app routes for ALL authenticated users
    // This fixes the bug where "Connect with students" redirected to registration
    if (isProtectedAppRoute) {
      // Authenticated users can always access app routes
      setHasRouted(true);
      return;
    }

    // Allow subscription route for authenticated users (part of onboarding or accessed from settings)
    if (isSubscriptionRoute) {
      setHasRouted(true);
      return;
    }

    // Admin QA mode: force questionnaire every session ONLY if not on protected app routes
    if (isAdmin && !adminQuestionnaireDone && !isOnboardingRoute && !isProtectedAppRoute) {
      navigate('/onboarding/name', { replace: true });
      setHasRouted(true);
      return;
    }

    // Normal users: if already completed onboarding, skip questionnaire
    if (!isAdmin && hasCompletedOnboarding && isOnboardingRoute) {
      navigate('/dashboard', { replace: true });
      setHasRouted(true);
      return;
    }

    setHasRouted(true);
  }, [
    user,
    isAdmin,
    hasCompletedOnboarding,
    adminQuestionnaireDone,
    currentPath,
    isPublicRoute,
    isOnboardingRoute,
    isAuthRoute,
    isSubscriptionRoute,
    isProtectedAppRoute,
    navigate,
  ]);

  useEffect(() => {
    if (isLoading) {
      setHasRouted(false);
      return;
    }

    performRouting();
  }, [isLoading, performRouting]);

  // Expose a way for SchoolConfirm to mark admin questionnaire as done
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

  // Show loading screen while checking auth or performing initial routing
  if (isLoading || !hasRouted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AnimatedBackground />
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
