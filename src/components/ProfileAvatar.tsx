import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, memo } from "react";

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  isPremium?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-20 h-20",
};

const ringClasses = {
  sm: "p-0.5",
  md: "p-0.5",
  lg: "p-1",
};

const iconClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-10 h-10",
};

const ProfileAvatar = memo(({ avatarUrl, isPremium = false, size = "md", className }: ProfileAvatarProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const showFallback = !avatarUrl || imageError;

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center transition-none",
        ringClasses[size],
        isPremium 
          ? "bg-gradient-to-r from-primary via-accent to-primary animate-spin-slow bg-[length:200%_200%]" 
          : "bg-muted-foreground/30",
        className
      )}
    >
      <div className={cn(
        "rounded-full bg-secondary flex items-center justify-center overflow-hidden",
        sizeClasses[size]
      )}>
        {!showFallback && (
          <img 
            src={avatarUrl!} 
            alt="Profile" 
            className={cn(
              "w-full h-full object-cover transition-opacity duration-150",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        {(showFallback || !imageLoaded) && (
          <User className={cn(
            "text-muted-foreground absolute",
            iconClasses[size],
            !showFallback && imageLoaded && "hidden"
          )} />
        )}
      </div>
    </div>
  );
});

ProfileAvatar.displayName = "ProfileAvatar";

export default ProfileAvatar;
