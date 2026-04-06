import { ReactNode, memo } from "react";

interface OnboardingLayoutProps {
  children: ReactNode;
}

const OnboardingLayout = memo(({ children }: OnboardingLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-4 relative">
      <div className="w-full max-w-md space-y-8 relative z-10">
        {children}
      </div>
    </div>
  );
});

OnboardingLayout.displayName = 'OnboardingLayout';

export default OnboardingLayout;
