import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  User, 
  MessageCircle, 
  UserPlus, 
  MoreVertical,
  Flag,
  Ban,
  School,
  GraduationCap,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { USE_SEED_DATA, seedPeople, seedConversations } from "@/data/seedData";

// Find user by ID from seed data
const findUserById = (userId: string) => {
  // Check in seedPeople
  const person = seedPeople.find(p => p.id === userId);
  if (person) {
    return {
      id: person.id,
      name: person.name,
      role: person.role,
      badge: person.badge,
      school: person.school,
      bio: person.bio,
      avatarColor: person.avatarColor,
    };
  }

  // Check in seedConversations
  const conv = seedConversations.find(c => c.id === userId || c.participantName.toLowerCase().replace(/\s+/g, '-') === userId);
  if (conv) {
    return {
      id: conv.id,
      name: conv.participantName,
      role: conv.participantRole,
      badge: conv.participantBadge,
      school: conv.participantSchool,
      bio: '',
      avatarColor: 'bg-primary/20',
    };
  }

  return null;
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'Student': return 'bg-primary/20 text-primary';
    case 'Teacher': return 'bg-blue-500/20 text-blue-400';
    case 'Counselor': return 'bg-green-500/20 text-green-400';
    default: return 'bg-secondary text-muted-foreground';
  }
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  
  const user = USE_SEED_DATA && userId ? findUserById(userId) : null;

  const handleMessage = () => {
    toast.success(`Starting conversation with ${user?.name}`);
    navigate('/messages');
  };

  const handleConnect = () => {
    toast.success(`Connection request sent to ${user?.name}!`);
  };

  const handleReport = () => {
    toast.info('Report functionality coming soon');
  };

  const handleBlock = () => {
    toast.info('Block functionality coming soon');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background/80 pb-20 relative">
        <AnimatedBackground />
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-4 px-6 py-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">User Not Found</h1>
          </div>
        </header>
        <main className="relative z-10 px-6 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">This user doesn't exist or their profile is private.</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="w-4 h-4 mr-2" />
                Report User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlock} className="text-destructive focus:text-destructive">
                <Ban className="w-4 h-4 mr-2" />
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* Profile Card */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-24 h-24 rounded-full ${user.avatarColor || 'bg-primary/20'} flex items-center justify-center`}>
                <User className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
              {user.badge && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                  {user.badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.04s', animationFillMode: 'both' }}>
          <Button className="flex-1" onClick={handleMessage}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleConnect}>
            <UserPlus className="w-4 h-4 mr-2" />
            Connect
          </Button>
        </div>

        {/* School Info */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.08s', animationFillMode: 'both' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Education</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                {user.school.toLowerCase().includes('university') || user.school.toLowerCase().includes('college') 
                  ? <GraduationCap className="w-5 h-5 text-primary" />
                  : <School className="w-5 h-5 text-primary" />
                }
              </div>
              <div>
                <p className="font-medium text-foreground">{user.school}</p>
                {user.badge && (
                  <p className="text-sm text-muted-foreground">{user.badge}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.12s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
              <p className="text-foreground">{user.bio}</p>
            </div>
          </div>
        )}

        {/* Interests/Tags Placeholder */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.16s', animationFillMode: 'both' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground">Academic</span>
              <span className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground">Community</span>
              <span className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground">Learning</span>
            </div>
          </div>
        </div>
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default UserProfile;
