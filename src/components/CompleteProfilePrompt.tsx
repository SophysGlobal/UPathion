import { useNavigate } from "react-router-dom";
import { GradientButton } from "@/components/ui/GradientButton";
import { UserCircle, X } from "lucide-react";

interface CompleteProfilePromptProps {
  onSkip: () => void;
}

const CompleteProfilePrompt = ({ onSkip }: CompleteProfilePromptProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md space-y-6 relative">
        <button
          onClick={onSkip}
          className="absolute -top-2 -right-2 p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="gradient-border">
          <div className="bg-card rounded-lg p-6 space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Finish setting up your profile
              </h2>
              <p className="text-sm text-muted-foreground">
                Complete your profile to get the most out of UPathion and connect with your school community.
              </p>
            </div>

            <div className="space-y-3">
              <GradientButton
                variant="filled"
                className="w-full"
                onClick={() => navigate("/edit-profile")}
              >
                Complete Profile
              </GradientButton>
              <button
                onClick={onSkip}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePrompt;
