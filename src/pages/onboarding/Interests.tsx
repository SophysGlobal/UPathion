import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Check, Search, X, ChevronLeft } from "lucide-react";

const ALL_MAJORS = [
  // STEM
  "Computer Science",
  "Software Engineering",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
  "Information Technology",
  "Information Systems",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Biomedical Engineering",
  "Industrial Engineering",
  "Materials Science & Engineering",
  "Environmental Engineering",
  "Nuclear Engineering",
  "Computer Engineering",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Applied Mathematics",
  "Statistics",
  "Biology",
  "Biochemistry",
  "Molecular Biology",
  "Microbiology",
  "Genetics",
  "Neuroscience",
  "Environmental Science",
  "Marine Biology",
  "Ecology",
  "Geology",
  "Astronomy",
  "Astrophysics",
  "Bioinformatics",
  "Biotechnology",
  "Pharmaceutical Sciences",

  // Business
  "Business Administration",
  "Finance",
  "Accounting",
  "Marketing",
  "Entrepreneurship",
  "Supply Chain Management",
  "Management Information Systems",
  "International Business",
  "Real Estate",
  "Human Resources Management",
  "Operations Management",
  "Business Analytics",
  "Hospitality Management",
  "Sports Management",
  "Risk Management & Insurance",
  "Actuarial Science",

  // Social Sciences
  "Economics",
  "Political Science",
  "Psychology",
  "Sociology",
  "Anthropology",
  "International Relations",
  "Public Policy",
  "Public Administration",
  "Criminal Justice",
  "Criminology",
  "Social Work",
  "Urban Planning",
  "Geography",
  "Gender Studies",
  "Ethnic Studies",
  "Human Development",

  // Humanities
  "Philosophy",
  "History",
  "English",
  "English Literature",
  "Comparative Literature",
  "Linguistics",
  "Religious Studies",
  "Theology",
  "Classics",
  "Art History",
  "American Studies",
  "African American Studies",
  "Asian Studies",
  "Latin American Studies",
  "Middle Eastern Studies",
  "European Studies",

  // Arts
  "Graphic Design",
  "Studio Art",
  "Film Production",
  "Film Studies",
  "Music",
  "Music Performance",
  "Music Production",
  "Theatre",
  "Dance",
  "Creative Writing",
  "Animation",
  "Photography",
  "Fashion Design",
  "Interior Design",
  "Industrial Design",
  "Architecture",
  "Landscape Architecture",
  "Game Design",

  // Communications & Media
  "Communications",
  "Journalism",
  "Public Relations",
  "Advertising",
  "Media Studies",
  "Digital Media",
  "Broadcasting",
  "Strategic Communications",

  // Health & Medical
  "Nursing",
  "Public Health",
  "Pre-Med",
  "Pre-Dental",
  "Pre-Veterinary",
  "Kinesiology",
  "Health Sciences",
  "Nutrition & Dietetics",
  "Speech-Language Pathology",
  "Occupational Therapy",
  "Physical Therapy",
  "Athletic Training",
  "Biomedical Sciences",
  "Epidemiology",
  "Health Administration",
  "Dental Hygiene",
  "Respiratory Therapy",
  "Radiologic Technology",
  "Medical Laboratory Science",

  // Education
  "Elementary Education",
  "Secondary Education",
  "Special Education",
  "Early Childhood Education",
  "Educational Leadership",
  "Curriculum & Instruction",
  "Higher Education Administration",
  "Physical Education",
  "TESOL / ESL",

  // Law & Government
  "Pre-Law",
  "Legal Studies",
  "Paralegal Studies",
  "Political Science (Pre-Law)",
  "Homeland Security",
  "Military Science",

  // Agriculture & Environment
  "Agriculture",
  "Agricultural Engineering",
  "Animal Science",
  "Food Science",
  "Forestry",
  "Environmental Policy",
  "Sustainable Development",
  "Wildlife Biology",
  "Horticulture",

  // Other
  "Undecided / Exploratory",
  "Liberal Arts",
  "Interdisciplinary Studies",
] as const;

const Interests = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.interests || []);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 200);

  const sortedMajors = [...ALL_MAJORS].sort((a, b) => a.localeCompare(b));

  const filteredMajors = debouncedQuery
    ? sortedMajors.filter((m) =>
        m.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : sortedMajors;

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
    navigate("/onboarding/extracurriculars");
  };

  const handleSkip = () => {
    updateData({ interests: [] });
    navigate("/onboarding/extracurriculars");
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
