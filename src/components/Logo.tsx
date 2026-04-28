import { memo } from "react";
import upathionLogo from "@/assets/upathion-logo.png";

interface LogoProps {
  showText?: boolean;
  size?: number;
}

/**
 * Logo component — uses <a> instead of useNavigate to avoid
 * re-rendering on every route change (which caused flicker).
 * Always navigates to /dashboard (the home of the signed-in app).
 */
const Logo = memo(({ showText = true, size = 48 }: LogoProps) => {
  return (
    <a
      href="/dashboard"
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, "", "/dashboard");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      aria-label="UPathion — go to dashboard"
    >
      <img
        src={upathionLogo}
        alt="UPathion Logo"
        className="object-contain"
        style={{ width: size, height: size }}
        loading="eager"
        decoding="sync"
      />
      {showText && <span className="text-2xl font-bold gradient-text">UPathion</span>}
    </a>
  );
});

Logo.displayName = 'Logo';

export default Logo;
