import { memo } from "react";
import upathionLogo from "@/assets/upathion-logo.png";

interface LogoProps {
  showText?: boolean;
}

/**
 * Logo component — uses <a> instead of useNavigate to avoid
 * re-rendering on every route change (which caused flicker).
 */
const Logo = memo(({ showText = true }: LogoProps) => {
  return (
    <a
      href="/"
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
    >
      <img 
        src={upathionLogo} 
        alt="UPathion Logo" 
        className="w-12 h-12 object-contain" 
        loading="eager"
        decoding="sync"
      />
      {showText && <span className="text-2xl font-bold gradient-text">UPathion</span>}
    </a>
  );
});

Logo.displayName = 'Logo';

export default Logo;
