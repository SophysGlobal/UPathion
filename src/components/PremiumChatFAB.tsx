import { Sparkles } from "lucide-react";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { cn } from "@/lib/utils";

const PremiumChatFAB = () => {
  const { isPremium, loading } = usePremiumStatus();

  if (loading || !isPremium) return null;

  return (
    <button
      onClick={() => {
        // TODO: Open AI chat modal
        console.log("Open AI chat");
      }}
      className={cn(
        "fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full",
        "bg-gradient-to-br from-primary via-accent to-primary",
        "flex items-center justify-center shadow-lg",
        "hover:scale-110 transition-transform duration-200",
        "animate-pulse-slow"
      )}
      aria-label="Premium AI Chat"
    >
      <Sparkles className="w-5 h-5 text-primary-foreground" />
    </button>
  );
};

export default PremiumChatFAB;
