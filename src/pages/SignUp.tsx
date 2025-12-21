import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import Divider from "@/components/Divider";
import { GradientInput } from "@/components/ui/GradientInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const SignUp = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signUpWithEmail, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate("/onboarding/name");
    }
  }, [user, loading, navigate]);

  const handleGoogleSignUp = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || "Failed to sign up with Google");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUpWithEmail(email, password);
    
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes("User already registered")) {
        toast.error("An account with this email already exists. Please sign in instead.");
      } else {
        toast.error(error.message || "Failed to create account");
      }
      return;
    }
    
    toast.success("Account created! Please check your email to confirm your account.");
    navigate("/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        {/* Welcome text */}
        <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-3xl font-bold text-foreground">Join Campfire</h1>
          <p className="text-muted-foreground">Create your account to get started</p>
        </div>

        {/* Google Sign Up */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <GradientButton 
            className="w-full" 
            onClick={handleGoogleSignUp}
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
            Sign up with Google
          </GradientButton>
        </div>

        {/* Divider */}
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Divider text="or" />
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <GradientInput
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <GradientInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <GradientInput
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <GradientButton 
              type="submit" 
              variant="filled" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </GradientButton>
          </div>
        </form>

        {/* Sign In Link */}
        <div className="text-center space-y-3 pt-4 border-t border-border animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <p className="text-muted-foreground text-sm">Already have an account?</p>
          <GradientButton 
            variant="default"
            onClick={() => navigate("/signin")}
            className="w-full"
          >
            Sign In
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
