import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import UserProfileBottomSheet from "@/components/UserProfileBottomSheet";
import { ChevronLeft, User, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { USE_SEED_DATA, generateSeedCommunityMembers, type SeedCommunityMember } from "@/data/seedData";

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'student': return 'bg-primary/20 text-primary';
    case 'teacher': return 'bg-blue-500/20 text-blue-400';
    case 'counselor': return 'bg-green-500/20 text-green-400';
    case 'staff': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-muted text-muted-foreground';
  }
};

interface MemberCardProps {
  member: SeedCommunityMember;
  schoolName: string;
  onUserClick: () => void;
  onConnect: () => void;
}

const MemberCard = ({ member, schoolName, onUserClick, onConnect }: MemberCardProps) => (
  <button 
    onClick={onUserClick}
    className="w-full gradient-border text-left"
  >
    <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 hover:bg-secondary/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{member.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(member.role)}`}>
              {member.role}
            </span>
          </div>
          {member.gradeOrPosition && (
            <p className="text-xs text-muted-foreground mt-0.5">{member.gradeOrPosition}</p>
          )}
          {member.bio && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{member.bio}</p>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onConnect();
          }}
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Connect
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toast.info("Messaging coming soon!");
          }}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </button>
);

const SchoolCommunity = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const schoolName = searchParams.get('school') || 'School';
  
  // User profile preview state
  const [selectedMember, setSelectedMember] = useState<SeedCommunityMember | null>(null);
  const [userSheetOpen, setUserSheetOpen] = useState(false);
  
  const members = useMemo(() => {
    if (!USE_SEED_DATA) return [];
    return generateSeedCommunityMembers(schoolName);
  }, [schoolName]);

  const handleConnect = (member: SeedCommunityMember) => {
    toast.success(`Connection request sent to ${member.name}!`);
  };

  const handleUserClick = (member: SeedCommunityMember) => {
    setSelectedMember(member);
    setUserSheetOpen(true);
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-secondary/50 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
        <User className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-2">No Community Members Yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Community members will appear here when available
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-6 py-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">{schoolName} Community</h1>
            <p className="text-xs text-muted-foreground">{members.length} people</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Students', 'Staff', 'Faculty'].map((filter, index) => (
            <button
              key={filter}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                index === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {members.length === 0 ? (
          renderEmptyState()
        ) : (
          members.map((member, index) => (
            <div
              key={member.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
            >
              <MemberCard 
                member={member} 
                schoolName={schoolName}
                onUserClick={() => handleUserClick(member)}
                onConnect={() => handleConnect(member)} 
              />
            </div>
          ))
        )}
      </main>

      {/* User Profile Bottom Sheet */}
      <UserProfileBottomSheet
        open={userSheetOpen}
        onOpenChange={setUserSheetOpen}
        userId={null}
        seedUser={selectedMember ? {
          id: selectedMember.id,
          name: selectedMember.name,
          role: selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1),
          badge: selectedMember.gradeOrPosition,
          school: schoolName,
          bio: selectedMember.bio,
        } : null}
      />

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default SchoolCommunity;
