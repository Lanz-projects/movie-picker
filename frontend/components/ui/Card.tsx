import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "card" | "surface" | "elevated" | "glass";
  hoverable?: boolean;
}

export function Card({
  className,
  variant = "card",
  hoverable = false,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    card: "bg-bg-card border border-border-subtle shadow-xl shadow-black/40",
    surface: "bg-bg-surface border border-border-subtle",
    elevated: "bg-bg-elevated border border-border-subtle shadow-2xl shadow-black/60",
    glass: "glass-panel shadow-2xl shadow-black/50",
  };

  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-200",
        variantStyles[variant],
        hoverable && "hover:-translate-y-1 hover:border-border-highlight cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
