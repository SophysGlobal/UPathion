import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { User, AtSign } from "lucide-react";

const NameConfirm = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        {/* Title */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Looking good!</h1>
          <p className="text-muted-foreground">Please confirm your details</p>
        </div>

        {/* Info Card */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</p>
                <p className="text-lg font-semibold text-foreground">{data.fullName}</p>
              </div>
            </div>
            
            <div className="h-px bg-border" />
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <AtSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Username</p>
                <p className="text-lg font-semibold text-foreground">@{data.username}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 animate-fade-in">
          <GradientButton 
            variant="default"
            className="flex-1"
            onClick={() => navigate("/onboarding/name")}
          >
            Edit
          </GradientButton>
          <GradientButton 
            variant="filled"
            className="flex-1"
            onClick={() => navigate("/onboarding/how-did-you-hear")}
          >
            Confirm
          </GradientButton>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 pt-4 animate-fade-in">
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
};

export default NameConfirm;
