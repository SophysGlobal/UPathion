import { memo } from "react";
import { matchPath, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

const onboardingPatterns = ["/onboarding/*"];
const appHeaderPatterns = ["/dashboard", "/feed", "/explore", "/profile", "/messages"];

const matchesAny = (pathname: string, patterns: string[]) =>
  patterns.some((pattern) => matchPath({ path: pattern, end: pattern.indexOf("*") === -1 }, pathname));

const PersistentLogoLayer = memo(() => {
  const { pathname } = useLocation();

  const isOnboarding = matchesAny(pathname, onboardingPatterns);
  const isAppHeader = matchesAny(pathname, appHeaderPatterns);

  if (!isOnboarding && !isAppHeader) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50",
        isOnboarding ? "top-4 left-1/2 -translate-x-1/2" : "top-3 left-5",
      )}
      aria-hidden={false}
    >
      <div className="pointer-events-auto will-change-transform">
        <Logo showText={isOnboarding} />
      </div>
    </div>
  );
});

PersistentLogoLayer.displayName = "PersistentLogoLayer";

export default PersistentLogoLayer;
