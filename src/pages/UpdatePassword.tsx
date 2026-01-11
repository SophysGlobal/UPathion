import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { GradientInput } from "@/components/ui/GradientInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword, getPasswordRequirements } from "@/lib/passwordValidation";
import { Check, X, Eye, EyeOff } from "lucide-react";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // A recovery session will have an access token
      setIsValidSession(!!session?.access_token);
    };
    
    checkSession();

    // Listen for auth state changes (recovery link will trigger this)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validation = validatePassword(password);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    setIsLoading(false);
    
    if (error) {
      console.error("Password update error:", error);
      if (error.message.includes("same as")) {
        toast.error("New password must be different from your current password");
      } else {
        toast.error("Failed to update password. Please try again.");
      }
      return;
    }
    
    toast.success("Password updated successfully!");
    navigate("/signin");
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AnimatedBackground />
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AnimatedBackground />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="flex justify-center animate-fade-in">
            <Logo />
          </div>

          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground">Link expired</h1>
            <p className="text-muted-foreground">
              This password reset link has expired or is invalid. Please request a new one.
            </p>
          </div>

          <div className="animate-fade-in">
            <GradientButton 
              onClick={() => navigate("/password-reset")}
              className="w-full"
              variant="filled"
            >
              Request New Link
            </GradientButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Create new password</h1>
          <p className="text-muted-foreground text-sm">
            {getPasswordRequirements()}
          </p>
        </div>

        {/* Password Requirements Checklist */}
        {password.length > 0 && (
          <div className="animate-fade-in bg-card/50 backdrop-blur-sm rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground mb-2">Password requirements:</p>
            <RequirementItem 
              met={validation.requirements.minLength} 
              text="At least 8 characters" 
            />
            <RequirementItem 
              met={validation.requirements.hasLowercase} 
              text="Contains lowercase letter" 
            />
            <RequirementItem 
              met={validation.requirements.hasUppercase} 
              text="Contains uppercase letter" 
            />
            <RequirementItem 
              met={validation.requirements.hasNumber} 
              text="Contains number" 
            />
            <RequirementItem 
              met={validation.requirements.hasSpecialChar} 
              text="Contains special character" 
            />
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="animate-fade-in relative">
            <GradientInput
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="animate-fade-in relative">
            <GradientInput
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
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
              {isLoading ? "Updating..." : "Update Password"}
            </GradientButton>
          </div>
        </form>
      </div>
    </div>
  );
};

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-sm">
    {met ? (
      <Check className="w-4 h-4 text-green-500" />
    ) : (
      <X className="w-4 h-4 text-muted-foreground" />
    )}
    <span className={met ? "text-foreground" : "text-muted-foreground"}>{text}</span>
  </div>
);

export default UpdatePassword;
