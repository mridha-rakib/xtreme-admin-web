import { cn } from "@/lib/utils";
import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-brand-slate uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-md border border-brand-line bg-surface-card px-3 py-1.5 text-sm text-brand-onyx placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-state-danger focus-visible:ring-state-danger",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-state-danger">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-brand-slate">{helperText}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
