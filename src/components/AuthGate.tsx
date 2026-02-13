import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useAdminStatus } from '@/hooks/useAdminStatus';

interface AuthGateProps {
  children: ReactNode;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/signin', '/signup', '/email-confirmation', '/auth/callback', '/password-reset', '/update-password', '/welcome'];

// Onboarding routes (subscription is part of onboarding for new users)
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

// Routes that authenticated users can ALWAYS access regardless of onboarding status
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

  const isLoading = authLoading || (user && (profileLoading || adminLoading));

  const performRouting = useCallback(() => {
    if (!user) {
      if (isPublicRoute) {
        setHasRouted(true);
        return;
      }
      navigate('/signin', { replace: true });
      setHasRouted(true);
      return;
    }

    // User is authenticated
    if (isAuthRoute) {
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

  // Loading screen — no AnimatedBackground here (it's at App root)
  if (isLoading || !hasRouted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
