import { ReactNode, memo } from "react";
import upathionLogo from "@/assets/upathion-logo.png";
import { useNavigate } from "react-router-dom";

interface OnboardingLayoutProps {
  children: ReactNode;
}

/**
 * Persistent layout wrapper for onboarding pages.
 * The logo is rendered once here and never re-mounts during question navigation.
 */
const OnboardingLayout = memo(({ children }: OnboardingLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Persistent logo header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 pointer-events-none">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity pointer-events-auto"
        >
          <img
            src={upathionLogo}
            alt="UPathion Logo"
            className="w-12 h-12 object-contain"
          />
          <span className="text-2xl font-bold gradient-text">UPathion</span>
        </button>
      </div>
      {/* Content with top padding to clear the fixed logo */}
      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
});

OnboardingLayout.displayName = "OnboardingLayout";

export default OnboardingLayout;
