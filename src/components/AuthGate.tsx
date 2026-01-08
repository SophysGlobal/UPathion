import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import AnimatedBackground from '@/components/AnimatedBackground';

interface AuthGateProps {
  children: ReactNode;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/signin', '/signup'];

// Onboarding routes
const ONBOARDING_ROUTES = [
  '/onboarding/name',
  '/onboarding/name-confirm',
  '/onboarding/school',
  '/onboarding/aspirational-school',
  '/onboarding/school-confirm',
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

  const isLoading = authLoading || (user && (profileLoading || adminLoading));
  const currentPath = location.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);
  const isOnboardingRoute = ONBOARDING_ROUTES.includes(currentPath);

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (!user) {
      // Allow public routes
      if (isPublicRoute) return;
      // Redirect to signin for protected routes
      navigate('/signin', { replace: true });
      return;
    }

    // User is authenticated
    // If on public auth routes (signin/signup), redirect to app
    if (currentPath === '/signin' || currentPath === '/signup') {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Admin QA mode: force questionnaire every session
    if (isAdmin && !adminQuestionnaireDone) {
      // If not on onboarding route, redirect to start questionnaire
      if (!isOnboardingRoute) {
        navigate('/onboarding/name', { replace: true });
        return;
      }
      // If completing the questionnaire (at school-confirm), mark as done
      // This will be handled by the SchoolConfirm page
    }

    // Normal users: if already completed onboarding, skip questionnaire
    if (!isAdmin && hasCompletedOnboarding && isOnboardingRoute) {
      navigate('/dashboard', { replace: true });
      return;
    }

  }, [
    isLoading,
    user,
    isAdmin,
    hasCompletedOnboarding,
    adminQuestionnaireDone,
    currentPath,
    isPublicRoute,
    isOnboardingRoute,
    navigate,
  ]);

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

  // Show loading screen while checking auth
  if (isLoading) {
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
