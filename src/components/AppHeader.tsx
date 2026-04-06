import { memo } from "react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

const AppHeader = memo(({ title, subtitle, rightSlot }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="pl-16">
          <h1 className="text-lg font-semibold text-foreground leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {rightSlot && <div>{rightSlot}</div>}
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
