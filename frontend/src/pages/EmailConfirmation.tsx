import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";

const EmailConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Get email from location state (passed from signup)
  const email = location.state?.email || "";

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("No email address found. Please try signing up again.");
      navigate("/signup");
      return;
    }

    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error("Resend confirmation error:", error);
        
        // Check if it's an SMTP error
        if (error.message.includes("sending confirmation email") || error.message.includes("SMTP")) {
          // Fall back to our custom edge function
          const { data, error: fnError } = await supabase.functions.invoke("send-confirmation-email", {
            body: {
              email,
              confirmationUrl: `${window.location.origin}/auth/callback`,
              type: "resend",
            },
          });

          if (fnError) {
            throw fnError;
          }

          toast.success("Confirmation email sent! Check your inbox.");
          setResendCooldown(60);
        } else {
          throw error;
        }
      } else {
        toast.success("Confirmation email sent! Check your inbox.");
        setResendCooldown(60);
      }
    } catch (error: any) {
      console.error("Failed to resend confirmation email:", error);
      toast.error(error.message || "Failed to send confirmation email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        {/* Icon */}
        <div className="flex justify-center animate-fade-in">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Check your email</h1>
          <p className="text-muted-foreground">
            We've sent a confirmation link to:
          </p>
          {email && (
            <p className="text-foreground font-medium bg-muted/50 py-2 px-4 rounded-lg inline-block">
              {email}
            </p>
          )}
          <p className="text-muted-foreground text-sm">
            Click the link in the email to confirm your account and get started.
          </p>
        </div>

        {/* Resend Section */}
        <div className="space-y-4 animate-fade-in">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-3">
              Didn't receive the email?
            </p>
            <GradientButton
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend confirmation email
                </>
              )}
            </GradientButton>
          </div>

          {/* Tips */}
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Tips:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes for the email to arrive</li>
            </ul>
          </div>
        </div>

        {/* Back to Sign In */}
        <div className="text-center pt-4 border-t border-border animate-fade-in">
          <p className="text-muted-foreground text-sm mb-3">
            Already confirmed your email?
          </p>
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

export default EmailConfirmation;
