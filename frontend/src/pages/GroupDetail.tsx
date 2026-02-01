import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Users, BookOpen, MapPin } from "lucide-react";
import { USE_SEED_DATA, seedGroups } from "@/data/seedData";

const GroupDetail = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  
  const group = USE_SEED_DATA 
    ? seedGroups.find(g => g.id === groupId) 
    : null;

  if (!group) {
    return (
      <div className="min-h-screen bg-background/80 pb-20 relative">
        <AnimatedBackground />
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-4 px-6 py-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Group Not Found</h1>
          </div>
        </header>
        <main className="relative z-10 px-6 py-12 text-center">
          <p className="text-muted-foreground">This group doesn't exist.</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground truncate">{group.name}</h1>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* Group Header */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{group.name}</h2>
            <span className="px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs">
              {group.category}
            </span>
            <p className="text-sm text-primary mt-3">{group.school}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.04s', animationFillMode: 'both' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Members</p>
              <p className="font-semibold text-foreground">{group.memberCount}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.08s', animationFillMode: 'both' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">About</h3>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.12s', animationFillMode: 'both' }}>
          <Button className="w-full py-6">Join Group</Button>
        </div>
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default GroupDetail;
