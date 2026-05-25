import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/context/OnboardingContext";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import { ChevronLeft, MapPin, Users, GraduationCap, Calendar, BookOpen, Building2, Globe, Award, Sparkles, School as SchoolIcon, Bookmark, ExternalLink } from "lucide-react";
import PersonCard from "@/components/PersonCard";
import { seedPeople } from "@/data/seedData";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
        {[
          {
            key: "header",
            element: (
              <div className="gradient-border">
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
            ),
          },
          {
            key: "stats",
            element: (
              <div className="grid grid-cols-4 gap-3">
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
            ),
          },
          {
            key: "about",
            element: (
              <div className="gradient-border">
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
            ),
          },
          {
            key: "keyStats",
            element: (
              <div className="gradient-border">
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
            ),
          },
          {
            key: "departments",
            element: (
              <div className="gradient-border">
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
            ),
          },
          {
            key: "website",
            element: (
              <a
                href={`https://${schoolData.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="gradient-border">
                  <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="text-foreground font-medium">Visit Website</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{schoolData.website}</span>
                  </div>
                </div>
              </a>
            ),
          },
        ].map((section, sectionIndex) => (
          <div
            key={section.key}
            className="animate-fade-in"
            style={{ animationDelay: `${sectionIndex * 0.04}s`, animationFillMode: 'both' }}
          >
            {section.element}
          </div>
        ))}

        <RecommendedConnections />
        <RecommendedSchools onOpen={(id) => navigate(`/school/${id}`)} />
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default SchoolInfo;

/* -------------------------------------------------------------------------
 * Recommended Connections — vertically scrollable list of suggested peers
 * ------------------------------------------------------------------------*/
const RecommendedConnections = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();
  const [loading, setLoading] = useState(true);

  useState(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  });

  // Rank: same school first, then aspirational, then others.
  const recommended = useMemo(() => {
    const mine = (data.schoolName || "").toLowerCase();
    const dream = (data.aspirationalSchool || "").toLowerCase();
    return [...seedPeople].sort((a, b) => {
      const score = (p: typeof a) =>
        (p.school.toLowerCase() === mine ? 3 : 0) +
        (p.school.toLowerCase() === dream ? 2 : 0);
      return score(b) - score(a);
    });
  }, [data.schoolName, data.aspirationalSchool]);

  return (
    <section
      className="animate-fade-in space-y-3"
      style={{ animationDelay: '0.32s', animationFillMode: 'both' }}
    >
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" /> Recommended Connections
          </h3>
          <p className="text-xs text-muted-foreground">
            People you may know from your school & community
          </p>
        </div>
        <button
          onClick={() => navigate('/connections')}
          className="text-xs text-primary hover:underline"
        >
          See all
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg bg-card/60 border border-border/40 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-secondary/60" />
                  <div className="h-2.5 w-2/3 rounded bg-secondary/40" />
                </div>
                <div className="h-8 w-20 rounded bg-secondary/60" />
              </div>
            </div>
          ))}
        </div>
      ) : recommended.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-card/60 p-6 text-center text-sm text-muted-foreground">
          No recommendations yet. Complete your profile to get matched.
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-hide">
          {recommended.map((p, i) => (
            <PersonCard
              key={p.id}
              person={p}
              index={i}
              onClick={() => navigate(`/user/sample-${p.id}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

/* -------------------------------------------------------------------------
 * Recommended Schools — modern card grid of suggested colleges/universities
 * ------------------------------------------------------------------------*/
interface RecSchool {
  id: string;
  name: string;
  location: string;
  acceptanceRate: string;
  topMajors: string[];
  satRange: string;
  matchPct: number;
  website: string;
  tag: 'Reach' | 'Target' | 'Safety';
}

const SAMPLE_SCHOOLS: RecSchool[] = [
  { id: 'mit', name: 'Massachusetts Institute of Technology', location: 'Cambridge, MA', acceptanceRate: '4%', topMajors: ['CS', 'EE', 'Mechanical Eng.'], satRange: '1510–1580', matchPct: 92, website: 'https://mit.edu', tag: 'Reach' },
  { id: 'stanford', name: 'Stanford University', location: 'Stanford, CA', acceptanceRate: '4%', topMajors: ['CS', 'Biology', 'Economics'], satRange: '1500–1570', matchPct: 88, website: 'https://stanford.edu', tag: 'Reach' },
  { id: 'umich', name: 'University of Michigan', location: 'Ann Arbor, MI', acceptanceRate: '18%', topMajors: ['Business', 'Engineering', 'Psychology'], satRange: '1350–1530', matchPct: 81, website: 'https://umich.edu', tag: 'Target' },
  { id: 'northeastern', name: 'Northeastern University', location: 'Boston, MA', acceptanceRate: '7%', topMajors: ['Business', 'CS', 'Health Sciences'], satRange: '1450–1540', matchPct: 78, website: 'https://northeastern.edu', tag: 'Target' },
  { id: 'umass', name: 'University of Massachusetts Amherst', location: 'Amherst, MA', acceptanceRate: '64%', topMajors: ['Business', 'Psychology', 'CS'], satRange: '1240–1420', matchPct: 74, website: 'https://umass.edu', tag: 'Safety' },
];

const RecommendedSchools = ({ onOpen }: { onOpen: (id: string) => void }) => {
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useState(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  });

  const toggleSave = (id: string, name: string) => {
    setSaved((s) => {
      const next = { ...s, [id]: !s[id] };
      toast.success(next[id] ? `Saved ${name}` : `Removed ${name}`);
      return next;
    });
  };

  const tagClass = (tag: RecSchool['tag']) =>
    tag === 'Reach'
      ? 'bg-accent/15 text-accent'
      : tag === 'Target'
      ? 'bg-primary/15 text-primary'
      : 'bg-secondary text-muted-foreground';

  return (
    <section
      className="animate-fade-in space-y-3"
      style={{ animationDelay: '0.38s', animationFillMode: 'both' }}
    >
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <SchoolIcon className="w-4 h-4 text-primary" /> Recommended Schools
          </h3>
          <p className="text-xs text-muted-foreground">
            Matched to your interests, majors, and goals
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-shrink-0 w-72 rounded-lg bg-card/60 border border-border/40 p-4 animate-pulse space-y-3">
              <div className="h-4 w-2/3 rounded bg-secondary/60" />
              <div className="h-3 w-1/2 rounded bg-secondary/40" />
              <div className="h-16 rounded bg-secondary/30" />
            </div>
          ))}
        </div>
      ) : SAMPLE_SCHOOLS.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-card/60 p-6 text-center text-sm text-muted-foreground">
          No school recommendations yet.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-2 snap-x snap-mandatory scrollbar-hide">
          {SAMPLE_SCHOOLS.map((s, i) => (
            <article
              key={s.id}
              className="gradient-border flex-shrink-0 w-72 snap-start animate-fade-in"
              style={{ animationDelay: `${0.4 + i * 0.05}s`, animationFillMode: 'both' }}
            >
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground leading-tight truncate">
                        {s.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {s.location}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSave(s.id, s.name)}
                    aria-label={saved[s.id] ? 'Unsave school' : 'Save school'}
                    className="p-1.5 rounded-md hover:bg-secondary/60 transition-colors"
                  >
                    <Bookmark className={`w-4 h-4 ${saved[s.id] ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tagClass(s.tag)}`}>
                    {s.tag}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 text-[10px] font-semibold text-foreground">
                    {s.matchPct}% match
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-md bg-secondary/40">
                    <p className="text-muted-foreground">Acceptance</p>
                    <p className="font-semibold text-foreground">{s.acceptanceRate}</p>
                  </div>
                  <div className="p-2 rounded-md bg-secondary/40">
                    <p className="text-muted-foreground">SAT</p>
                    <p className="font-semibold text-foreground">{s.satRange}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {s.topMajors.slice(0, 3).map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                      {m}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => onOpen(s.id)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => window.open(s.website, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Website
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
