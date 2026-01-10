import { useState, useMemo } from "react";
import { Search, X, GraduationCap, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Popular colleges/universities list
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

interface MultiSelectCollegesProps {
  selectedColleges: string[];
  onChange: (colleges: string[]) => void;
  maxSelections?: number;
}

const MultiSelectColleges = ({ selectedColleges, onChange, maxSelections = 5 }: MultiSelectCollegesProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredColleges = useMemo(() => {
    if (!searchQuery.trim()) {
      return collegesList.slice(0, 15);
    }
    return collegesList.filter((college) =>
      college.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelect = (college: string) => {
    if (selectedColleges.includes(college)) {
      onChange(selectedColleges.filter((c) => c !== college));
    } else if (selectedColleges.length < maxSelections) {
      onChange([...selectedColleges, college]);
    }
  };

  const handleRemove = (college: string) => {
    onChange(selectedColleges.filter((c) => c !== college));
  };

  return (
    <div className="space-y-3">
      {/* Selected Chips */}
      {selectedColleges.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {selectedColleges.map((college) => (
            <Badge
              key={college}
              variant="secondary"
              className="pl-3 pr-2 py-1.5 bg-primary/20 text-primary border-none flex items-center gap-2"
            >
              <GraduationCap className="w-3 h-3" />
              <span className="text-sm">{college}</span>
              <button
                onClick={() => handleRemove(college)}
                className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="gradient-border">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search colleges..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full h-12 pl-12 pr-4 rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Counter */}
      <p className="text-xs text-muted-foreground text-right">
        {selectedColleges.length} of {maxSelections} selected
      </p>

      {/* College List */}
      {isOpen && (
        <div className="space-y-2 max-h-56 overflow-y-auto animate-fade-in">
          {filteredColleges.map((college) => {
            const isSelected = selectedColleges.includes(college);
            const isDisabled = !isSelected && selectedColleges.length >= maxSelections;
            
            return (
              <button
                key={college}
                onClick={() => !isDisabled && handleSelect(college)}
                disabled={isDisabled}
                className={`w-full gradient-border group ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`bg-card/90 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between transition-all ${
                  isSelected ? 'bg-primary/10' : 'group-hover:bg-secondary/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <GraduationCap className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-left ${isSelected ? 'text-primary font-medium' : 'text-foreground'}`}>
                      {college}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>
            );
          })}
          {filteredColleges.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No colleges found. Try a different search.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectColleges;
