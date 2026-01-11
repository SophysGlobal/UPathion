import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import Divider from "@/components/Divider";
import { GradientInput } from "@/components/ui/GradientInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { validatePassword, getPasswordRequirements } from "@/lib/passwordValidation";
import { Check, X, Eye, EyeOff } from "lucide-react";

const SignUp = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signUpWithEmail, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const validation = validatePassword(password);

  // AuthGate handles redirects for logged-in users

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
    
    // Validate password strength
    if (!validation.valid) {
      toast.error(validation.error);
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
    
    toast.success("Account created! You can now sign in.");
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
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Join Campfire</h1>
          <p className="text-muted-foreground">Create your account to get started</p>
        </div>

        {/* Google Sign Up */}
        <div className="animate-fade-in">
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
        <div className="animate-fade-in">
          <Divider text="or" />
        </div>

        {/* Password Requirements */}
        <div className="animate-fade-in text-sm text-muted-foreground text-center">
          {getPasswordRequirements()}
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="animate-fade-in">
            <GradientInput
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="animate-fade-in relative">
            <GradientInput
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Requirements Checklist */}
          {password.length > 0 && (
            <div className="animate-fade-in bg-card/50 backdrop-blur-sm rounded-lg p-3 space-y-1.5">
              <RequirementItem 
                met={validation.requirements.minLength} 
                text="At least 8 characters" 
              />
              <RequirementItem 
                met={validation.requirements.hasLowercase} 
                text="Lowercase letter" 
              />
              <RequirementItem 
                met={validation.requirements.hasUppercase} 
                text="Uppercase letter" 
              />
              <RequirementItem 
                met={validation.requirements.hasNumber} 
                text="Number" 
              />
              <RequirementItem 
                met={validation.requirements.hasSpecialChar} 
                text="Special character" 
              />
            </div>
          )}

          <div className="animate-fade-in relative">
            <GradientInput
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {confirmPassword && password !== confirmPassword && (
            <p className="text-destructive text-sm animate-fade-in">Passwords don't match</p>
          )}

          <div className="animate-fade-in">
            <GradientButton 
              type="submit" 
              variant="filled" 
              className="w-full"
              disabled={isLoading || !validation.valid || password !== confirmPassword}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </GradientButton>
          </div>
        </form>

        {/* Sign In Link */}
        <div className="text-center space-y-3 pt-4 border-t border-border animate-fade-in">
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

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-xs">
    {met ? (
      <Check className="w-3 h-3 text-green-500" />
    ) : (
      <X className="w-3 h-3 text-muted-foreground" />
    )}
    <span className={met ? "text-foreground" : "text-muted-foreground"}>{text}</span>
  </div>
);

export default SignUp;
