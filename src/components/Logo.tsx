import { memo } from "react";
import { useNavigate } from "react-router-dom";
import upathionLogo from "@/assets/upathion-logo.png";

interface LogoProps {
  showText?: boolean;
}

const Logo = memo(({ showText = true }: LogoProps) => {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate("/")} 
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
    </button>
  );
});

Logo.displayName = 'Logo';

export default Logo;
