import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon ? (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center">
            {leftIcon}
          </div>
        ) : null}
        <input
          ref={ref}
          suppressHydrationWarning
          className={cn(
            "w-full h-12 rounded-xl bg-bg-surface border border-border-subtle text-text-main placeholder:text-text-muted px-4 text-base sm:text-sm font-sans transition-all duration-200",
            "focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error && "border-brand-coral focus:border-brand-coral focus:ring-brand-coral/20",
            className
          )}
          {...props}
        />
        {rightIcon ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted flex items-center">
            {rightIcon}
          </div>
        ) : null}
        {error ? (
          <p className="mt-1 text-xs text-brand-coral font-medium">{error}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
