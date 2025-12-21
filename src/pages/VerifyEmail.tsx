import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp, sendEmailOtp, user, loading } = useAuth();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Get email + flow from navigation state
  const email = location.state?.email || "";
  const flow: "signup" | "signin" =
    location.state?.flow === "signin" ? "signin" : "signup";
  const backPath = flow === "signin" ? "/signin" : "/signup";
  const otpType: "signup" | "magiclink" =
    flow === "signin" ? "magiclink" : "signup";

  const didAutoSendRef = useRef(false);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate(backPath);
    }
  }, [email, backPath, navigate]);

  // Auto-send code when arriving on this screen
  useEffect(() => {
    if (!email || didAutoSendRef.current) return;

    didAutoSendRef.current = true;
    setIsResending(true);

    (async () => {
      const { error } =
        flow === "signin" ? await sendEmailOtp(email) : await resendOtp(email);

      setIsResending(false);

      if (error) {
        didAutoSendRef.current = false;
        toast.error(error.message || "Failed to send verification code");
        return;
      }

      toast.success("Verification code sent!");
    })();
  }, [email, flow, resendOtp, sendEmailOtp]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate("/onboarding/name");
    }
  }, [user, loading, navigate]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    const { error } = await verifyOtp(email, otp, otpType);
    setIsLoading(false);

    if (error) {
      toast.error(error.message || "Invalid verification code");
      return;
    }

    toast.success(flow === "signin" ? "Signed in!" : "Email verified successfully!");
    navigate("/onboarding/name");
  };

  const handleResend = async () => {
    setIsResending(true);
    const { error } =
      flow === "signin" ? await sendEmailOtp(email) : await resendOtp(email);
    setIsResending(false);

    if (error) {
      toast.error(error.message || "Failed to resend code");
      return;
    }

    toast.success("Verification code sent!");
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

        {/* Title */}
        <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-3xl font-bold text-foreground">Verify your email</h1>
          <p className="text-muted-foreground">
            We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="bg-background/50 border-border/50" />
              <InputOTPSlot index={1} className="bg-background/50 border-border/50" />
              <InputOTPSlot index={2} className="bg-background/50 border-border/50" />
              <InputOTPSlot index={3} className="bg-background/50 border-border/50" />
              <InputOTPSlot index={4} className="bg-background/50 border-border/50" />
              <InputOTPSlot index={5} className="bg-background/50 border-border/50" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Verify Button */}
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <GradientButton
            variant="filled"
            className="w-full"
            onClick={handleVerify}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </GradientButton>
        </div>

        {/* Resend Code */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-muted-foreground text-sm mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
        </div>

        {/* Back */}
        <div className="text-center pt-4 border-t border-border animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <GradientButton 
            variant="default"
            onClick={() => navigate(backPath)}
            className="w-full"
          >
            {flow === "signin" ? "Back to Sign In" : "Back to Sign Up"}
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
