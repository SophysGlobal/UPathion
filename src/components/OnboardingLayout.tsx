import { ReactNode, memo } from "react";
import { useLocation } from "react-router-dom";

interface OnboardingLayoutProps {
  children: ReactNode;
}

const OnboardingLayout = memo(({ children }: OnboardingLayoutProps) => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-4 relative">
      {/* Keying on pathname forces a fresh fade-in on every step transition,
          so even content that stays mounted (e.g. layout chrome) re-animates. */}
      <div
        key={pathname}
        className="w-full max-w-md space-y-8 relative z-10 animate-fade-in"
      >
        {children}
      </div>
    </div>
  );
});

OnboardingLayout.displayName = 'OnboardingLayout';

export default OnboardingLayout;
