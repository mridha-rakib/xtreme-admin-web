import { cn } from "@/lib/utils";
import React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "md",
      type = "button",
      children,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent cursor-pointer";

    const variantStyles = {
      primary: "bg-brand-onyx text-white hover:bg-brand-carbon",
      secondary:
        "bg-surface-subtle text-brand-onyx hover:bg-surface-muted border border-brand-line",
      outline: "border border-brand-line text-brand-onyx hover:bg-surface-subtle",
      ghost: "text-brand-slate hover:text-brand-onyx hover:bg-surface-subtle",
    };

    const sizeStyles = {
      sm: "h-8 w-8 text-xs",
      md: "h-9 w-9 text-sm",
      lg: "h-10 w-10 text-base",
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
