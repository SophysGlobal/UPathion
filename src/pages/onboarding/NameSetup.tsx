import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientInput } from "@/components/ui/GradientInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const NameSetup = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();
  const [fullName, setFullName] = useState(data.fullName);
  const [username, setUsername] = useState(data.username);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  // Autofill from Google OAuth profile
  useEffect(() => {
    if (user && !hasAutoFilled) {
      const userMetadata = user.user_metadata;
      
      // Try to get name from Google OAuth metadata
      const googleName = userMetadata?.full_name || 
                         userMetadata?.name || 
                         userMetadata?.given_name || 
                         '';
      
      // Only autofill if we have a name and field is empty
      if (googleName && !fullName) {
        setFullName(googleName);
        setHasAutoFilled(true);
      }
    }
  }, [user, hasAutoFilled, fullName]);

  const handleContinue = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return;
    }
    
    updateData({ fullName: fullName.trim(), username: username.trim() });
    navigate("/onboarding/name-confirm");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleContinue();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" onKeyDown={handleKeyDown}>
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        {/* Title */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Let's get to know you</h1>
          <p className="text-muted-foreground">Tell us a bit about yourself</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2 animate-fade-in">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <GradientInput
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {user?.user_metadata?.full_name && fullName === user.user_metadata.full_name && (
              <p className="text-xs text-muted-foreground">
                ✓ Auto-filled from your Google account
              </p>
            )}
          </div>
          
          <div className="space-y-2 animate-fade-in">
            <label className="text-sm font-medium text-foreground">Username</label>
            <GradientInput
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
            <p className="text-xs text-muted-foreground">
              This is how others will see you in the community
            </p>
          </div>

          <div className="animate-fade-in">
            <GradientButton 
              variant="filled" 
              className="w-full"
              onClick={handleContinue}
            >
              Continue
            </GradientButton>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 pt-4 animate-fade-in">
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
};

export default NameSetup;
