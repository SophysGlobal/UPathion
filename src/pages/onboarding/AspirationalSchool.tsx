import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import MultiSelectSchools from "@/components/MultiSelectSchools";
import BackSkipRow from "@/components/onboarding/BackSkipRow";

const AspirationalSchool = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const initialSchools = data.aspirationalSchool ? data.aspirationalSchool.split(',').map(s => s.trim()).filter(Boolean) : [];
  const [selectedSchools, setSelectedSchools] = useState<string[]>(initialSchools);

  const handleContinue = () => { updateData({ aspirationalSchool: selectedSchools.join(', ') }); navigate("/onboarding/interests"); };
  const handleSkip = () => { updateData({ aspirationalSchool: "" }); navigate("/onboarding/interests"); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedSchools.length > 0) { e.preventDefault(); handleContinue(); }
  };

  return (
    <OnboardingLayout>
      <div className="text-center space-y-2 animate-fade-in" onKeyDown={handleKeyDown}>
        <h1 className="text-3xl font-bold text-foreground">Where do you want to go after high school?</h1>
        <p className="text-muted-foreground">Select your dream colleges (up to 5)</p>
      </div>

      <div className="animate-fade-in">
        <MultiSelectSchools selectedSchools={selectedSchools} onChange={setSelectedSchools} maxSelections={5} placeholder="Search for your dream colleges..." />
      </div>

      <div className="space-y-3 animate-fade-in pt-2">
        <GradientButton variant="filled" className="w-full" onClick={handleContinue} disabled={selectedSchools.length === 0}>Continue</GradientButton>
        <BackSkipRow
          onBack={() => {
            updateData({ aspirationalSchool: selectedSchools.join(', ') });
            navigate("/onboarding/school");
          }}
          onSkip={handleSkip}
        />
      </div>

      <div className="flex justify-center gap-2 pt-4 animate-fade-in">
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full gradient-bg opacity-50" />
        <div className="w-8 h-1 rounded-full bg-muted" />
        <div className="w-8 h-1 rounded-full bg-muted" />
      </div>
    </OnboardingLayout>
  );
};

export default AspirationalSchool;
