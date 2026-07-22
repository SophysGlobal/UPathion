import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSuspensionStatus } from '@/hooks/useSuspensionStatus';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Ban, LogOut } from 'lucide-react';

// Routes where the suspension lock screen must NOT appear
const ALLOWED_WHEN_SUSPENDED = [
  '/', '/signin', '/signup', '/welcome',
  '/auth/callback', '/password-reset', '/update-password',
  '/email-confirmation', '/community-guidelines', '/settings',
];

interface Props { children: ReactNode }

const SuspendedGate = ({ children }: Props) => {
  const { user } = useAuth();
  const { isSuspended, suspension, loading } = useSuspensionStatus();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || loading || !isSuspended) return <>{children}</>;
  if (ALLOWED_WHEN_SUSPENDED.includes(location.pathname)) return <>{children}</>;

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch {}
    navigate('/signin', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-background/95 backdrop-blur">
      <div className="max-w-md w-full text-center space-y-5 gradient-border">
        <div className="bg-card/95 rounded-2xl p-8 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
            <Ban className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-semibold">Account suspended</h1>
          <p className="text-sm text-muted-foreground">
            Your account is temporarily locked from posting, messaging, and community features.
          </p>
          {suspension?.reason && (
            <p className="text-sm text-foreground/90">
              <span className="text-muted-foreground">Reason: </span>{suspension.reason}
            </p>
          )}
          {suspension?.is_permanent ? (
            <p className="text-xs text-destructive">This suspension is permanent.</p>
          ) : suspension?.expires_at ? (
            <p className="text-xs text-muted-foreground">
              Access restores on {new Date(suspension.expires_at).toLocaleString()}.
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            If you believe this is a mistake, review the community guidelines and appeal via support.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/community-guidelines')}>
              Community Guidelines
            </Button>
            <Button size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspendedGate;