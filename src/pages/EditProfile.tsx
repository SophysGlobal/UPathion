import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
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
  ChevronRight,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// Validation helpers
const validateUsername = (username: string): string | null => {
  if (!username) return null; // Optional field
  if (username.length < 3) return "Username must be at least 3 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Only letters, numbers, and underscores";
  return null;
};

const validateUrl = (url: string): string | null => {
  if (!url) return null; // Optional
  try {
    // Allow URLs without protocol
    const urlToTest = url.startsWith('http') ? url : `https://${url}`;
    new URL(urlToTest);
    return null;
  } catch {
    return "Invalid URL format";
  }
};

// FormErrors interface remains
interface FormErrors {
  username?: string;
  linkedin?: string;
  website?: string;
}

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading, refetch } = useProfileCompletion();
  const initializedRef = useRef(false);

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
    phoneNumber: "",
    profileVisibility: "public",
    showSchoolOnProfile: true,
    instagramVisibility: "public" as string,
    tiktokVisibility: "public" as string,
    linkedinVisibility: "public" as string,
    websiteVisibility: "public" as string,
  });

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Initialize form data from profile - only once when profile loads
  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      setFormData({
        displayName: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        pronouns: "",
        schoolType: (profile.school_type as 'high_school' | 'college' | 'other' | '') || "",
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
        phoneNumber: "",
        profileVisibility: "public",
        showSchoolOnProfile: true,
      });
      setProfilePhoto(profile.avatar_url || null);
    }
  }, [profile]);

  // Compute isHighSchool based on EXPLICIT schoolType selection
  const isHighSchool = formData.schoolType === 'high_school';

  // Validate on change
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    if (field === 'username') {
      const error = validateUsername(value);
      if (error) newErrors.username = error;
      else delete newErrors.username;
    }
    if (field === 'linkedin') {
      const error = validateUrl(value);
      if (error) newErrors.linkedin = error;
      else delete newErrors.linkedin;
    }
    if (field === 'website') {
      const error = validateUrl(value);
      if (error) newErrors.website = error;
      else delete newErrors.website;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
    
    if (typeof value === 'string') {
      validateField(field, value);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setHasChanges(true);
  };

  const handleSaveProfile = async () => {
    if (!hasChanges || !user?.id) return;

    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors before saving");
      return;
    }

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

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

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

  const handleChangePassword = () => {
    toast.info("Password change flow coming soon");
  };

  const handleDeleteAccount = () => {
    toast.error("This action cannot be undone. Please contact support to delete your account.");
  };

  const handleLogOut = async () => {
    await signOut();
    navigate("/");
  };

  const editSections = useMemo(
    () => [
      {
        title: "Profile Photo",
        items: [
          {
            type: "photo",
            label: "Profile Picture",
            description: "Upload a photo, change it, or remove it",
            value: profilePhoto,
          },
        ],
      },
      {
        title: "Basic Information",
        items: [
          {
            type: "text",
            field: "displayName",
            label: "Display Name",
            description: "How your name appears to others",
            value: formData.displayName,
          },
          {
            type: "text",
            field: "username",
            label: "Username",
            description: "Your unique handle (letters, numbers, underscores only)",
            value: formData.username,
            placeholder: "@username",
            error: errors.username,
          },
          {
            type: "textarea",
            field: "bio",
            label: "Bio",
            description: "Tell others about yourself",
            value: formData.bio,
            maxLength: 150,
          },
          {
            type: "select",
            field: "pronouns",
            label: "Pronouns",
            description: "How you identify (optional)",
            value: formData.pronouns,
            options: [
              { label: "Not specified", value: "not_specified" },
              { label: "He/Him", value: "he/him" },
              { label: "She/Her", value: "she/her" },
              { label: "They/Them", value: "they/them" },
              { label: "He/They", value: "he/they" },
              { label: "She/They", value: "she/they" },
            ],
          },
        ],
      },
      {
        title: "School & Education",
        items: [
          {
            type: "select",
            field: "schoolType",
            label: "School Type",
            description: "Are you in high school or college?",
            value: formData.schoolType,
            options: [
              { label: "Not specified", value: "" },
              { label: "High School", value: "high_school" },
              { label: "College / University", value: "college" },
              { label: "Other", value: "other" },
            ],
          },
          {
            type: "school_search",
            field: "schoolName",
            label: "Current School",
            description: "Your current school or university",
            value: formData.schoolName,
            schoolType: formData.schoolType === 'high_school' ? 'high_school' : 'university',
          },
          ...(isHighSchool
            ? [
                {
                  type: "dream_schools",
                  field: "aspirationalSchool",
                  label: "Dream Schools",
                  description: "Where do you want to go after high school? (Select up to 5)",
                  value: formData.aspirationalSchool,
                },
              ]
            : []),
          {
            type: "select",
            field: "gradeOrYear",
            label: isHighSchool ? "Grade" : "Year",
            description: isHighSchool ? "Your current grade level" : "Your current year",
            value: formData.gradeOrYear,
            options: isHighSchool
              ? [
                  { label: "Not specified", value: "not_specified" },
                  { label: "9th Grade (Freshman)", value: "9" },
                  { label: "10th Grade (Sophomore)", value: "10" },
                  { label: "11th Grade (Junior)", value: "11" },
                  { label: "12th Grade (Senior)", value: "12" },
                ]
              : [
                  { label: "Not specified", value: "not_specified" },
                  { label: "Freshman", value: "freshman" },
                  { label: "Sophomore", value: "sophomore" },
                  { label: "Junior", value: "junior" },
                  { label: "Senior", value: "senior" },
                  { label: "Graduate Student", value: "graduate" },
                ],
          },
          {
            type: "text",
            field: "major",
            label: isHighSchool ? "Intended Major / Interests" : "Major / Interests",
            description: isHighSchool ? "What you're interested in studying" : "Your field of study or interests",
            value: formData.major,
          },
          {
            type: "text",
            field: "interestsDisplay",
            label: "Intended Majors (from questionnaire)",
            description: "Selected during onboarding",
            value: formData.interests.join(', ') || "None selected",
            readOnly: true,
          },
          {
            type: "text",
            field: "extracurricularsDisplay",
            label: "Extracurricular Interests",
            description: "Activities you're interested in",
            value: formData.extracurriculars.join(', ') || "None selected",
            readOnly: true,
          },
        ],
      },
      {
        title: "Contact & Social",
        items: [
          {
            type: "text",
            field: "phoneNumber",
            label: "Phone Number",
            description: "Optional contact number",
            value: formData.phoneNumber,
            placeholder: "+1 (555) 000-0000",
          },
          {
            type: "social_handle",
            field: "instagram",
            label: "Instagram",
            description: "Your Instagram handle",
            value: formData.instagram,
            placeholder: "@username",
            visibilityField: "instagramVisibility",
          },
          {
            type: "social_handle",
            field: "tiktok",
            label: "TikTok",
            description: "Your TikTok handle",
            value: formData.tiktok,
            placeholder: "@username",
            visibilityField: "tiktokVisibility",
          },
          {
            type: "social_handle",
            field: "linkedin",
            label: "LinkedIn",
            description: "Your LinkedIn profile",
            value: formData.linkedin,
            placeholder: "linkedin.com/in/username",
            error: errors.linkedin,
            visibilityField: "linkedinVisibility",
          },
          {
            type: "social_handle",
            field: "website",
            label: "Website",
            description: "Your personal website or portfolio",
            value: formData.website,
            placeholder: "https://example.com",
            error: errors.website,
            visibilityField: "websiteVisibility",
          },
        ],
      },
      {
        title: "Preferences",
        items: [
          {
            type: "select",
            field: "profileVisibility",
            label: "Profile Visibility",
            description: "Who can see your profile",
            value: formData.profileVisibility,
            options: [
              { label: "Public", value: "public" },
              { label: "School-Only", value: "school_only" },
            ],
          },
          {
            type: "toggle",
            field: "showSchoolOnProfile",
            label: "Show School on Profile",
            description: "Display your school publicly",
            value: formData.showSchoolOnProfile,
          },
        ],
      },
      {
        title: "Account & Security",
        items: [
          {
            type: "action",
            icon: Lock,
            label: "Change Password",
            description: "Update your account password",
            action: handleChangePassword,
          },
          {
            type: "action",
            icon: Mail,
            label: "Email Address",
            description: `${user?.email || "No email set"}`,
            readOnly: true,
          },
          {
            type: "action",
            icon: Trash2,
            label: "Delete Account",
            description: "Permanently delete your account and data",
            action: handleDeleteAccount,
            destructive: true,
          },
        ],
      },
    ],
    [formData, profilePhoto, isHighSchool, user?.email, errors]
  );

  // Loading skeleton
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background/80 pb-20 relative">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="text-lg font-semibold text-foreground">Edit Profile</h1>
            </div>
          </div>
        </header>
        <main className="relative z-10 px-6 py-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="gradient-border">
                <div className="bg-card/90 rounded-lg p-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          ))}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Edit Profile</h1>
          </div>
          {hasChanges && (
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={isSaving || Object.keys(errors).length > 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {editSections.map((section, sectionIndex) => (
          <div
            key={section.title}
            className="animate-fade-in"
            style={{ animationDelay: `${sectionIndex * 0.04}s`, animationFillMode: "both" }}
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map((item: any) => {
                if (item.type === "photo") {
                  return (
                    <div key={item.label} className="gradient-border">
                      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-end gap-4">
                          {profilePhoto ? (
                            <div className="relative">
                              <img
                                src={profilePhoto}
                                alt="Profile"
                                className="w-24 h-24 rounded-xl object-cover"
                              />
                              <button
                                onClick={handleRemovePhoto}
                                className="absolute -top-2 -right-2 bg-destructive rounded-full p-1 text-destructive-foreground hover:bg-destructive/90"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-xl bg-secondary flex items-center justify-center">
                              <Camera className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <label className="flex-1">
                            <Button asChild variant="outline" className="w-full">
                              <span>Change Photo</span>
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.type === "text") {
                  return (
                    <div key={item.field} className="gradient-border">
                      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
                        <label className="block">
                          <p className="font-medium text-foreground text-sm mb-1">{item.label}</p>
                          <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                          {item.maxLength ? (
                            <textarea
                              value={item.value}
                              onChange={(e) => handleInputChange(item.field, e.target.value)}
                              maxLength={item.maxLength}
                              placeholder={item.placeholder || ""}
                              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                              rows={3}
                            />
                          ) : (
                            <Input
                              type="text"
                              value={item.value}
                              onChange={(e) => handleInputChange(item.field, e.target.value)}
                              placeholder={item.placeholder || ""}
                              className={`bg-secondary/50 border-border ${item.error ? 'border-destructive' : ''}`}
                            />
                          )}
                          {item.error && (
                            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {item.error}
                            </p>
                          )}
                          {item.maxLength && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.value.length}/{item.maxLength}
                            </p>
                          )}
                        </label>
                      </div>
                    </div>
                  );
                }

                if (item.type === "school_search") {
                  return (
                    <div key={item.field} className="gradient-border">
                      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
                        <div className="block">
                          <p className="font-medium text-foreground text-sm mb-1">{item.label}</p>
                          <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                          {formData.schoolType && formData.schoolType !== 'other' && (
                            <SchoolSearchDropdown
                              value={item.value}
                              onChange={(value) => handleInputChange(item.field, value)}
                              schoolType={item.schoolType}
                              placeholder={item.schoolType === 'high_school' ? 'Search for your high school...' : 'Search for your college...'}
                            />
                          )}
                          {(!formData.schoolType || formData.schoolType === 'other') && (
                            <Input
                              type="text"
                              value={item.value}
                              onChange={(e) => handleInputChange(item.field, e.target.value)}
                              placeholder="Enter your school name"
                              className="bg-secondary/50 border-border"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.type === "dream_schools") {
                  // Parse the comma-separated string into an array
                  const selectedSchools = item.value
                    ? item.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : [];

                  return (
                    <div key={item.field} className="gradient-border">
                      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
                        <div className="block">
                          <div className="flex items-center gap-2 mb-1">
                            <GraduationCap className="w-4 h-4 text-primary" />
                            <p className="font-medium text-foreground text-sm">{item.label}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                          <MultiSelectSchools
                            selectedSchools={selectedSchools}
                            onChange={(schools) => handleInputChange(item.field, schools.join(', '))}
                            maxSelections={5}
                            placeholder="Search for your dream colleges..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.type === "select") {
                  return (
                    <div key={item.field} className="gradient-border">
                      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
                        <label className="block">
                          <p className="font-medium text-foreground text-sm mb-1">{item.label}</p>
                          <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                          <Select
                            value={item.value || ""}
                            onValueChange={(value) => handleInputChange(item.field, value)}
                          >
                            <SelectTrigger className="bg-secondary/50 border-border">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {item.options.map((option: any) => (
                                <SelectItem key={option.value || "empty"} value={option.value || "not_specified"}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>
                      </div>
                    </div>
                  );
                }

                if (item.type === "toggle") {
                  return (
                    <div key={item.field} className="gradient-border">
                      <button
                        onClick={() => handleInputChange(item.field, !item.value)}
                        className="w-full bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                      >
                        <div className="text-left">
                          <p className="font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <div
                          className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                            item.value ? "bg-primary" : "bg-secondary"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full bg-white transition-transform ${
                              item.value ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </div>
                      </button>
                    </div>
                  );
                }

                if (item.type === "action") {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={item.action}
                      disabled={item.readOnly}
                      className="w-full gradient-border group"
                    >
                      <div
                        className={`bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between transition-all ${
                          item.readOnly
                            ? "opacity-70"
                            : item.destructive
                            ? "hover:bg-destructive/10"
                            : "hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              item.destructive ? "bg-destructive/20" : "bg-secondary"
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                item.destructive ? "text-destructive" : "text-primary"
                              }`}
                            />
                          </div>
                          <div className="text-left">
                            <p
                              className={`font-medium ${
                                item.destructive ? "text-destructive" : "text-foreground"
                              }`}
                            >
                              {item.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        {!item.readOnly && (
                          <ChevronRight
                            className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                              item.destructive ? "text-destructive" : "text-muted-foreground"
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  );
                }

                return null;
              })}
            </div>
          </div>
        ))}

        {/* Log Out Button */}
        <div className="pt-4">
          <button
            onClick={handleLogOut}
            className="w-full py-3 text-center text-destructive font-medium hover:bg-destructive/10 rounded-lg transition-colors"
          >
            Log Out
          </button>
        </div>
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default EditProfile;
