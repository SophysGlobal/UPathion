import { useLocation, useNavigate } from "react-router-dom";
import { Home, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { memo } from "react";

const BottomNav = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Compass, label: "Explore", path: "/explore" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-6 py-2 transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                isActive && "scale-110"
              )} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
        
        {/* Profile with avatar */}
        <button
          onClick={() => navigate("/profile")}
          className={cn(
            "flex flex-col items-center gap-1 px-6 py-2 transition-all duration-200",
            location.pathname === "/profile" 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ProfileAvatar 
            avatarUrl={profile?.avatar_url} 
            isPremium={profile?.is_premium ?? false}
            size="sm"
          />
          <span className="text-xs font-medium">Profile</span>
          {location.pathname === "/profile" && (
            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
          )}
        </button>
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";

export default BottomNav;
