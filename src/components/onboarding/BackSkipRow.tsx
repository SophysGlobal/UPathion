import { ChevronLeft } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";

interface BackSkipRowProps {
  onBack: () => void;
  onSkip?: () => void;
  backLabel?: string;
  skipLabel?: string;
}

/**
 * Side-by-side secondary actions used across the onboarding flow.
 * Both buttons share the gradient-outline style used for "Edit" — dark
 * interior, gradient ring — and together span the same width as the
 * primary "Continue" button above them.
 */
const BackSkipRow = ({
  onBack,
  onSkip,
  backLabel = "Back",
  skipLabel = "Skip for now",
}: BackSkipRowProps) => {
  return (
    <div className="flex gap-2 w-full">
      <GradientButton
        type="button"
        variant="default"
        size="sm"
        className="flex-1"
        onClick={onBack}
      >
        <ChevronLeft className="w-4 h-4" />
        {backLabel}
      </GradientButton>
      {onSkip && (
        <GradientButton
          type="button"
          variant="default"
          size="sm"
          className="flex-1"
          onClick={onSkip}
        >
          {skipLabel}
        </GradientButton>
      )}
    </div>
  );
};

export default BackSkipRow;