import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import AnimatedBackground from "@/components/AnimatedBackground";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronLeft,
  GraduationCap,
  School,
  MapPin,
  ExternalLink,
  Users,
  Calendar,
  Award,
  BookOpen,
  TrendingUp,
  Building2,
  DollarSign,
  Percent,
  Info,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface SchoolData {
  id: string;
  name: string;
  type: "high_school" | "university";
  city: string | null;
  state: string | null;
  country: string;
  is_notable: boolean;
}

interface SchoolProfile {
  id: string;
  school_id: string;
  tagline: string | null;
  about_text: string | null;
  website_url: string | null;
  stats: Record<string, number | string | null>;
  chips: string[];
  founded_year: number | null;
  enrollment: number | null;
  data_source: string | null;
  // Enrichment fields
  acceptance_rate: number | null;
  student_faculty_ratio: string | null;
  graduation_rate: number | null;
  programs_count: number | null;
  tuition_in_state: number | null;
  tuition_out_of_state: number | null;
  ranking: string | null;
  ranking_source: string | null;
  carnegie_classification: string | null;
  ownership_type: string | null;
  locale: string | null;
  source_name: string | null;
  source_url: string | null;
  enrichment_status: string | null;
  about_source: string | null;
}

// Format large numbers with commas
const formatNumber = (num: number | null): string | null => {
  if (num === null || num === undefined) return null;
  return num.toLocaleString();
};

// Format currency
const formatCurrency = (num: number | null): string | null => {
  if (num === null || num === undefined) return null;
  return `$${num.toLocaleString()}`;
};

// Format percentage
const formatPercentage = (num: number | null): string | null => {
  if (num === null || num === undefined) return null;
  return `${num}%`;
};

// Stat card component
const StatCard = ({ 
  icon: Icon, 
  label, 
  value,
  subValue,
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number | null;
  subValue?: string | null;
}) => (
  <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-xl font-semibold text-foreground">
      {value !== null && value !== undefined ? value : "N/A"}
    </p>
    {subValue && (
      <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
    )}
  </div>
);

// Loading skeleton component
const ProfileSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header skeleton */}
    <div className="gradient-border">
      <div className="bg-card/90 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="w-16 h-16 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
    </div>

    {/* Stats skeleton */}
    <div>
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card/80 rounded-xl p-4 border border-border/50">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>

    {/* Chips skeleton */}
    <div>
      <Skeleton className="h-4 w-48 mb-3" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    </div>

    {/* About skeleton */}
    <div>
      <Skeleton className="h-4 w-24 mb-3" />
      <div className="gradient-border">
        <div className="bg-card/90 rounded-xl p-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  </div>
);

