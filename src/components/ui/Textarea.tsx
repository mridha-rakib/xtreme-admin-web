import { cn } from "@/lib/utils";
import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-brand-slate uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            "flex w-full rounded-md border border-brand-line bg-surface-card px-3 py-2 text-sm text-brand-onyx placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-state-danger",
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
Textarea.displayName = "Textarea";
