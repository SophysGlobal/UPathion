import upathionLogo from "@/assets/upathion-logo.png";

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <img src={upathionLogo} alt="UPathion Logo" className="w-12 h-12 object-contain" />
      <span className="text-2xl font-bold gradient-text">UPathion</span>
    </div>
  );
};

export default Logo;
