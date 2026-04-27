import { memo } from "react";
import { matchPath, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

const authPatterns = ["/", "/signin", "/signup"];
const onboardingPatterns = ["/onboarding/*", "/subscription"];
const appHeaderPatterns = ["/dashboard", "/feed", "/explore", "/profile", "/messages"];

const matchesAny = (pathname: string, patterns: string[]) =>
  patterns.some((pattern) => matchPath({ path: pattern, end: pattern.indexOf("*") === -1 }, pathname));

const PersistentLogoLayer = memo(() => {
  const { pathname } = useLocation();

  const isAuth = matchesAny(pathname, authPatterns);
  const isOnboarding = matchesAny(pathname, onboardingPatterns);
  const isAppHeader = matchesAny(pathname, appHeaderPatterns);

  if (!isAuth && !isOnboarding && !isAppHeader) return null;

  // Auth and onboarding pages: centered with text. App pages: top-left icon only.
  const isCentered = isAuth || isOnboarding;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50",
        isCentered ? "top-6 left-1/2 -translate-x-1/2" : "top-3 left-5",
      )}
      aria-hidden={false}
    >
      <div className="pointer-events-auto will-change-transform">
        <Logo showText={isCentered} />
      </div>
    </div>
  );
});

PersistentLogoLayer.displayName = "PersistentLogoLayer";

export default PersistentLogoLayer;
