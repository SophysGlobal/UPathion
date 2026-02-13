import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { CheckCircle, XCircle } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Supabase handles the token exchange automatically via onAuthStateChange
    // We just need to check for errors in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get("error");
    const errorDescription = hashParams.get("error_description");

    if (error) {
      console.error("Auth callback error:", error, errorDescription);
      setStatus("error");
      setErrorMessage(errorDescription || "Failed to confirm your email. Please try again.");
      return;
    }

    // If no error, the auth state change listener will handle the redirect
    // Give it a moment to process
    const timer = setTimeout(() => {
      setStatus("success");
      // Navigate to dashboard after showing success
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      
      
      <div className="w-full max-w-md space-y-8 relative z-10 text-center">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        {status === "loading" && (
          <div className="space-y-4 animate-fade-in">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Confirming your email...</h1>
            <p className="text-muted-foreground">Please wait while we verify your account.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 animate-fade-in">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Email confirmed!</h1>
            <p className="text-muted-foreground">Redirecting you to the app...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Confirmation failed</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="space-y-3">
              <GradientButton
                variant="filled"
                onClick={() => navigate("/signup")}
                className="w-full"
              >
                Try signing up again
              </GradientButton>
              <GradientButton
                variant="default"
                onClick={() => navigate("/signin")}
                className="w-full"
              >
                Go to Sign In
              </GradientButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
