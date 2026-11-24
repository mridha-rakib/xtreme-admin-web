import { cn } from "@/lib/utils";
import React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex items-start gap-2.5">
        <input
          id={inputId}
          ref={ref}
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-brand-line text-brand-onyx focus:ring-brand-accent cursor-pointer mt-0.5",
            className,
          )}
          {...props}
        />
        {(label || description) && (
          <label htmlFor={inputId} className="cursor-pointer select-none">
            {label && <span className="block text-sm font-medium text-brand-onyx">{label}</span>}
            {description && <span className="block text-xs text-brand-slate">{description}</span>}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";
