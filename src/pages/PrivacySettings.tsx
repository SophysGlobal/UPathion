import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  GraduationCap, 
  AtSign, 
  MessageSquare, 
  UserPlus, 
  Wifi,
  Sparkles,
  BarChart3,
  Ban,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

type ProfileVisibility = 'public' | 'school-only' | 'private';
type MessagePermission = 'everyone' | 'school' | 'none';

const PrivacySettings = () => {
  const navigate = useNavigate();
  
  // Profile Visibility
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('school-only');
  const [showSchoolOnProfile, setShowSchoolOnProfile] = useState(true);
  const [allowFindByUsername, setAllowFindByUsername] = useState(true);
  
  // Messaging & Interactions
  const [whoCanMessage, setWhoCanMessage] = useState<MessagePermission>('school');
  const [allowConnectionRequests, setAllowConnectionRequests] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  
  // Data & Personalization
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState(true);
  const [analyticsSharing, setAnalyticsSharing] = useState(false);

  const visibilityOptions: { key: ProfileVisibility; label: string; description: string }[] = [
    { key: 'public', label: 'Public', description: 'Anyone can see your profile' },
    { key: 'school-only', label: 'School Only', description: 'Only people at your school' },
    { key: 'private', label: 'Private', description: 'Only you can see your profile' },
  ];

  const messageOptions: { key: MessagePermission; label: string }[] = [
    { key: 'everyone', label: 'Everyone' },
    { key: 'school', label: 'People at my school' },
    { key: 'none', label: 'No one' },
  ];

  const handleBlockedUsers = () => {
    toast.info("Blocked users list coming soon");
  };

  const handleReportProblem = () => {
    toast.info("Report form coming soon");
  };

  const sections = [
    {
      title: "Profile Visibility",
      items: [
        {
          icon: Eye,
          label: "Who can see my profile",
          description: visibilityOptions.find(o => o.key === profileVisibility)?.description,
          action: (
            <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
              {visibilityOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setProfileVisibility(option.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    profileVisibility === option.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ),
        },
        {
          icon: GraduationCap,
          label: "Show my school on my profile",
          description: "Display your school name publicly",
          action: <Switch checked={showSchoolOnProfile} onCheckedChange={setShowSchoolOnProfile} />,
        },
        {
          icon: AtSign,
          label: "Allow others to find me by username",
          description: "Let people search for your profile",
          action: <Switch checked={allowFindByUsername} onCheckedChange={setAllowFindByUsername} />,
        },
      ],
    },
    {
      title: "Messaging & Interactions",
      items: [
        {
          icon: MessageSquare,
          label: "Who can message me",
          description: messageOptions.find(o => o.key === whoCanMessage)?.label,
          action: (
            <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
              {messageOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setWhoCanMessage(option.key)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    whoCanMessage === option.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ),
        },
        {
          icon: UserPlus,
          label: "Allow connection requests",
          description: "Let others send you friend requests",
          action: <Switch checked={allowConnectionRequests} onCheckedChange={setAllowConnectionRequests} />,
        },
        {
          icon: Wifi,
          label: "Show online status",
          description: "Let others see when you're active",
          action: <Switch checked={showOnlineStatus} onCheckedChange={setShowOnlineStatus} />,
        },
      ],
    },
    {
      title: "Data & Personalization",
      items: [
        {
          icon: Sparkles,
          label: "Personalized recommendations",
          description: "Tailor feed and explore to your interests",
          action: <Switch checked={personalizedRecommendations} onCheckedChange={setPersonalizedRecommendations} />,
        },
        {
          icon: BarChart3,
          label: "Analytics sharing",
          description: "Help us improve with anonymous usage data",
          action: <Switch checked={analyticsSharing} onCheckedChange={setAnalyticsSharing} />,
        },
      ],
    },
    {
      title: "Safety",
      items: [
        {
          icon: Ban,
          label: "Blocked users",
          description: "Manage your blocked users list",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
          onClick: handleBlockedUsers,
        },
        {
          icon: AlertTriangle,
          label: "Report a problem",
          description: "Let us know about an issue",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
          onClick: handleReportProblem,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-6 py-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Privacy Settings</h1>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {sections.map((section, sectionIndex) => (
          <div 
            key={section.title} 
            className="animate-fade-in" 
            style={{ animationDelay: `${sectionIndex * 0.04}s`, animationFillMode: 'both' }}
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map((item) => {
                const row = (
                  <div
                    className={`bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between gap-4 transition-all ${
                      item.onClick ? "group-hover:bg-secondary/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20 flex-shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {item.action}
                    </div>
                  </div>
                );

                return item.onClick ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="w-full gradient-border group"
                  >
                    {row}
                  </button>
                ) : (
                  <div key={item.label} className="w-full gradient-border">
                    {row}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default PrivacySettings;
