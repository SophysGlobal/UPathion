import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Check, Search, X, ChevronLeft } from "lucide-react";

const ALL_MAJORS = [
  "Computer Science",
  "Biology",
  "Economics",
  "Psychology",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Political Science",
  "Mathematics",
  "Business Administration",
  "Finance",
  "Accounting",
  "Marketing",
  "Chemistry",
  "Physics",
  "Sociology",
  "Environmental Science",
  "English",
  "History",
  "Philosophy",
  "Communications",
  "Nursing",
  "Pre-Med",
  "Pre-Law",
  "Architecture",
  "Art & Design",
  "Music",
  "Theater",
  "Film Studies",
  "Data Science",
  "Information Technology",
  "Cybersecurity",
  "Biochemistry",
  "Neuroscience",
  "Public Health",
  "International Relations",
  "Anthropology",
  "Linguistics",
  "Education",
  "Journalism",
  "Criminal Justice",
  "Kinesiology",
  "Supply Chain Management",
  "Statistics",
  "Aerospace Engineering",
  "Biomedical Engineering",
] as const;

const Interests = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.interests || []);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 200);

  const filteredMajors = debouncedQuery
    ? ALL_MAJORS.filter((m) =>
        m.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : [...ALL_MAJORS];

  const toggleMajor = useCallback((major: string) => {
    setSelected((prev) =>
      prev.includes(major) ? prev.filter((m) => m !== major) : [...prev, major]
    );
  }, []);

  const removeMajor = useCallback((major: string) => {
    setSelected((prev) => prev.filter((m) => m !== major));
  }, []);

  const handleContinue = () => {
    updateData({ interests: selected });
    navigate("/onboarding/school-confirm");
  };

  const handleSkip = () => {
    updateData({ interests: [] });
    navigate("/onboarding/school-confirm");
  };

  const handleBack = () => {
    updateData({ interests: selected });
    if (data.schoolType === "high_school") {
      navigate("/onboarding/aspirational-school");
    } else {
      navigate("/onboarding/school");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md space-y-5 relative z-10">
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">
            What do you want to study?
          </h1>
          <p className="text-muted-foreground">Select your intended majors</p>
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {selected.map((major) => (
              <span
                key={major}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium"
              >
                {major}
                <button
                  onClick={() => removeMajor(major)}
                  className="ml-0.5 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="relative animate-fade-in">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search majors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>

        {/* Scrollable list */}
        <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-card animate-fade-in">
          {filteredMajors.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              No majors match your search
            </p>
          ) : (
            filteredMajors.map((major) => {
              const isSelected = selected.includes(major);
              return (
                <button
                  key={major}
                  type="button"
                  onClick={() => toggleMajor(major)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors border-b border-border/50 last:border-0 ${
                    isSelected
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <span>{major}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-fade-in pt-1">
          <GradientButton
            variant="filled"
            className="w-full"
            onClick={handleContinue}
          >
            Continue{selected.length > 0 ? ` (${selected.length})` : ""}
          </GradientButton>

          <button
            onClick={handleSkip}
            className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Skip for now
          </button>

          <button
            onClick={handleBack}
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

export default Interests;
