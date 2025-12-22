import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { Search, Filter, Users, BookOpen, Calendar, MapPin } from "lucide-react";
import { GradientInput } from "@/components/ui/GradientInput";

const Explore = () => {
  const categories = [
    { icon: Users, label: "People", count: 0 },
    { icon: BookOpen, label: "Groups", count: 0 },
    { icon: Calendar, label: "Events", count: 0 },
    { icon: MapPin, label: "Places", count: 0 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <Logo />
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Search */}
        <div className="animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <GradientInput 
              placeholder="Search people, groups, events..." 
              className="pl-10 pr-12"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-secondary transition-colors">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-4 gap-2 animate-fade-in">
          {categories.map((category) => (
            <button
              key={category.label}
              className="gradient-border group"
            >
              <div className="bg-card rounded-lg p-3 text-center transition-colors group-hover:bg-secondary">
                <category.icon className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xs text-foreground font-medium">{category.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        <div className="text-center py-12 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">Explore Your Community</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Search for people, join groups, discover events, and find places around your school
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;
