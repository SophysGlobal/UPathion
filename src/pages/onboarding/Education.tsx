import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/context/OnboardingContext";
import BackSkipRow from "@/components/onboarding/BackSkipRow";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 4 + i);

const LEVEL_OPTIONS: { key: "undergrad" | "grad" | "alumni"; label: string; hint: string }[] = [
  { key: "undergrad", label: "Undergraduate", hint: "Currently pursuing a bachelor's degree" },
  { key: "grad", label: "Graduate", hint: "Master's, PhD, or professional program" },
  { key: "alumni", label: "Alumni", hint: "Already graduated" },
];

const Education = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [level, setLevel] = useState<"undergrad" | "grad" | "alumni" | "">((data.studentLevel as any) || "");
  const [degree, setDegree] = useState(data.degree || "");
  const [gradYear, setGradYear] = useState<string>(data.graduationYear ? String(data.graduationYear) : "");

  const save = () => {
    updateData({
      studentLevel: level || "",
      degree: degree.trim(),
      graduationYear: gradYear ? parseInt(gradYear, 10) : null,
    });
  };

  const handleContinue = () => {
    save();
    navigate("/onboarding/school-confirm");
  };

  const handleSkip = () => {
    updateData({ studentLevel: "", degree: "", graduationYear: null });
    navigate("/onboarding/school-confirm");
  };

  const handleBack = () => {
    save();
    navigate("/onboarding/about");
  };

  return (
    <OnboardingLayout>
      <div className="text-center space-y-2 animate-fade-in">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full gradient-bg mx-auto mb-1">
          <GraduationCap className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Your education</h1>
        <p className="text-muted-foreground px-4">
          Optional — helps you connect with people who share your school, degree, or graduating class.
        </p>
      </div>

      <div className="space-y-4 animate-fade-in">
        <div>
          <p className="text-sm font-medium text-foreground mb-2">I am a…</p>
          <div className="grid grid-cols-1 gap-2">
            {LEVEL_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setLevel(opt.key)}
                className={cn(
                  "gradient-border text-left",
                  level === opt.key && "ring-2 ring-primary/50 rounded-lg",
                )}
              >
                <div className={cn(
                  "bg-card rounded-lg px-4 py-3 transition-colors",
                  level === opt.key ? "bg-primary/10" : "hover:bg-secondary/40",
                )}>
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Degree (optional)</label>
          <div className="gradient-border">
            <Input
              value={degree}
              onChange={(e) => setDegree(e.target.value.slice(0, 80))}
              placeholder="e.g. Bachelor's in Computer Science"
              className="bg-card border-0 focus-visible:ring-0"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            {level === "alumni" ? "Graduation year" : "Expected graduation year"}
          </label>
          <div className="gradient-border">
            <select
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              className="w-full bg-card rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none"
            >
              <option value="">Select a year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 animate-fade-in pt-1">
        <GradientButton variant="filled" className="w-full" onClick={handleContinue}>
          Continue
        </GradientButton>
        <BackSkipRow onBack={handleBack} onSkip={handleSkip} />
      </div>

      <div className="flex justify-center gap-2 pt-4 animate-fade-in">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-8 h-1 rounded-full gradient-bg" />
        ))}
      </div>
    </OnboardingLayout>
  );
};

export default Education;