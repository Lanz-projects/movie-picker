import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "surface"
    | "ghost"
    | "danger"
    | "actionPass"
    | "actionLike"
    | "actionSuperlike"
    | "actionSkip"
    | "actionInfo";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Base layout & interaction styles
    const baseStyles =
      "inline-flex items-center justify-center font-sans font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97]";

    // Standard button variants
    const variantStyles: Record<string, string> = {
      primary:
        "bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-lg shadow-brand-indigo/25 hover:shadow-brand-indigo/40 hover:brightness-110 border border-white/10 rounded-xl",
      secondary:
        "bg-bg-surface hover:bg-bg-elevated text-text-main border border-border-subtle hover:border-border-highlight rounded-xl",
      surface:
        "bg-bg-surface hover:bg-bg-elevated text-text-main border border-border-subtle rounded-xl",
      ghost:
        "bg-transparent hover:bg-bg-surface text-text-secondary hover:text-text-main rounded-xl",
      danger:
        "bg-brand-coral/15 text-brand-coral hover:bg-brand-coral/25 border border-brand-coral/30 rounded-xl",

      // Section 4.2: Circular Swiper Action Buttons
      actionPass:
        "w-14 h-14 rounded-full bg-bg-surface border border-brand-coral/40 text-brand-coral hover:bg-brand-coral/15 hover:border-brand-coral hover:scale-112 shadow-lg shadow-black/40",
      actionSkip:
        "w-12 h-12 rounded-full bg-bg-surface border border-border-subtle text-text-muted hover:bg-bg-elevated hover:text-text-secondary hover:scale-112 shadow-md shadow-black/40",
      actionSuperlike:
        "w-16 h-16 rounded-full bg-bg-surface border-2 border-brand-amber/50 text-brand-amber hover:bg-brand-amber/15 hover:border-brand-amber hover:scale-112 shadow-xl shadow-brand-amber/20",
      actionLike:
        "w-14 h-14 rounded-full bg-bg-surface border border-brand-emerald/40 text-brand-emerald hover:bg-brand-emerald/15 hover:border-brand-emerald hover:scale-112 shadow-lg shadow-black/40",
      actionInfo:
        "w-12 h-12 rounded-full bg-bg-surface border border-border-subtle text-brand-cyan hover:bg-bg-elevated hover:text-brand-cyan hover:scale-112 shadow-md shadow-black/40",
    };

    // Standard sizing (only applied for standard non-circular buttons)
    const isCircular = variant.startsWith("action");
    const sizeStyles: Record<string, string> = isCircular
      ? {}
      : {
          sm: "text-xs px-3 py-1.5 h-8 gap-1.5",
          md: "text-sm px-4 py-2.5 h-11 gap-2",
          lg: "text-base px-6 py-3.5 h-13 gap-2.5",
          icon: "h-10 w-10 p-0 rounded-xl",
        };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          !isCircular && sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
