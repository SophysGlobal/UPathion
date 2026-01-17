import { useState, useRef, useEffect } from "react";
import { Search, GraduationCap, School, Loader2, X, MapPin, ChevronDown } from "lucide-react";
import { useSchoolSearch, School as SchoolType } from "@/hooks/useSchoolSearch";
import { cn } from "@/lib/utils";

interface SchoolSearchDropdownProps {
  value: string;
  onChange: (school: string) => void;
  schoolType: "high_school" | "university";
  placeholder?: string;
  className?: string;
}

const SchoolSearchDropdown = ({
  value,
  onChange,
  schoolType,
  placeholder = "Search for your school...",
  className,
}: SchoolSearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    searchQuery,
    setSearchQuery,
    schools,
    isLoading,
  } = useSchoolSearch({ schoolType, limit: 30 });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (school: SchoolType) => {
    onChange(school.name);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleInputClick = () => {
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const SchoolIcon = schoolType === "high_school" ? School : GraduationCap;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Selected value display / Search input */}
      <div className="gradient-border">
        <div
          className="relative cursor-pointer"
          onClick={handleInputClick}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          
          {!isOpen && value ? (
            <div className="flex items-center justify-between w-full h-12 pl-12 pr-10 rounded-lg bg-card">
              <span className="text-foreground truncate">{value}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 hover:bg-secondary/50 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              placeholder={value || placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="w-full h-12 pl-12 pr-10 rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          )}
          
          <ChevronDown className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* Results */}
          {!isLoading && schools.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              {schools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSelect(school)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left"
                >
                  <SchoolIcon className={cn(
                    "w-5 h-5 mt-0.5 flex-shrink-0",
                    school.is_notable ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {school.name}
                    </div>
                    {(school.city || school.state) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {[school.city, school.state, school.country !== "US" && school.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && searchQuery.length >= 2 && schools.length === 0 && (
            <div className="py-8 px-4 text-center">
              <SchoolIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No schools found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search term.
              </p>
            </div>
          )}

          {/* Initial state */}
          {!isLoading && searchQuery.length < 2 && (
            <div className="py-6 px-4 text-center">
              <p className="text-muted-foreground">
                Type at least 2 characters to search
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchoolSearchDropdown;
