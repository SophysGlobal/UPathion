import { memo } from "react";
import Logo from "@/components/Logo";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

/**
 * Persistent app header: [LOGO] [PAGE TITLE] layout.
 * Logo is on the left, title to its right. Clean, modern SaaS-style.
 */
const AppHeader = memo(({ title, subtitle, rightSlot }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <Logo showText={false} />
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
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
