import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Check, Search, X, ChevronLeft } from "lucide-react";

const ALL_EXTRACURRICULARS = [
  // Academic / Professional
  "Debate Team",
  "Model United Nations",
  "Academic Quiz Bowl",
  "Robotics Club",
  "Coding Club",
  "Pre-Med Society",
  "Engineering Club",
  "Entrepreneurship Club",
  "Investment Club",
  "Research Groups",
  "Math Club",
  "Science Olympiad",
  "Mock Trial",
  "Academic Decathlon",
  "Honor Society",
  "Tutoring / Peer Tutoring",
  "Journal / Academic Publishing",
  "Data Science Club",
  "Cybersecurity Club",
  "AI / Machine Learning Club",
  "Pre-Law Society",
  "Economics Club",
  "Accounting Society",
  "Architecture Club",

  // Arts / Creative
  "Orchestra",
  "Jazz Band",
  "Marching Band",
  "Choir / A Cappella",
  "Theatre / Drama",
  "Dance Team",
  "Film Club",
  "Photography Club",
  "Creative Writing Club",
  "Art Club",
  "Improv Comedy",
  "Poetry Club",
  "Ceramics / Sculpture Club",
  "Fashion Design Club",
  "Graphic Design Club",
  "Animation Club",
  "Music Production Club",

  // Leadership / Service
  "Student Government",
  "Volunteer Organizations",
  "Community Service Clubs",
  "Peer Mentoring",
  "Campus Ambassadors",
  "Resident Advisor (RA)",
  "Orientation Leader",
  "Leadership Institute",
  "Philanthropy Club",
  "Habitat for Humanity",
  "Red Cross Club",
  "Big Brothers Big Sisters",

  // Cultural / Identity
  "International Students Association",
  "Cultural Clubs",
  "Language Clubs",
  "Black Student Union",
  "Latin Student Association",
  "Asian Student Association",
  "LGBTQ+ Alliance",
  "Women in STEM",
  "First-Generation Student Club",
  "Interfaith Council",
  "Jewish Student Organization",
  "Muslim Student Association",
  "Christian Fellowship",

  // Sports / Physical
  "Club Sports (General)",
  "Intramural Sports",
  "Running Club",
  "Outdoor Adventure Club",
  "Climbing Club",
  "Cycling Club",
  "Swimming Club",
  "Martial Arts Club",
  "Yoga Club",
  "Ultimate Frisbee",
  "Rowing / Crew",
  "Skiing / Snowboarding Club",
  "Surfing Club",
  "Fencing Club",
  "Volleyball Club",
  "Soccer Club",
  "Basketball Club",
  "Tennis Club",
  "Cheerleading / Spirit Squad",
  "Dance Marathon",
  "Esports Team",

  // Media / Communication
  "Student Newspaper",
  "Campus Radio Station",
  "Campus TV Station",
  "Yearbook Committee",
  "Podcast Club",
  "Social Media Team",
  "Public Relations Club",
  "Blogging Club",

  // Social / Lifestyle
  "Gaming Club",
  "Board Game Club",
  "Cooking Club",
  "Environmental Club",
  "Sustainability Groups",
  "Astronomy Club",
  "Book Club",
  "Travel Club",
  "Wine & Cheese Club",
  "Coffee Club",
  "Gardening Club",
  "Animal Welfare Club",
  "Film Screening Society",

  // Greek Life & Social Orgs
  "Fraternity",
  "Sorority",
  "Co-ed Fraternity",
  "Professional Fraternity",
  "Service Sorority / Fraternity",

  // Career / Professional Development
  "Career Services Club",
  "Consulting Club",
  "Finance Club",
  "Marketing Club",
  "Supply Chain Club",
  "Real Estate Club",
  "Healthcare Administration Club",
  "Public Policy Club",
  "Education Club",
  "Journalism Club",
  "Law Review",
] as const;

const Extracurriculars = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.extracurriculars || []);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 200);

  const filtered = debouncedQuery
    ? ALL_EXTRACURRICULARS.filter((e) =>
        e.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : [...ALL_EXTRACURRICULARS];

  const toggle = useCallback((item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  const remove = useCallback((item: string) => {
    setSelected((prev) => prev.filter((i) => i !== item));
  }, []);

  const handleContinue = () => {
    updateData({ extracurriculars: selected });
    navigate("/onboarding/school-confirm");
  };

  const handleSkip = () => {
    updateData({ extracurriculars: [] });
    navigate("/onboarding/school-confirm");
  };

  const handleBack = () => {
    updateData({ extracurriculars: selected });
    navigate("/onboarding/interests");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md space-y-5 relative z-10">
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">
            Extracurriculars
          </h1>
          <p className="text-muted-foreground">
            What activities interest you in college?
          </p>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium"
              >
                {item}
                <button
                  onClick={() => remove(item)}
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
            placeholder="Search extracurriculars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>

        <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-card animate-fade-in">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              No extracurriculars match your search
            </p>
          ) : (
            filtered.map((item) => {
              const isSelected = selected.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors border-b border-border/50 last:border-0 ${
                    isSelected
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <span>{item}</span>
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
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg opacity-50" />
          <div className="w-8 h-1 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
};

export default Extracurriculars;
