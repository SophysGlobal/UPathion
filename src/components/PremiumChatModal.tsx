import AIChatWindow from "./ai-chat/AIChatWindow";

interface PremiumChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PremiumChatModal = ({ open, onOpenChange }: PremiumChatModalProps) => {
  if (!open) return null;
  return <AIChatWindow onClose={() => onOpenChange(false)} />;
};

export default PremiumChatModal;
