import { Users } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="gradient-bg p-2.5 rounded-xl">
        <Users className="w-6 h-6 text-primary-foreground" />
      </div>
      <span className="text-2xl font-bold gradient-text">Campfire</span>
    </div>
  );
};

export default Logo;
