import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { Sparkles, Users, MessageCircle, Heart } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  const features = [
    {
      icon: Users,
      title: "Find Your People",
      description: "Connect with students from your school or dream school"
    },
    {
      icon: MessageCircle,
      title: "Join Conversations",
      description: "Discuss classes, events, and campus life"
    },
    {
      icon: Heart,
      title: "Build Community",
      description: "Make lasting friendships and memories"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        {/* Welcome Message */}
        <div className="text-center space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">You're all set!</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Welcome, <span className="gradient-text">{data.fullName.split(' ')[0]}!</span>
          </h1>
          <p className="text-muted-foreground">
            You're now part of the {data.schoolName} community
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="gradient-border animate-fade-in"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <div className="bg-card rounded-lg p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <GradientButton 
            variant="filled" 
            size="lg"
            className="w-full"
            onClick={() => navigate("/")}
          >
            Start Exploring
          </GradientButton>
        </div>

        {/* Community Stats */}
        <div className="flex justify-center gap-8 pt-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="text-center">
            <p className="text-2xl font-bold gradient-text">10K+</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold gradient-text">500+</p>
            <p className="text-xs text-muted-foreground">Schools</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold gradient-text">50K+</p>
            <p className="text-xs text-muted-foreground">Connections</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
