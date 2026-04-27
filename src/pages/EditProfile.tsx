import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SchoolSearchDropdown from "@/components/SchoolSearchDropdown";
import MultiSelectSchools from "@/components/MultiSelectSchools";
import {
  ChevronLeft,
  Mail,
  Lock,
  Camera,
  X,
  Trash2,
  GraduationCap,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Validation helpers
const validateUsername = (username: string): string | null => {
  if (!username) return null;
  if (username.length < 3) return "Username must be at least 3 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Only letters, numbers, and underscores";
  return null;
};

const validateUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlToTest = url.startsWith('http') ? url : `https://${url}`;
    new URL(urlToTest);
    return null;
  } catch {
    return "Invalid URL format";
  }
};

type Visibility = "anyone" | "connections" | "none";

interface FormErrors {
  username?: string;
  linkedin?: string;
  website?: string;
}

// Visibility selector component
const VisibilityControl = ({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) => {
  const options: { label: string; value: Visibility }[] = [
    { label: "Anyone", value: "anyone" },
    { label: "Connections", value: "connections" },
    { label: "No One", value: "none" },
  ];
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
            value === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// Bio section with AI generation
const BioSection = ({
  bio,
  onChange,
  isPremium,
}: {
  bio: string;
  onChange: (v: string) => void;
  isPremium: boolean;
}) => {
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [generating, setGenerating] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter some keywords or interests");
      return;
    }
    setGenerating(true);
    // Simulate AI generation (would call edge function in production)
    setTimeout(() => {
      const generated = `Passionate about ${aiPrompt.trim()}. Always looking for new opportunities to learn and grow in my academic journey. Excited to connect with like-minded peers and make the most of the college experience.`;
      setAiResult(generated);
      setGenerating(false);
    }, 1500);
  };

  const handleApply = () => {
    onChange(aiResult);
    setAiModalOpen(false);
    setAiPrompt("");
    setAiResult("");
  };

  const handleCloseAttempt = () => {
    if (aiPrompt || aiResult) {
      setConfirmLeave(true);
    } else {
      setAiModalOpen(false);
    }
  };

  return (
    <div className="gradient-border animate-fade-in">
      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">About Me</h2>
            <p className="text-xs text-muted-foreground">Write a short bio about yourself</p>
          </div>
          {isPremium && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAiModalOpen(true)}
              className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate with AI
            </Button>
          )}
        </div>
        <textarea
          value={bio}
          onChange={(e) => onChange(e.target.value)}
          maxLength={300}
          placeholder="Tell others about yourself, your goals, and interests..."
          className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/300</p>

        {/* AI Generation Modal */}
        <Dialog open={aiModalOpen} onOpenChange={handleCloseAttempt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Generate Bio with AI
              </DialogTitle>
              <DialogDescription>
                Enter keywords about your interests, goals, and personality
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., computer science, robotics, leadership, traveling, creative writing"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={3}
              />
              <Button
                onClick={handleGenerate}
                disabled={generating || !aiPrompt.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {generating ? "Generating..." : "Generate Bio"}
              </Button>
              {aiResult && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Preview:</p>
                  <div className="bg-secondary/50 border border-border rounded-lg p-3 text-sm text-foreground">
                    {aiResult}
                  </div>
                  <Button onClick={handleApply} className="w-full" variant="outline">
                    Use This Bio
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm leave dialog */}
        <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard progress?</AlertDialogTitle>
              <AlertDialogDescription>
                This will discard your progress. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setAiModalOpen(false);
                  setAiPrompt("");
                  setAiResult("");
                  setConfirmLeave(false);
                }}
              >
                Leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// 3-column profile field row
