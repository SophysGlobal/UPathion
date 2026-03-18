import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import MultiSelectSchools from "@/components/MultiSelectSchools";
import { ChevronLeft } from "lucide-react";

const AspirationalSchool = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  
  // Parse existing aspirational schools (stored as comma-separated string or single value)
  const initialSchools = data.aspirationalSchool 
    ? data.aspirationalSchool.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  
  const [selectedSchools, setSelectedSchools] = useState<string[]>(initialSchools);

  const handleContinue = () => {
    updateData({ aspirationalSchool: selectedSchools.join(', ') });
    navigate("/onboarding/interests");
  };

  const handleSkip = () => {
    updateData({ aspirationalSchool: "" });
    navigate("/onboarding/interests");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedSchools.length > 0) {
      e.preventDefault();
      handleContinue();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" onKeyDown={handleKeyDown}>
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        {/* Title */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Where do you want to go after high school?</h1>
          <p className="text-muted-foreground">Select your dream colleges (up to 5)</p>
        </div>

        {/* Multi-Select Schools */}
        <div className="animate-fade-in">
          <MultiSelectSchools
            selectedSchools={selectedSchools}
            onChange={setSelectedSchools}
            maxSelections={5}
            placeholder="Search for your dream colleges..."
          />
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-fade-in pt-2">
          <GradientButton 
            variant="filled" 
            className="w-full"
            onClick={handleContinue}
            disabled={selectedSchools.length === 0}
          >
            Continue
          </GradientButton>
          
          <button
            onClick={handleSkip}
            className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Skip for now
          </button>

          <button
            onClick={() => { updateData({ aspirationalSchool: selectedSchools.join(', ') }); navigate("/onboarding/school"); }}
            className="w-full flex items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Progress indicator */}
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

export default AspirationalSchool;
