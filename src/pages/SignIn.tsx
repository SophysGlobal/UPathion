import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import Divider from "@/components/Divider";
import { GradientInput } from "@/components/ui/GradientInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignIn = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = EMAIL_RE.test(email.trim()) && password.trim() !== "";

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Google sign-in error:", error);
        setError(error.message || "Failed to sign in with Google");
        toast.error(error.message || "Failed to sign in with Google");
      }
      // Redirect handled by OAuth flow
    } catch (err) {
      console.error("Unexpected Google sign-in error:", err);
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setError("Please enter your email");
      toast.error("Please enter your email");
      return;
    }

    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      toast.error("Please enter a valid email address");
      return;
    }

    if (!trimmedPassword) {
      setError("Please enter your password");
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signInWithEmail(trimmedEmail, trimmedPassword);

      if (error) {
        console.error("Sign-in error:", error);
        let errorMessage = "Failed to sign in";

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please confirm your email before signing in";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Too many attempts. Please try again later";
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success: do NOT toast here; AuthGate must transition the app out of this screen.
      // Keep loading state until this component unmounts due to routing.
    } catch (err) {
      console.error("Unexpected sign-in error:", err);
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) return;

    // Defensive: if auth succeeded but the app doesn't transition out of this screen,
    // re-enable the form and show a clear message instead of silently staying stuck.
    const t = window.setTimeout(() => {
      setIsLoading(false);
      const msg = "Sign-in succeeded, but we couldn't redirect. Please refresh and try again.";
      setError(msg);
      toast.error(msg);
    }, 8000);

    return () => window.clearTimeout(t);
  }, [isLoading]);

  const handleForgotPassword = () => {
    toast.info("Password reset flow would be implemented here");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        {/* Welcome text */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to connect with your school community</p>
        </div>

        {/* Error display */}
        {error && (
          <div className="animate-fade-in bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-destructive text-sm text-center">{error}</p>
          </div>
        )}

        {/* Google Sign In */}
        <div className="animate-fade-in">
          <GradientButton 
            className="w-full" 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </GradientButton>
        </div>

        {/* Divider */}
        <div className="animate-fade-in">
          <Divider text="or" />
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="animate-fade-in">
            <GradientInput
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
            />
          </div>
          
          <div className="animate-fade-in">
            <GradientInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
            />
          </div>

          <div className="animate-fade-in">
            <GradientButton 
              type="submit" 
              variant="filled" 
              className="w-full"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </GradientButton>
          </div>
        </form>

        {/* Forgot Password */}
        <div className="text-center animate-fade-in">
          <button
            onClick={handleForgotPassword}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            disabled={isLoading}
          >
            Forgot Password?
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center space-y-3 pt-4 border-t border-border animate-fade-in">
          <p className="text-muted-foreground text-sm">Don't have an account?</p>
          <GradientButton 
            variant="default"
            onClick={() => navigate("/signup")}
            className="w-full"
            disabled={isLoading}
          >
            Sign Up
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
