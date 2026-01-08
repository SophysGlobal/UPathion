import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  User,
  Mail,
  Lock,
  Camera,
  X,
  Trash2,
  Heart,
  Globe,
  Smartphone,
  Sparkles,
  Eye,
  ChevronRight,
  GraduationCap,
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Helper to detect if school is high school
const detectIsHighSchool = (schoolName: string): boolean => {
  const lowerName = schoolName.toLowerCase();
  return (
    lowerName.includes('high school') ||
    lowerName.includes('highschool') ||
    /\bhs\b/.test(lowerName)
  );
};

// Popular colleges list for aspirational school dropdown
const POPULAR_COLLEGES = [
  "Harvard University",
  "Stanford University",
  "MIT",
  "Yale University",
  "Princeton University",
  "Columbia University",
  "University of Pennsylvania",
  "Brown University",
  "Dartmouth College",
  "Cornell University",
  "Duke University",
  "Northwestern University",
  "Johns Hopkins University",
  "Caltech",
  "University of Chicago",
  "UCLA",
  "UC Berkeley",
  "University of Michigan",
  "NYU",
  "Boston University",
  "Georgetown University",
  "Carnegie Mellon University",
  "USC",
  "University of Virginia",
  "Georgia Tech",
  "University of Texas at Austin",
  "University of Florida",
  "Ohio State University",
  "Penn State University",
  "University of Wisconsin-Madison",
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, refetch } = useProfileCompletion();

  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    bio: "",
    pronouns: "",
    schoolName: "",
    gradeOrYear: "",
    major: "",
    aspirationalSchool: "",
    instagram: "",
    tiktok: "",
    linkedin: "",
    website: "",
    phoneNumber: "",
    profileVisibility: "public",
    showSchoolOnProfile: true,
  });

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aspirationalOpen, setAspirationalOpen] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        displayName: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        schoolName: profile.school_name || "",
        gradeOrYear: profile.grade_or_year || "",
        major: profile.major || "",
        aspirationalSchool: profile.aspirational_school || "",
      }));
      setProfilePhoto(profile.avatar_url || null);
    }
  }, [profile]);

  // Compute isHighSchool based on current schoolName
  const isHighSchool = detectIsHighSchool(formData.schoolName);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
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

    setIsLoading(true);
    try {
      const updates = {
        display_name: formData.displayName || null,
        username: formData.username || null,
        bio: formData.bio || null,
        school_name: formData.schoolName || null,
        grade_or_year: formData.gradeOrYear || null,
        major: formData.major || null,
        aspirational_school: isHighSchool ? (formData.aspirationalSchool || null) : null,
        is_high_school: isHighSchool,
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
        toast.error("That username is already taken");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setIsLoading(false);
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
              { label: "Not specified", value: "" },
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
            type: "text",
            field: "schoolName",
            label: "Current School",
            description: "Your current school or university",
            value: formData.schoolName,
          },
          ...(isHighSchool
            ? [
                {
                  type: "aspirational",
                  field: "aspirationalSchool",
                  label: "Aspirational School",
                  description: "Where do you aspire to go after high school?",
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
                  { label: "Not specified", value: "" },
                  { label: "9th Grade (Freshman)", value: "9" },
                  { label: "10th Grade (Sophomore)", value: "10" },
                  { label: "11th Grade (Junior)", value: "11" },
                  { label: "12th Grade (Senior)", value: "12" },
                ]
              : [
                  { label: "Not specified", value: "" },
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
            type: "text",
            field: "instagram",
            label: "Instagram",
            description: "Your Instagram handle",
            value: formData.instagram,
            placeholder: "@username",
          },
          {
            type: "text",
            field: "tiktok",
            label: "TikTok",
            description: "Your TikTok handle",
            value: formData.tiktok,
            placeholder: "@username",
          },
          {
            type: "text",
            field: "linkedin",
            label: "LinkedIn",
            description: "Your LinkedIn profile",
            value: formData.linkedin,
            placeholder: "linkedin.com/in/username",
          },
          {
            type: "text",
            field: "website",
            label: "Website",
            description: "Your personal website or portfolio",
            value: formData.website,
            placeholder: "https://example.com",
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
              { label: "Private", value: "private" },
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
    [formData, profilePhoto, isHighSchool, user?.email]
  );

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />

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
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? "Saving..." : "Save"}
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
                              className="bg-secondary/50 border-border"
                            />
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

                if (item.type === "aspirational") {
                  return (
                    <div key={item.field} className="gradient-border">
                      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
                        <label className="block">
                          <div className="flex items-center gap-2 mb-1">
                            <GraduationCap className="w-4 h-4 text-primary" />
                            <p className="font-medium text-foreground text-sm">{item.label}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                          <Popover open={aspirationalOpen} onOpenChange={setAspirationalOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between bg-secondary/50 border-border"
                              >
                                {formData.aspirationalSchool || "Select a school..."}
                                <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search schools..." />
                                <CommandList>
                                  <CommandEmpty>No school found.</CommandEmpty>
                                  <CommandGroup>
                                    {POPULAR_COLLEGES.map((college) => (
                                      <CommandItem
                                        key={college}
                                        value={college}
                                        onSelect={(value) => {
                                          handleInputChange("aspirationalSchool", value);
                                          setAspirationalOpen(false);
                                        }}
                                      >
                                        {college}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </label>
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
                            value={item.value}
                            onValueChange={(value) => handleInputChange(item.field, value)}
                          >
                            <SelectTrigger className="bg-secondary/50 border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {item.options.map((option: any) => (
                                <SelectItem key={option.value} value={option.value}>
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
                      className="w-full gradient-border group"
                      disabled={item.readOnly}
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
