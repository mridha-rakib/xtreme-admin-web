import { cn } from "@/lib/utils";
import type React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Card({ className, title, subtitle, action, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-brand-line bg-surface-card p-6 shadow-card transition-shadow",
        className,
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between border-b border-brand-line/60 pb-3">
          <div>
            {title && <h3 className="text-base font-semibold text-brand-onyx">{title}</h3>}
            {subtitle && <p className="text-xs text-brand-slate mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
