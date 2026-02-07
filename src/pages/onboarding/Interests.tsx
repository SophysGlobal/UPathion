import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { Check } from "lucide-react";

const INTEREST_OPTIONS = [
  { id: 'stem', label: 'STEM', icon: '🔬' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'arts', label: 'Arts', icon: '🎨' },
  { id: 'humanities', label: 'Humanities', icon: '📚' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'research', label: 'Research', icon: '🧪' },
  { id: 'startups', label: 'Startups', icon: '🚀' },
  { id: 'medicine', label: 'Medicine', icon: '🏥' },
  { id: 'law', label: 'Law', icon: '⚖️' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'social_impact', label: 'Social Impact', icon: '🌍' },
] as const;

const Interests = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.interests || []);

  const toggleInterest = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    updateData({ interests: selected });
    navigate("/onboarding/school-confirm");
  };

  const handleSkip = () => {
    updateData({ interests: [] });
    navigate("/onboarding/school-confirm");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">What are you interested in?</h1>
          <p className="text-muted-foreground">Select all that apply</p>
        </div>

        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          {INTEREST_OPTIONS.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleInterest(option.id)}
                className={`
                  relative p-3 rounded-xl border-2 transition-all duration-200
                  flex flex-col items-center gap-1.5 text-center
                  ${isSelected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  </div>
                )}
                <span className="text-xl">{option.icon}</span>
                <span className={`text-xs font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 animate-fade-in pt-2">
          <GradientButton
            variant="filled"
            className="w-full"
            onClick={handleContinue}
          >
            Continue{selected.length > 0 ? ` (${selected.length})` : ''}
          </GradientButton>

          <button
            onClick={handleSkip}
            className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Skip for now
          </button>
        </div>

        {/* Progress indicator - step 4 or 5 depending on flow */}
        <div className="flex justify-center gap-2 pt-4 animate-fade-in">
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg opacity-50" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
};

export default Interests;
