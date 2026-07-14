import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";

const RULES: { title: string; body: string }[] = [
  { title: "Respectful communication", body: "Speak to others the way you'd want to be spoken to. Disagreement is fine — cruelty isn't." },
  { title: "No harassment or bullying", body: "Targeted attacks, coordinated pile-ons, and repeated unwanted contact are not allowed." },
  { title: "No hate speech or discrimination", body: "No content that attacks or dehumanizes people based on race, ethnicity, national origin, religion, disability, sexual orientation, gender, or gender identity." },
  { title: "No threats or intimidation", body: "Do not threaten violence, harm, or real-world consequences against any person or group." },
  { title: "No doxxing", body: "Never share private information about others without their consent (addresses, phone numbers, class schedules, etc.)." },
  { title: "No impersonation", body: "Don't pretend to be another student, a teacher, an admissions officer, or anyone you aren't." },
  { title: "No scams or fraud", body: "No paid essays, fake tutoring services, application-fraud schemes, or financial scams targeting students." },
  { title: "No illegal activity", body: "Content that promotes or facilitates illegal activity will be removed and may be reported to authorities." },
  { title: "No explicit sexual content", body: "This is a student community. Sexual content, nudity, and sexually suggestive imagery are prohibited." },
  { title: "No child exploitation", body: "Any content that sexualizes minors will be removed immediately, accounts banned, and reports made to NCMEC and law enforcement." },
  { title: "No encouragement of self-harm", body: "Content that glorifies or promotes self-harm, suicide, or eating disorders will be removed. If you or someone you know is struggling, contact a crisis line — 988 in the US." },
  { title: "No revenge content", body: "No sharing of intimate images, private messages, or media intended to shame or embarrass someone." },
];

const CommunityGuidelines = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background/80 pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Community Guidelines</h1>
        </div>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto space-y-6">
        <div className="gradient-border">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5 flex items-start gap-3">
            <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-foreground">A safer place for students</h2>
              <p className="text-sm text-muted-foreground mt-1">
                UPathion exists so high school, undergraduate, and graduate students can connect,
                learn, and support each other. These rules apply everywhere on the platform —
                posts, comments, direct messages, group chats, and profiles.
              </p>
            </div>
          </div>
        </div>

        <ol className="space-y-3">
          {RULES.map((r, i) => (
            <li key={r.title} className="gradient-border">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-foreground text-sm">
                  {i + 1}. {r.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="text-xs text-muted-foreground pt-2 leading-relaxed">
          <p>
            Violations may result in content removal, warnings, temporary suspension, or permanent
            ban depending on severity and repeat behavior. You can report any content or user
            using the report option available on every post, comment, message, and profile.
          </p>
        </div>
      </main>
    </div>
  );
};

export default CommunityGuidelines;