const SchoolProfilePage = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAdminStatus();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enrichmentPending, setEnrichmentPending] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!schoolId) {
        setError("School ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase.functions.invoke(
          "get-school-profile",
          {
            body: { schoolId },
          }
        );

        if (fetchError) throw fetchError;

        if (data?.school && data?.profile) {
          setSchool(data.school);
          setProfile(data.profile);
          
          // Check if enrichment is pending
          if (data.enrichmentPending || data.profile?.enrichment_status === 'in_progress' || data.profile?.enrichment_status === 'pending') {
            setEnrichmentPending(true);
          } else {
            setEnrichmentPending(false);
          }
        } else if (data?.error) {
          setError(data.error);
        }
      } catch (err) {
        console.error("Error fetching school profile:", err);
        setError("Failed to load school profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [schoolId]);

  // Poll for enrichment completion if pending
  useEffect(() => {
    if (!enrichmentPending || !schoolId) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('school_profiles')
          .select('*')
          .eq('school_id', schoolId)
          .single();

        if (data && data.enrichment_status === 'enriched') {
          setProfile(data);
          setEnrichmentPending(false);
          toast.success('School profile data updated!');
        } else if (data && data.enrichment_status === 'failed') {
          setEnrichmentPending(false);
          console.error('Enrichment failed:', data.enrichment_error);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 5000); // Poll every 5 seconds

    // Clear interval after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setEnrichmentPending(false);
    }, 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [enrichmentPending, schoolId]);

  // Handle manual refresh (admin only)
  const handleRefresh = async () => {
    if (!schoolId) return;

    setIsRefreshing(true);
    try {
      const { data, error: refreshError } = await supabase.functions.invoke(
        "enrich-school-profile",
        {
          body: { schoolId, forceRefresh: true },
        }
      );

      if (refreshError) throw refreshError;

      if (data?.profile) {
        setProfile(data.profile);
        toast.success('Profile refreshed successfully!');
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
      toast.error('Failed to refresh profile');
    } finally {
      setIsRefreshing(false);
    }
  };

  const isUniversity = school?.type === "university";
  const SchoolIcon = isUniversity ? GraduationCap : School;
  const location = [school?.city, school?.state, school?.country !== "US" ? school?.country : null]
    .filter(Boolean)
    .join(", ");

  // Define stats based on school type - using real enriched fields
  const statsConfig = isUniversity
    ? [
        { icon: Users, label: "Enrollment", value: formatNumber(profile?.enrollment ?? null) },
        { icon: TrendingUp, label: "Acceptance Rate", value: formatPercentage(profile?.acceptance_rate ?? null) },
        { icon: Award, label: "Ranking", value: profile?.ranking ?? null, subValue: profile?.ranking_source ?? null },
        { icon: BookOpen, label: "Programs", value: formatNumber(profile?.programs_count ?? null) },
        { icon: Building2, label: "Student:Faculty", value: profile?.student_faculty_ratio ?? null },
        { icon: Percent, label: "Graduation Rate", value: formatPercentage(profile?.graduation_rate ?? null) },
        { icon: DollarSign, label: "Tuition (In-State)", value: formatCurrency(profile?.tuition_in_state ?? null) },
        { icon: DollarSign, label: "Tuition (Out-of-State)", value: formatCurrency(profile?.tuition_out_of_state ?? null) },
      ]
    : [
        { icon: Users, label: "Students", value: formatNumber(profile?.enrollment ?? null) },
        { icon: Calendar, label: "Founded", value: profile?.founded_year ?? null },
        { icon: Percent, label: "Graduation Rate", value: formatPercentage(profile?.graduation_rate ?? null) },
        { icon: Building2, label: "Student:Teacher", value: profile?.student_faculty_ratio ?? null },
      ];

  return (
    <div className="min-h-screen bg-background/80 pb-24 relative">
      <AnimatedBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground truncate max-w-[200px]">
              {isLoading ? "Loading..." : school?.name || "School Profile"}
            </h1>
          </div>
          
          {/* Admin refresh button and enrichment status */}
          <div className="flex items-center gap-2">
            {enrichmentPending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
            {profile?.enrichment_status === 'failed' && isAdmin && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-full">
                <AlertCircle className="w-3 h-3" />
                <span>Enrichment failed</span>
              </div>
            )}
            {isAdmin && school?.type === 'university' && school?.country === 'US' && !isLoading && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 space-y-6">
        {isLoading ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <School className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">School Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <div className="gradient-border">
              <div className="bg-card/90 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    school?.is_notable 
                      ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30" 
                      : "bg-secondary"
                  }`}>
                    <SchoolIcon className={`w-8 h-8 ${school?.is_notable ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground mb-1 leading-tight">
                      {school?.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isUniversity 
                          ? "bg-primary/20 text-primary" 
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                        {isUniversity ? "University" : "High School"}
                      </span>
                      {school?.is_notable && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600">
                          Notable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location */}
                {location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{location}</span>
                  </div>
                )}

                {/* Tagline */}
                {profile?.tagline && (
                  <p className="text-foreground/80 italic border-l-2 border-primary/50 pl-3">
                    "{profile.tagline}"
                  </p>
                )}
              </div>
            </div>

            {/* Key Statistics */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Key Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {statsConfig.map(({ icon, label, value, subValue }) => (
                  <StatCard key={label} icon={icon} label={label} value={value ?? null} subValue={subValue} />
                ))}
              </div>
            </div>

            {/* Schools & Departments / Programs */}
            {profile?.chips && profile.chips.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  {isUniversity ? "Schools & Departments" : "Programs & Activities"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.chips.map((chip) => (
                    <span
                      key={chip}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-secondary/80 text-secondary-foreground border border-border/50 hover:bg-secondary transition-colors"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Visit Website */}
            <div className="gradient-border">
              <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Visit Website</p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.website_url || "Website not available"}
                      </p>
                    </div>
                  </div>
                  {profile?.website_url ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(profile.website_url!, "_blank")}
                    >
                      Open
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      N/A
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* About Section */}
            {profile?.about_text && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  About
                </h3>
                <div className="gradient-border">
                  <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4">
                    <div className="prose prose-sm max-w-none">
                      {profile.about_text.split("\n\n").map((paragraph, i) => (
                        <p key={i} className="text-foreground/90 mb-3 last:mb-0 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Source Attribution */}
            {profile?.source_name && (
              <div className="pt-2 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-3 h-3" />
                  <span>
                    Data from <span className="font-medium">{profile.source_name}</span>
                    {profile.enrichment_status === 'enriched' && ' • Verified'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default SchoolProfilePage;
