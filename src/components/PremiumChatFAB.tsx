import { useState } from "react";
import { Sparkles } from "lucide-react";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { cn } from "@/lib/utils";
import PremiumChatModal from "./PremiumChatModal";

const PremiumChatFAB = () => {
  const { isPremium, loading } = usePremiumStatus();
  const [chatOpen, setChatOpen] = useState(false);

  if (loading || !isPremium) return null;

  return (
    <>
      <button
        onClick={() => setChatOpen(true)}
        className={cn(
          "fixed z-50 w-12 h-12 rounded-full",
          "left-[max(1rem,env(safe-area-inset-left))]",
          "bottom-[calc(6rem+env(safe-area-inset-bottom))]",
          "md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
          "bg-gradient-to-br from-primary via-accent to-primary",
          "flex items-center justify-center shadow-lg shadow-primary/30",
          "ring-1 ring-white/10 backdrop-blur-sm",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-primary/50 active:scale-95",
          "animate-fade-in"
        )}
        aria-label="Premium AI Chat"
      >
        <Sparkles className="w-5 h-5 text-primary-foreground" />
      </button>
      <PremiumChatModal open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
};

export default PremiumChatFAB;
