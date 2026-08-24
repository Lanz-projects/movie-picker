import * as React from "react";
import { cn } from "@/lib/utils";

export interface StageContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  stageTitle?: string;
  stageSubtitle?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export function StageContainer({
  className,
  stageTitle,
  stageSubtitle,
  maxWidth = "lg",
  children,
  ...props
}: StageContainerProps) {
  const maxWidthStyles = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-4xl",
    xl: "max-w-[1100px]",
    full: "max-w-full",
  };

  return (
    <main
      className={cn(
        "flex flex-1 w-full flex-col items-center justify-center p-4 sm:p-6 md:p-8",
        className
      )}
      {...props}
    >
      <div className={cn("w-full flex flex-col items-center", maxWidthStyles[maxWidth])}>
        {stageTitle ? (
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-text-main">
              {stageTitle}
            </h1>
            {stageSubtitle ? (
              <p className="mt-1.5 text-sm sm:text-base text-text-secondary">
                {stageSubtitle}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </main>
  );
}
