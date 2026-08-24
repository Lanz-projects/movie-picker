import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "host"
    | "ready"
    | "waiting"
    | "score"
    | "unanimous"
    | "genre"
    | "subtle";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "subtle",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-sans font-semibold tracking-wide rounded-full transition-colors border";

  const variantStyles: Record<string, string> = {
    host: "bg-brand-amber/15 text-brand-amber border-brand-amber/30 shadow-sm shadow-brand-amber/10",
    ready:
      "bg-brand-emerald/15 text-brand-emerald border-brand-emerald/30 shadow-sm shadow-brand-emerald/10",
    waiting:
      "bg-bg-elevated text-text-muted border-border-subtle",
    score:
      "bg-brand-violet/15 text-brand-violet border-brand-violet/30 font-display",
    unanimous:
      "bg-gradient-to-r from-brand-emerald/20 to-brand-cyan/20 text-brand-emerald border-brand-emerald/40 shadow-md shadow-brand-emerald/15 font-display",
    genre:
      "bg-bg-surface text-text-secondary border-border-subtle hover:border-border-highlight text-xs",
    subtle:
      "bg-bg-surface text-text-secondary border-border-subtle",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
