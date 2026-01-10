import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { Search, GraduationCap, ChevronRight } from "lucide-react";

// Popular colleges/universities list for demo
const collegesList = [
  "Harvard University",
  "Stanford University",
  "Massachusetts Institute of Technology",
  "Yale University",
  "Princeton University",
  "Columbia University",
  "University of Chicago",
  "Duke University",
  "Northwestern University",
  "Brown University",
  "Cornell University",
  "Dartmouth College",
  "University of Pennsylvania",
  "California Institute of Technology",
  "Johns Hopkins University",
  "Rice University",
  "Vanderbilt University",
  "University of Notre Dame",
  "Washington University in St. Louis",
  "Georgetown University",
  "Emory University",
  "University of California, Berkeley",
  "University of California, Los Angeles",
  "University of Southern California",
  "Carnegie Mellon University",
  "University of Michigan",
  "New York University",
  "Boston University",
  "Boston College",
  "University of Virginia",
  "University of North Carolina at Chapel Hill",
  "Georgia Institute of Technology",
  "University of Texas at Austin",
  "University of Florida",
  "University of Wisconsin-Madison",
  "Ohio State University",
  "Penn State University",
  "Purdue University",
  "Indiana University",
  "University of Illinois Urbana-Champaign",
  "Northeastern University",
  "University of Massachusetts Amherst",
  "Tufts University",
  "Wake Forest University",
  "Tulane University",
  "University of Miami",
  "Syracuse University",
  "Rutgers University",
  "University of Maryland",
  "Texas A&M University",
];

const AspirationalSchool = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(data.aspirationalSchool || "");

  const filteredColleges = useMemo(() => {
    if (!searchQuery.trim()) {
      return collegesList.slice(0, 10); // Show top 10 by default
    }
    return collegesList.filter((college) =>
      college.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleContinue = () => {
    updateData({ aspirationalSchool: selectedSchool });
    navigate("/onboarding/school-confirm");
  };

  const handleSkip = () => {
    updateData({ aspirationalSchool: "" });
    navigate("/onboarding/school-confirm");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        {/* Title */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Where do you want to go after high school?</h1>
          <p className="text-muted-foreground">Select your dream college or university</p>
        </div>

        {/* Search Input */}
        <div className="animate-fade-in">
          <div className="gradient-border">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search colleges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Selected School Display */}
        {selectedSchool && (
          <div className="animate-fade-in">
            <div className="gradient-border">
              <div className="bg-primary/10 rounded-lg p-4 flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-primary" />
                <span className="font-medium text-foreground flex-1">{selectedSchool}</span>
                <button 
                  onClick={() => setSelectedSchool("")}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        )}

        {/* College List */}
        {!selectedSchool && (
          <div className="space-y-2 max-h-64 overflow-y-auto animate-fade-in">
            {filteredColleges.map((college) => (
              <button
                key={college}
                onClick={() => setSelectedSchool(college)}
                className="w-full gradient-border group"
              >
                <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between transition-all group-hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <span className="text-foreground text-left">{college}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            ))}
            {filteredColleges.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No colleges found. Try a different search.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 animate-fade-in pt-2">
          <GradientButton 
            variant="filled" 
            className="w-full"
            onClick={handleContinue}
            disabled={!selectedSchool}
          >
            Continue
          </GradientButton>
          
          <button
            onClick={handleSkip}
            className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Skip for now
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 pt-4 animate-fade-in">
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default AspirationalSchool;
