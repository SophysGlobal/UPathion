import * as React from "react";
import { cn } from "@/lib/utils";

export interface GradientInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const GradientInput = React.forwardRef<HTMLInputElement, GradientInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="gradient-border w-full">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
GradientInput.displayName = "GradientInput";

export { GradientInput };
