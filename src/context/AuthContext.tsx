import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Maximum time to wait for auth to resolve before treating as unauthenticated
const AUTH_TIMEOUT_MS = 3000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const resolvedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const resolve = (s: Session | null) => {
      resolvedRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    };

    // Safety net: if auth never resolves (stale tokens retrying with backoff,
    // network down, etc.), force-resolve as unauthenticated after timeout.
    timeoutRef.current = setTimeout(() => {
      if (!resolvedRef.current) {
        console.warn('[AuthContext] Auth timed out — treating as unauthenticated');
        resolve(null);
      }
    }, AUTH_TIMEOUT_MS);

    // 1. Set up auth state listener FIRST (catches token refresh results)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Always update state, even if already resolved (handles sign-in/out after init)
        setSession(session);
        setUser(session?.user ?? null);
        if (!resolvedRef.current) {
          resolve(session);
        } else {
          setLoading(false);
        }
      }
    );

    // 2. Then check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!resolvedRef.current) {
        resolve(error ? null : session);
      }
    }).catch(() => {
      if (!resolvedRef.current) {
        resolve(null);
      }
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
