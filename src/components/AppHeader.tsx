import { memo } from "react";
import Logo from "./Logo";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  leftSlot?: React.ReactNode;
}

const AppHeader = memo(({ title, subtitle, rightSlot, leftSlot }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-5 py-4 min-h-[56px]">
        <div className="flex items-center gap-3 min-w-0">
          {leftSlot}
          <Logo showText={false} size={36} />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground leading-tight truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {rightSlot && <div>{rightSlot}</div>}
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