const ProfileFieldRow = ({
  label,
  visibility,
  onVisibilityChange,
  children,
}: {
  label: string;
  visibility: Visibility;
  onVisibilityChange: (v: Visibility) => void;
  children: React.ReactNode;
}) => (
  <div className="grid grid-cols-[110px_1fr] md:grid-cols-[140px_auto_1fr] gap-3 items-start py-3 border-b border-border/30 last:border-b-0 min-w-0">
    <div className="flex items-center min-h-[36px] min-w-0">
      <span className="text-sm font-medium text-foreground truncate">{label}</span>
    </div>
    <div className="hidden md:flex items-center min-h-[36px] min-w-0">
      <VisibilityControl value={visibility} onChange={onVisibilityChange} />
    </div>
    <div className="min-h-[36px] min-w-0 overflow-hidden">{children}</div>
    <div className="md:hidden col-span-2 -mt-1">
      <VisibilityControl value={visibility} onChange={onVisibilityChange} />
    </div>
  </div>
);

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading, refetch } = useProfileCompletion();
  const initializedRef = useRef(false);
  const [viewMode, setViewMode] = useState<"edit" | "public">("edit");

  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    bio: "",
    pronouns: "",
    schoolType: "" as 'high_school' | 'college' | 'other' | '',
    schoolName: "",
    gradeOrYear: "",
    major: "",
    aspirationalSchool: "",
    interests: [] as string[],
    extracurriculars: [] as string[],
    instagram: "",
    tiktok: "",
    linkedin: "",
    website: "",
  });

  const [visibility, setVisibility] = useState<Record<string, Visibility>>({
    school: "anyone",
    grade: "anyone",
    major: "anyone",
    interests: "anyone",
    extracurriculars: "anyone",
    instagram: "anyone",
    tiktok: "anyone",
    linkedin: "anyone",
    website: "anyone",
  });

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      setFormData({
        displayName: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        pronouns: "",
        schoolType: (profile.school_type as any) || "",
        schoolName: profile.school_name || "",
        gradeOrYear: profile.grade_or_year || "",
        major: profile.major || "",
        aspirationalSchool: profile.aspirational_school || "",
        interests: profile.interests || [],
        extracurriculars: profile.extracurriculars || [],
        instagram: "",
        tiktok: "",
        linkedin: "",
        website: "",
      });
      setProfilePhoto(profile.avatar_url || null);
    }
  }, [profile]);

  const isHighSchool = formData.schoolType === 'high_school';

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    if (field === 'username') {
      const error = validateUsername(value);
      if (error) newErrors.username = error; else delete newErrors.username;
    }
    if (field === 'linkedin') {
      const error = validateUrl(value);
      if (error) newErrors.linkedin = error; else delete newErrors.linkedin;
    }
    if (field === 'website') {
      const error = validateUrl(value);
      if (error) newErrors.website = error; else delete newErrors.website;
    }
    setErrors(newErrors);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (typeof value === 'string') validateField(field, value);
  };

  const handleVisChange = (field: string, v: Visibility) => {
    setVisibility((prev) => ({ ...prev, [field]: v }));
    setHasChanges(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setProfilePhoto(reader.result as string); setHasChanges(true); };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!hasChanges || !user?.id) return;
    if (Object.keys(errors).length > 0) { toast.error("Please fix errors before saving"); return; }

    setIsSaving(true);
    try {
      const updates: Record<string, any> = {
        display_name: formData.displayName || null,
        username: formData.username || null,
        bio: formData.bio || null,
        school_type: formData.schoolType || null,
        school_name: formData.schoolName || null,
        grade_or_year: formData.gradeOrYear || null,
        major: formData.major || null,
        aspirational_school: isHighSchool ? (formData.aspirationalSchool || null) : null,
        is_high_school: isHighSchool,
        interests: formData.interests || [],
        extracurriculars: formData.extracurriculars || [],
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;

      await refetch();
      toast.success("Profile updated successfully");
      setHasChanges(false);
      navigate("/profile");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        setErrors(prev => ({ ...prev, username: "Username already taken" }));
        toast.error("That username is already taken");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isPremium = profile?.is_premium ?? false;

  // Public view preview
  const PublicPreview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="gradient-border">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">{formData.displayName || "Your Name"}</h2>
          {formData.username && <p className="text-sm text-primary">@{formData.username}</p>}
          {formData.bio && <p className="text-sm text-muted-foreground mt-2">{formData.bio}</p>}

          <div className="mt-4 space-y-2 text-left">
            {visibility.school !== "none" && formData.schoolName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">School:</span>
                <span className="text-foreground">{formData.schoolName}</span>
              </div>
            )}
            {visibility.grade !== "none" && formData.gradeOrYear && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Grade:</span>
                <span className="text-foreground">{formData.gradeOrYear}</span>
              </div>
            )}
            {visibility.interests !== "none" && formData.interests.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Intended Majors</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.interests.map((i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{i}</span>
                  ))}
                </div>
              </div>
            )}
            {visibility.extracurriculars !== "none" && formData.extracurriculars.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Extracurriculars</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.extracurriculars.map((e) => (
                    <span key={e} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">{e}</span>
                  ))}
                </div>
              </div>
            )}
            {visibility.instagram !== "none" && formData.instagram && (
              <div className="text-sm"><span className="text-muted-foreground">Instagram:</span> <span className="text-foreground">{formData.instagram}</span></div>
            )}
            {visibility.linkedin !== "none" && formData.linkedin && (
              <div className="text-sm"><span className="text-muted-foreground">LinkedIn:</span> <span className="text-foreground">{formData.linkedin}</span></div>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Fields set to "No One" are hidden. "Connections" fields are shown only to your connections.
      </p>
    </div>
  );

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background/80 pb-20 relative">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-4 px-6 py-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Edit Profile</h1>
          </div>
        </header>
        <main className="relative z-10 px-6 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Edit Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <button
              onClick={() => setViewMode(viewMode === "edit" ? "public" : "edit")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              {viewMode === "edit" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {viewMode === "edit" ? "Preview" : "Edit"}
            </button>
            {hasChanges && viewMode === "edit" && (
              <Button size="sm" onClick={handleSaveProfile} disabled={isSaving || Object.keys(errors).length > 0} className="bg-primary hover:bg-primary/90">
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 md:px-6 py-5 space-y-5 max-w-3xl mx-auto">
        {viewMode === "public" ? (
          <PublicPreview />
        ) : (
          <>
            {/* Photo section */}
            <div className="gradient-border animate-fade-in">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5">
                <div className="flex items-center gap-4">
                  {profilePhoto ? (
                    <div className="relative">
                      <img src={profilePhoto} alt="Profile" className="w-20 h-20 rounded-xl object-cover" />
                      <button onClick={() => { setProfilePhoto(null); setHasChanges(true); }} className="absolute -top-2 -right-2 bg-destructive rounded-full p-1 text-destructive-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center">
                      <Camera className="w-7 h-7 text-muted-foreground" />
                    </div>
                  )}
                  <label className="flex-1">
                    <Button asChild variant="outline" size="sm"><span>Change Photo</span></Button>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <BioSection bio={formData.bio} onChange={(v) => handleInputChange("bio", v)} isPremium={isPremium} />

            {/* 3-Column Profile Fields */}
            <div className="gradient-border animate-fade-in" style={{ animationDelay: "0.04s", animationFillMode: "both" }}>
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Profile Information</h2>

                {/* Column headers */}
                <div className="grid grid-cols-[120px_1fr_1fr] md:grid-cols-[140px_auto_1fr] gap-3 pb-2 border-b border-border/50 mb-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Field</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Visibility</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Value</span>
                </div>

                <ProfileFieldRow label="Display Name" visibility="anyone" onVisibilityChange={() => {}}>
                  <Input value={formData.displayName} onChange={(e) => handleInputChange("displayName", e.target.value)} placeholder="Your name" className="bg-secondary/50 border-border h-9 text-sm" />
                </ProfileFieldRow>

                <ProfileFieldRow label="Username" visibility="anyone" onVisibilityChange={() => {}}>
                  <div>
                    <Input value={formData.username} onChange={(e) => handleInputChange("username", e.target.value)} placeholder="@username" className={`bg-secondary/50 border-border h-9 text-sm ${errors.username ? 'border-destructive' : ''}`} />
                    {errors.username && <p className="text-xs text-destructive mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.username}</p>}
                  </div>
                </ProfileFieldRow>

                <ProfileFieldRow label="School Type" visibility={visibility.school} onVisibilityChange={(v) => handleVisChange("school", v)}>
                  <Select value={formData.schoolType || "not_specified"} onValueChange={(v) => handleInputChange("schoolType", v === "not_specified" ? "" : v)}>
                    <SelectTrigger className="bg-secondary/50 border-border h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_specified">Not specified</SelectItem>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="college">College / University</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </ProfileFieldRow>

                <ProfileFieldRow label="School" visibility={visibility.school} onVisibilityChange={(v) => handleVisChange("school", v)}>
                  {formData.schoolType && formData.schoolType !== 'other' ? (
                    <SchoolSearchDropdown
                      value={formData.schoolName}
                      onChange={(v) => handleInputChange("schoolName", v)}
                      schoolType={formData.schoolType === 'high_school' ? 'high_school' : 'university'}
                      placeholder="Search school..."
                    />
                  ) : (
                    <Input value={formData.schoolName} onChange={(e) => handleInputChange("schoolName", e.target.value)} placeholder="School name" className="bg-secondary/50 border-border h-9 text-sm" />
                  )}
                </ProfileFieldRow>

                <ProfileFieldRow label="Grade / Year" visibility={visibility.grade} onVisibilityChange={(v) => handleVisChange("grade", v)}>
                  <Select value={formData.gradeOrYear || "not_specified"} onValueChange={(v) => handleInputChange("gradeOrYear", v === "not_specified" ? "" : v)}>
                    <SelectTrigger className="bg-secondary/50 border-border h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_specified">Not specified</SelectItem>
                      {isHighSchool ? (
                        <>
                          <SelectItem value="9">9th Grade (Freshman)</SelectItem>
                          <SelectItem value="10">10th Grade (Sophomore)</SelectItem>
                          <SelectItem value="11">11th Grade (Junior)</SelectItem>
                          <SelectItem value="12">12th Grade (Senior)</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="freshman">Freshman</SelectItem>
                          <SelectItem value="sophomore">Sophomore</SelectItem>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="graduate">Graduate Student</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </ProfileFieldRow>

                <ProfileFieldRow label="Intended Majors" visibility={visibility.interests} onVisibilityChange={(v) => handleVisChange("interests", v)}>
                  <div className="flex flex-wrap gap-1">
                    {formData.interests.length > 0 ? formData.interests.map((i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{i}</span>
                    )) : <span className="text-xs text-muted-foreground">Set during onboarding</span>}
                  </div>
                </ProfileFieldRow>

                <ProfileFieldRow label="Extracurriculars" visibility={visibility.extracurriculars} onVisibilityChange={(v) => handleVisChange("extracurriculars", v)}>
                  <div className="flex flex-wrap gap-1">
                    {formData.extracurriculars.length > 0 ? formData.extracurriculars.map((e) => (
                      <span key={e} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">{e}</span>
                    )) : <span className="text-xs text-muted-foreground">Set during onboarding</span>}
                  </div>
                </ProfileFieldRow>

                {isHighSchool && (
                  <ProfileFieldRow label="Dream Schools" visibility={visibility.school} onVisibilityChange={(v) => handleVisChange("school", v)}>
                    <MultiSelectSchools
                      selectedSchools={formData.aspirationalSchool ? formData.aspirationalSchool.split(',').map(s => s.trim()).filter(Boolean) : []}
                      onChange={(schools) => handleInputChange("aspirationalSchool", schools.join(', '))}
                      maxSelections={5}
                      placeholder="Search dream colleges..."
                    />
                  </ProfileFieldRow>
                )}
              </div>
            </div>

            {/* Social handles - 3 column */}
            <div className="gradient-border animate-fade-in" style={{ animationDelay: "0.08s", animationFillMode: "both" }}>
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Social & Contact</h2>
                <div className="grid grid-cols-[120px_1fr_1fr] md:grid-cols-[140px_auto_1fr] gap-3 pb-2 border-b border-border/50 mb-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Field</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Visibility</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Value</span>
                </div>

                <ProfileFieldRow label="Instagram" visibility={visibility.instagram} onVisibilityChange={(v) => handleVisChange("instagram", v)}>
                  <Input value={formData.instagram} onChange={(e) => handleInputChange("instagram", e.target.value)} placeholder="@username" className="bg-secondary/50 border-border h-9 text-sm" />
                </ProfileFieldRow>

                <ProfileFieldRow label="TikTok" visibility={visibility.tiktok} onVisibilityChange={(v) => handleVisChange("tiktok", v)}>
                  <Input value={formData.tiktok} onChange={(e) => handleInputChange("tiktok", e.target.value)} placeholder="@username" className="bg-secondary/50 border-border h-9 text-sm" />
                </ProfileFieldRow>

                <ProfileFieldRow label="LinkedIn" visibility={visibility.linkedin} onVisibilityChange={(v) => handleVisChange("linkedin", v)}>
                  <div>
                    <Input value={formData.linkedin} onChange={(e) => handleInputChange("linkedin", e.target.value)} placeholder="linkedin.com/in/..." className={`bg-secondary/50 border-border h-9 text-sm ${errors.linkedin ? 'border-destructive' : ''}`} />
                    {errors.linkedin && <p className="text-xs text-destructive mt-0.5">{errors.linkedin}</p>}
                  </div>
                </ProfileFieldRow>

                <ProfileFieldRow label="Website" visibility={visibility.website} onVisibilityChange={(v) => handleVisChange("website", v)}>
                  <div>
                    <Input value={formData.website} onChange={(e) => handleInputChange("website", e.target.value)} placeholder="https://..." className={`bg-secondary/50 border-border h-9 text-sm ${errors.website ? 'border-destructive' : ''}`} />
                    {errors.website && <p className="text-xs text-destructive mt-0.5">{errors.website}</p>}
                  </div>
                </ProfileFieldRow>
              </div>
            </div>

            {/* Account actions */}
            <div className="gradient-border animate-fade-in" style={{ animationDelay: "0.12s", animationFillMode: "both" }}>
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5 space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account</h2>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user?.email || "No email"}</span>
                  </div>
                </div>
                <button onClick={() => toast.info("Password change coming soon")} className="w-full flex items-center gap-3 py-2.5 text-sm text-foreground hover:text-primary transition-colors">
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
                <button onClick={() => toast.error("Contact support to delete your account.")} className="w-full flex items-center gap-3 py-2.5 text-sm text-destructive hover:text-destructive/80 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>

            {/* Log out */}
            <button onClick={async () => { await signOut(); navigate("/"); }} className="w-full py-3 text-center text-destructive font-medium hover:bg-destructive/10 rounded-lg transition-colors">
              Log Out
            </button>
          </>
        )}
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default EditProfile;
