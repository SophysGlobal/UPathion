import { ReactNode, memo } from "react";
import Logo from "@/components/Logo";

interface OnboardingLayoutProps {
  children: ReactNode;
}

/**
 * Persistent layout wrapper for onboarding pages.
 * The Logo is mounted once here and never re-mounts during question navigation,
 * eliminating any flicker.
 */
const OnboardingLayout = memo(({ children }: OnboardingLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
});

OnboardingLayout.displayName = 'OnboardingLayout';

export default OnboardingLayout;
