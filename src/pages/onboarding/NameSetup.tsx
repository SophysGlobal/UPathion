import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientInput } from "@/components/ui/GradientInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useUsernameAvailability } from "@/hooks/useUsernameAvailability";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NameSetup = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();
  const [fullName, setFullName] = useState(data.fullName);
  const [username, setUsername] = useState(data.username);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const usernameAvailability = useUsernameAvailability(username, data.username);
  const isUsernameBlocking =
    usernameAvailability.status === "taken" ||
    usernameAvailability.status === "invalid_short" ||
    usernameAvailability.status === "invalid_chars";

  useEffect(() => {
    if (user && !hasAutoFilled) {
      const userMetadata = user.user_metadata;
      const googleName = userMetadata?.full_name || userMetadata?.name || userMetadata?.given_name || '';
      if (googleName && !fullName) {
        setFullName(googleName);
        setHasAutoFilled(true);
      }
    }
  }, [user, hasAutoFilled, fullName]);

  const handleContinue = () => {
    if (!fullName.trim()) { toast.error("Please enter your full name"); return; }
    if (!username.trim()) { toast.error("Please enter a username"); return; }
    if (username.length < 3) { toast.error("Username must be at least 3 characters"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { toast.error("Username can only contain letters, numbers, and underscores"); return; }
    if (usernameAvailability.status === "taken") {
      toast.error("Username already taken — please choose another");
      return;
    }
    updateData({ fullName: fullName.trim(), username: username.trim() });
    navigate("/onboarding/name-confirm");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleContinue(); }
  };

  return (
    <OnboardingLayout>
      <div className="text-center space-y-2 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">Let's get to know you</h1>
        <p className="text-muted-foreground">Tell us a bit about yourself</p>
      </div>

      <div className="space-y-6" onKeyDown={handleKeyDown}>
        <div className="space-y-2 animate-fade-in">
          <label className="text-sm font-medium text-foreground">Full Name</label>
          <GradientInput type="text" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          {user?.user_metadata?.full_name && fullName === user.user_metadata.full_name && (
            <p className="text-xs text-muted-foreground">✓ Auto-filled from your Google account</p>
          )}
        </div>
        <div className="space-y-2 animate-fade-in">
          <label className="text-sm font-medium text-foreground">Username</label>
          <GradientInput type="text" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
          <UsernameStatusIndicator availability={usernameAvailability} fallback="This is how others will see you in the community" />
        </div>
        <div className="animate-fade-in">
          <GradientButton
            variant="filled"
            className="w-full"
            onClick={handleContinue}
            disabled={isUsernameBlocking || usernameAvailability.status === "checking"}
          >
            Continue
          </GradientButton>
        </div>
      </div>

      <div className="flex justify-center gap-2 pt-4 animate-fade-in">
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full bg-muted" />
        <div className="w-8 h-1 rounded-full bg-muted" />
        <div className="w-8 h-1 rounded-full bg-muted" />
        <div className="w-8 h-1 rounded-full bg-muted" />
        <div className="w-8 h-1 rounded-full bg-muted" />
      </div>
    </OnboardingLayout>
  );
};

const UsernameStatusIndicator = ({
  availability,
  fallback,
}: {
  availability: ReturnType<typeof useUsernameAvailability>;
  fallback: string;
}) => {
  if (availability.status === "idle") {
    return <p className="text-xs text-muted-foreground">{fallback}</p>;
  }
  const tone = cn(
    "text-xs flex items-center gap-1.5 transition-colors",
    availability.status === "available" && "text-green-500",
    availability.status === "taken" && "text-destructive",
    (availability.status === "invalid_short" ||
      availability.status === "invalid_chars") &&
      "text-destructive",
    availability.status === "checking" && "text-muted-foreground",
  );
  const Icon =
    availability.status === "available"
      ? Check
      : availability.status === "checking"
        ? Loader2
        : X;
  return (
    <p className={tone}>
      <Icon
        className={cn(
          "w-3 h-3",
          availability.status === "checking" && "animate-spin",
        )}
      />
      {availability.message}
    </p>
  );
};

export default NameSetup;
