import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { GradientInput } from "@/components/ui/GradientInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PasswordReset = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!EMAIL_RE.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    setIsLoading(false);
    
    if (error) {
      console.error("Password reset error:", error);
      // Don't reveal if the email exists or not for security
      toast.error("Failed to send reset email. Please try again.");
      return;
    }
    
    setEmailSent(true);
    toast.success("Password reset email sent! Check your inbox.");
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AnimatedBackground />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="flex justify-center animate-fade-in">
            <Logo />
          </div>

          <div className="text-center space-y-4 animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
            <p className="text-muted-foreground">
              We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>

          <div className="space-y-3 animate-fade-in">
            <GradientButton 
              onClick={() => setEmailSent(false)}
              className="w-full"
            >
              Try again
            </GradientButton>
            <GradientButton 
              variant="default"
              onClick={() => navigate("/signin")}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
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
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="animate-fade-in">
            <GradientInput
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="animate-fade-in">
            <GradientButton 
              type="submit" 
              variant="filled" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </GradientButton>
          </div>
        </form>

        <div className="text-center animate-fade-in">
          <GradientButton 
            variant="default"
            onClick={() => navigate("/signin")}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
