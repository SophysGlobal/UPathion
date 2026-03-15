import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { GradientInput } from "@/components/ui/GradientInput";
import { useOnboarding } from "@/context/OnboardingContext";
import { Check, ChevronLeft } from "lucide-react";

const REFERRAL_OPTIONS = [
  { id: 'search', label: 'Search engine', icon: '🔍' },
  { id: 'friends', label: 'Family or friends', icon: '👨‍👩‍👧‍👦' },
  { id: 'social', label: 'Social media', icon: '📱' },
  { id: 'ai', label: 'AI', icon: '🤖' },
  { id: 'school', label: 'School', icon: '🏫' },
  { id: 'other', label: 'Other', icon: '✨' },
] as const;

type ReferralSource = typeof REFERRAL_OPTIONS[number]['id'];

const HowDidYouHear = () => {
  const navigate = useNavigate();
  const { updateData } = useOnboarding();
  const [selectedSource, setSelectedSource] = useState<ReferralSource | ''>('');
  const [otherText, setOtherText] = useState('');

  const handleContinue = () => {
    if (!selectedSource) return;
    
    // Store in onboarding context (will be saved to DB later)
    updateData({ 
      referralSource: selectedSource,
      referralSourceOther: selectedSource === 'other' ? otherText.trim() : '',
    });
    
    navigate("/onboarding/school");
  };

  const handleSelect = (source: ReferralSource) => {
    setSelectedSource(source);
    if (source !== 'other') {
      setOtherText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedSource) {
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
          <h1 className="text-3xl font-bold text-foreground">How did you hear about us?</h1>
          <p className="text-muted-foreground">Help us understand how you found UPathion</p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          {REFERRAL_OPTIONS.map((option) => {
            const isSelected = selectedSource === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200
                  flex flex-col items-center gap-2 text-center
                  ${isSelected 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                    : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
                <span className="text-2xl">{option.icon}</span>
                <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Other text input */}
        {selectedSource === 'other' && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-sm font-medium text-foreground">
              Please tell us more (optional)
            </label>
            <GradientInput
              type="text"
              placeholder="How did you find us?"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              maxLength={100}
            />
          </div>
        )}

        {/* Continue Button */}
        <div className="animate-fade-in">
          <GradientButton 
            variant="filled" 
            className="w-full"
            onClick={handleContinue}
            disabled={!selectedSource}
          >
            Continue
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

export default HowDidYouHear;

