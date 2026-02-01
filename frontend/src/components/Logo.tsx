import { useNavigate } from "react-router-dom";
import upathionLogo from "@/assets/upathion-logo.png";

interface LogoProps {
  showText?: boolean;
}

const Logo = ({ showText = true }: LogoProps) => {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate("/")} 
      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
    >
      <img src={upathionLogo} alt="UPathion Logo" className="w-12 h-12 object-contain" />
      {showText && <span className="text-2xl font-bold gradient-text">UPathion</span>}
    </button>
  );
};

export default Logo;
