import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, GraduationCap, X, Check, Loader2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSchoolSearch, School } from "@/hooks/useSchoolSearch";
import { cn } from "@/lib/utils";

interface MultiSelectSchoolsProps {
  selectedSchools: string[];
  onChange: (schools: string[]) => void;
  maxSelections?: number;
  placeholder?: string;
}

const MultiSelectSchools = ({
  selectedSchools,
  onChange,
  maxSelections = 5,
  placeholder = "Search for colleges...",
}: MultiSelectSchoolsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    searchQuery,
    setSearchQuery,
    schools,
    isLoading,
  } = useSchoolSearch({ schoolType: "university", limit: 30 });

  // Update dropdown position when open
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const inputWrapper = containerRef.current.querySelector('.gradient-border');
      if (inputWrapper) {
        const rect = inputWrapper.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }
  }, [isOpen, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if click is on the portal dropdown
        const portalDropdown = document.getElementById('multi-select-dropdown-portal');
        if (portalDropdown && portalDropdown.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const inputWrapper = containerRef.current.querySelector('.gradient-border');
        if (inputWrapper) {
          const rect = inputWrapper.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 8,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        }
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleSelect = (school: School) => {
    if (selectedSchools.includes(school.name)) {
      onChange(selectedSchools.filter((s) => s !== school.name));
    } else if (selectedSchools.length < maxSelections) {
      onChange([...selectedSchools, school.name]);
    }
    // Keep dropdown open for multi-select
  };

  const handleRemove = (schoolName: string) => {
    onChange(selectedSchools.filter((s) => s !== schoolName));
  };

  const dropdownContent = isOpen && (
    <div
      id="multi-select-dropdown-portal"
      style={{
        position: 'absolute',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
      }}
      className="bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-fade-in"
    >
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Results */}
      {!isLoading && schools.length > 0 && (
        <div className="max-h-56 overflow-y-auto">
          {schools.map((school) => {
            const isSelected = selectedSchools.includes(school.name);
            const isDisabled = !isSelected && selectedSchools.length >= maxSelections;

            return (
              <button
                key={school.id}
                onClick={() => !isDisabled && handleSelect(school)}
                disabled={isDisabled}
                className={cn(
                  "w-full px-4 py-3 flex items-start gap-3 transition-colors text-left",
                  isSelected && "bg-primary/10",
                  !isSelected && !isDisabled && "hover:bg-secondary/50",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <GraduationCap className={cn(
                  "w-5 h-5 mt-0.5 flex-shrink-0",
                  isSelected ? "text-primary" : school.is_notable ? "text-primary" : "text-muted-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-medium truncate",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
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
                {isSelected && (
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && searchQuery.length >= 2 && schools.length === 0 && (
        <div className="py-8 px-4 text-center">
          <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No colleges found.</p>
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
  );

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Selected Chips */}
      {selectedSchools.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {selectedSchools.map((school) => (
            <Badge
              key={school}
              variant="secondary"
              className="pl-3 pr-2 py-1.5 bg-primary/20 text-primary border-none flex items-center gap-2"
            >
              <GraduationCap className="w-3 h-3" />
              <span className="text-sm">{school}</span>
              <button
                onClick={() => handleRemove(school)}
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
            ref={inputRef}
            type="text"
            placeholder={placeholder}
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
        {selectedSchools.length} of {maxSelections} selected
      </p>

      {/* Portal dropdown to body */}
      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default MultiSelectSchools;
