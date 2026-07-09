import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useOnboarding } from "@/context/OnboardingContext";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import CompleteProfilePrompt from "@/components/CompleteProfilePrompt";
import { Sparkles, TrendingUp, Users, Calendar, Check, ChevronRight, BookOpen, GraduationCap, Compass, School, Activity, MessageSquare, Heart, MessageCircle, Megaphone, ShieldCheck, BadgeCheck, X } from "lucide-react";
import { getDisplaySchoolName } from "@/lib/schoolName";
import PostCommentsModal from "@/components/PostCommentsModal";

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, isProfileComplete, hasCompletedOnboarding } = useProfileCompletion();
  const { data } = useOnboarding();
  const { status: verificationStatus, loading: verifLoading } = useVerificationStatus();
  const navigate = useNavigate();
  
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [verifyBannerDismissed, setVerifyBannerDismissed] = useState(
    () => sessionStorage.getItem('verify-banner-dismissed') === 'true'
  );

  useEffect(() => {
    if (user && !hasCompletedOnboarding && !isProfileComplete && !promptDismissed) {
      const dismissed = sessionStorage.getItem('profile-prompt-dismissed');
      if (!dismissed) setShowProfilePrompt(true);
    }
  }, [user, hasCompletedOnboarding, isProfileComplete, promptDismissed]);

  const handleSkipPrompt = () => {
    setShowProfilePrompt(false);
    setPromptDismissed(true);
    sessionStorage.setItem('profile-prompt-dismissed', 'true');
  };

  const firstName = profile?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const quickStats = [
    { icon: Users, label: "Connections", value: "0", action: () => navigate("/connections") },
    { icon: TrendingUp, label: "Profile Views", value: "0", action: () => navigate("/profile-views") },
    { icon: Calendar, label: "Events", value: "0", action: () => navigate("/events") },
  ];

  const hasAbout = !!(profile?.bio && profile.bio.trim());
  const steps = [
    { label: "Complete your profile", completed: isProfileComplete, action: () => navigate("/edit-profile") },
    { label: "Write your About section", completed: hasAbout, action: () => navigate("/edit-profile") },
    { label: "Explore your school community", completed: false, action: () => navigate("/explore") },
    { label: "Connect with classmates", completed: false, action: () => navigate("/explore") },
  ];

  const quickActions = [
    { icon: Compass, label: "Explore", description: "Find people & groups", action: () => navigate("/explore") },
    { icon: BookOpen, label: "Feed", description: "See what's new", action: () => navigate("/feed") },
    { icon: GraduationCap, label: "School", description: "Your school community", action: () => navigate("/school-info") },
  ];

  const hasProfileData = data.gradeOrYear || data.schoolName || data.interests?.length > 0 || data.extracurriculars?.length > 0;

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      {showProfilePrompt && <CompleteProfilePrompt onSkip={handleSkipPrompt} />}

      <AppHeader title="Dashboard" />

      <main className="relative z-10 px-5 py-6 space-y-6">
        {/* Student verification banner */}
        {!verifLoading && data.schoolType === 'college' && verificationStatus !== 'verified' && !verifyBannerDismissed && (
          <div className="gradient-border animate-fade-in">
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {verificationStatus === 'pending' ? 'Finish verifying your student status' : 'Verify your student status'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {verificationStatus === 'pending'
                    ? "We sent you a code — enter it to earn your verified badge."
                    : "Confirm you're a current student with your school email to earn a verified badge."}
                </p>
                <button
                  onClick={() => navigate('/verify-student')}
                  className="text-xs font-semibold text-primary hover:underline mt-1"
                >
                  {verificationStatus === 'pending' ? 'Enter code →' : 'Verify now →'}
                </button>
              </div>
              <button
                onClick={() => { sessionStorage.setItem('verify-banner-dismissed', 'true'); setVerifyBannerDismissed(true); }}
                className="p-1 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!verifLoading && data.schoolType === 'college' && verificationStatus === 'verified' && (
          <div className="gradient-border animate-fade-in">
            <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />
              <p className="text-sm text-foreground flex-1">You're a verified student ✨</p>
            </div>
          </div>
        )}

        {/* Welcome */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, <span className="gradient-text">{firstName}</span>!
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening in your community</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
          {quickActions.map((action) => (
            <button key={action.label} onClick={action.action} className="gradient-border group">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 text-center transition-colors group-hover:bg-secondary/50">
                <action.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          {quickStats.map((stat) => (
            <button
              key={stat.label}
              onClick={stat.action}
              className="gradient-border group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
              aria-label={`Open ${stat.label}`}
            >
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 text-center transition-all duration-200 group-hover:bg-secondary/50 group-hover:-translate-y-0.5">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Your Profile Overview */}
        {hasProfileData && (
          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Your Profile Overview
                </h3>
                <button onClick={() => navigate('/profile')} className="text-xs text-primary hover:underline">View Profile</button>
              </div>

              {/* Grade & School row */}
              {(data.gradeOrYear || data.schoolName) && (
                <div className="flex flex-wrap gap-3">
                  {data.gradeOrYear && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">{data.gradeOrYear}</span>
                    </div>
                  )}
                  {data.schoolName && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                      <School className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground truncate max-w-[200px]">{getDisplaySchoolName(data.schoolName, data.schoolType)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Intended Majors */}
              {data.interests?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Intended Majors
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.interests.slice(0, 5).map((i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{i}</span>
                    ))}
                    {data.interests.length > 5 && (
                      <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs">+{data.interests.length - 5}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Extracurriculars */}
              {data.extracurriculars?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> Extracurriculars
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.extracurriculars.slice(0, 5).map((e) => (
                      <span key={e} className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">{e}</span>
                    ))}
                    {data.extracurriculars.length > 5 && (
                      <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs">+{data.extracurriculars.length - 5}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Getting Started */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-foreground">Getting Started</h3>
            </div>
            <div className="grid gap-3">
              {steps.map((step, index) => (
                <button key={index} onClick={step.action}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 backdrop-blur-sm hover:bg-secondary/50 transition-colors group text-left w-full">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed ? 'bg-accent/20' : 'bg-primary/20'}`}>
                    {step.completed ? <Check className="w-4 h-4 text-accent" /> : <span className="text-sm font-bold text-primary">{index + 1}</span>}
                  </div>
                  <span className={`text-sm flex-1 ${step.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{step.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== FEED SECTION — appears below existing dashboard blocks ===== */}
        <DashboardFeed onExplore={() => navigate('/explore')} onOpenComments={setOpenCommentsFor} />
      </main>

      <PostCommentsModal
        open={!!openCommentsFor}
        postId={openCommentsFor}
        onOpenChange={(o) => !o && setOpenCommentsFor(null)}
      />
      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

/* -------------------------------------------------------------------------
 * DashboardFeed
 * An Instagram-style social feed that lives beneath the existing dashboard
 * blocks. Includes upcoming events, community posts, and a slot designed
 * to host sponsored/ad content in the future.
 * ------------------------------------------------------------------------*/
const SAMPLE_EVENTS = [
  { id: 'e1', title: 'Welcome Week Mixer', when: 'Fri · 7:00 PM', where: 'Student Union', tag: 'Networking' },
  { id: 'e2', title: 'CS Career Fair', when: 'Tue · 11:00 AM', where: 'Tech Quad', tag: 'Academic' },
  { id: 'e3', title: 'Volunteer Day at the Park', when: 'Sat · 9:00 AM', where: 'Central Park', tag: 'Service' },
];

const SAMPLE_POSTS = [
  {
    id: 'p1',
    author: 'School Community',
    handle: 'community',
    initials: 'SC',
    timeAgo: '2h',
    body: "Welcome new members! Drop a 👋 in the thread and tell us what you're hoping to find here.",
    likes: 24,
    comments: 8,
  },
  {
    id: 'p2',
    author: 'Pre-Med Society',
    handle: 'premed',
    initials: 'PM',
    timeAgo: '5h',
    body: 'MCAT prep group starting next week — every Tuesday in the library. Reply if you want a seat.',
    likes: 42,
    comments: 13,
  },
  {
    id: 'p3',
    author: 'Robotics Club',
    handle: 'robotics',
    initials: 'RC',
    timeAgo: '1d',
    body: 'We placed 3rd at regionals 🤖 — huge thanks to everyone who showed up to support.',
    likes: 118,
    comments: 27,
  },
];

const DashboardFeed = ({ onExplore, onOpenComments }: { onExplore: () => void; onOpenComments: (postId: string) => void }) => {
  return (
    <section className="space-y-5 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
      <div className="flex items-end justify-between pt-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Your Feed</h3>
          <p className="text-xs text-muted-foreground">Latest from your school community</p>
        </div>
        <button onClick={onExplore} className="text-xs text-primary hover:underline">See all</button>
      </div>

      {/* Upcoming Events — horizontal carousel */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Upcoming events
        </p>
        <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-2 snap-x snap-mandatory scrollbar-hide">
          {SAMPLE_EVENTS.map((ev, i) => (
            <div
              key={ev.id}
              className="gradient-border flex-shrink-0 w-64 snap-start animate-fade-in"
              style={{ animationDelay: `${0.35 + i * 0.05}s`, animationFillMode: 'both' }}
            >
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 h-full flex flex-col gap-2 transition-transform hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    {ev.tag}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{ev.when}</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground leading-tight">{ev.title}</h4>
                <p className="text-xs text-muted-foreground">{ev.where}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {SAMPLE_POSTS.map((post, i) => (
          <article
            key={post.id}
            className="gradient-border animate-fade-in"
            style={{ animationDelay: `${0.4 + i * 0.05}s`, animationFillMode: 'both' }}
          >
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 space-y-3 transition-colors hover:bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {post.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{post.author}</p>
                  <p className="text-[11px] text-muted-foreground">@{post.handle} · {post.timeAgo}</p>
                </div>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{post.body}</p>
              <div className="flex items-center gap-4 pt-1 text-muted-foreground">
                <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
                  <Heart className="w-4 h-4" /> {post.likes}
                </button>
                <button
                  onClick={() => onOpenComments(`dashboard-${post.id}`)}
                  className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> {post.comments}
                </button>
              </div>
            </div>
          </article>
        ))}

        {/* Sponsored slot — structural placeholder, intentionally generic.
            Ad delivery is not implemented yet; this reserves the layout. */}
        <article
          className="gradient-border animate-fade-in"
          style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
          aria-label="Sponsored slot"
        >
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3 border border-dashed border-border/60">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sponsored</p>
              <p className="text-sm text-foreground/80">School & partner highlights will appear here.</p>
            </div>
          </div>
        </article>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-2">
        You're all caught up ✨
      </div>
    </section>
  );
};

export default Dashboard;
