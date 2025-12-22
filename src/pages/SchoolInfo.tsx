import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/context/OnboardingContext";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { ChevronLeft, MapPin, Users, GraduationCap, Calendar, BookOpen, Building2, Globe, Award } from "lucide-react";

const SchoolInfo = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  // Mock school data - in production this would come from an API
  const schoolData = {
    name: data.schoolName || "University Name",
    type: data.schoolType === 'college' ? 'University' : 'High School',
    location: "City, State, Country",
    founded: "1850",
    enrollment: "45,000+",
    motto: "Excellence in Education",
    ranking: "#25 National Universities",
    acceptanceRate: "16%",
    studentToFaculty: "12:1",
    website: "www.university.edu",
    description: `${data.schoolName || "This institution"} is a prestigious educational institution dedicated to fostering academic excellence, innovation, and personal growth. With a rich history spanning over a century, it has consistently ranked among the top educational institutions in the nation.

The school offers a diverse range of programs across multiple disciplines, from liberal arts to cutting-edge STEM fields. Students benefit from world-class facilities, renowned faculty members, and a vibrant campus community.

Known for its commitment to research and community engagement, the institution has produced numerous notable alumni who have made significant contributions to their respective fields.`,
    highlights: [
      { icon: Users, label: "Students", value: "45,000+" },
      { icon: GraduationCap, label: "Programs", value: "200+" },
      { icon: Award, label: "Ranking", value: "#25" },
      { icon: Calendar, label: "Founded", value: "1850" },
    ],
    departments: [
      "College of Arts & Sciences",
      "School of Engineering",
      "Business School",
      "School of Medicine",
      "Law School",
      "School of Education",
    ],
  };

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">School Info</h1>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* School Header */}
        <div className="animate-fade-in gradient-border">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{schoolData.name}</h2>
                <p className="text-sm text-primary font-medium">{schoolData.type}</p>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{schoolData.location}</span>
                </div>
              </div>
            </div>
            <p className="text-sm italic text-accent mt-4">"{schoolData.motto}"</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {schoolData.highlights.map((stat) => (
            <div key={stat.label} className="gradient-border">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 text-center">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="animate-fade-in gradient-border" style={{ animationDelay: '0.2s' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              About
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {schoolData.description}
            </p>
          </div>
        </div>

        {/* Key Stats */}
        <div className="animate-fade-in gradient-border" style={{ animationDelay: '0.3s' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-primary" />
              Key Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">National Ranking</p>
                <p className="text-lg font-bold text-foreground">{schoolData.ranking}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Acceptance Rate</p>
                <p className="text-lg font-bold text-foreground">{schoolData.acceptanceRate}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Student:Faculty</p>
                <p className="text-lg font-bold text-foreground">{schoolData.studentToFaculty}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Total Enrollment</p>
                <p className="text-lg font-bold text-foreground">{schoolData.enrollment}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="animate-fade-in gradient-border" style={{ animationDelay: '0.4s' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-primary" />
              Schools & Departments
            </h3>
            <div className="flex flex-wrap gap-2">
              {schoolData.departments.map((dept) => (
                <span key={dept} className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {dept}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Website */}
        <div className="animate-fade-in gradient-border" style={{ animationDelay: '0.5s' }}>
          <a
            href={`https://${schoolData.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium">Visit Website</span>
              </div>
              <span className="text-sm text-muted-foreground">{schoolData.website}</span>
            </div>
          </a>
        </div>
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default SchoolInfo;
