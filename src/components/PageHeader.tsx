import { memo } from "react";
import upathionLogo from "@/assets/upathion-logo.png";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

/**
 * Shared page header with logo on the left, title to its right.
 */
const PageHeader = memo(({ title, subtitle, rightElement }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/")}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <img
              src={upathionLogo}
              alt="UPathion"
              className="w-9 h-9 object-contain"
            />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {rightElement && <div className="flex-shrink-0">{rightElement}</div>}
      </div>
    </header>
  );
});

PageHeader.displayName = "PageHeader";

export default PageHeader;
