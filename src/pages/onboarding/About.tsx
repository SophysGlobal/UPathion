import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientButton } from "@/components/ui/GradientButton";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/context/OnboardingContext";
import BackSkipRow from "@/components/onboarding/BackSkipRow";
import { Sparkles } from "lucide-react";

const MAX_LEN = 400;

const About = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const [about, setAbout] = useState(data.about || "");

  const nextStep = "/onboarding/education";

  const handleContinue = () => {
    updateData({ about: about.trim() });
    navigate(nextStep);
  };

  const handleSkip = () => {
    updateData({ about: "" });
    navigate(nextStep);
  };

  const handleBack = () => {
    updateData({ about: about.trim() });
    navigate("/onboarding/extracurriculars");
  };

  const charCount = about.length;

  return (
    <OnboardingLayout>
      <div className="text-center space-y-2 animate-fade-in">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full gradient-bg mx-auto mb-1">
          <Sparkles className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Introduce yourself</h1>
        <p className="text-muted-foreground px-4">
          A short intro helps others get to know you, find common ground, and reach out.
          Take 30 seconds — it makes a real difference.
        </p>
      </div>

      <div className="space-y-2 animate-fade-in">
        <label className="text-sm font-medium text-foreground">About you</label>
        <div className="gradient-border">
          <Textarea
            value={about}
            onChange={(e) => setAbout(e.target.value.slice(0, MAX_LEN))}
            placeholder="What are you passionate about? What are you working on? What would you love to connect over?"
            className="min-h-[140px] bg-card border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Tip: mention interests, goals, or fun facts.</span>
          <span>{charCount}/{MAX_LEN}</span>
        </div>
      </div>

      <div className="space-y-3 animate-fade-in pt-1">
        <GradientButton variant="filled" className="w-full" onClick={handleContinue}>
          Continue
        </GradientButton>
        <BackSkipRow onBack={handleBack} onSkip={handleSkip} />
      </div>

      <div className="flex justify-center gap-2 pt-4 animate-fade-in">
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full gradient-bg opacity-60" />
      </div>
    </OnboardingLayout>
  );
};

export default About;