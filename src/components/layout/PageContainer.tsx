import { cn } from "@/lib/utils";
import type React from "react";

export interface PageContainerProps {
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({
  title,
  description,
  badge,
  actions,
  children,
  className,
}: PageContainerProps) {
  return (
    <div className={cn("p-6 max-w-7xl mx-auto space-y-6", className)}>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-brand-line/60">
          <div>
            <div className="flex items-center gap-2.5">
              {title && (
                <h1 className="text-xl font-bold tracking-tight text-brand-onyx">{title}</h1>
              )}
              {badge}
            </div>
            {description && <p className="text-xs text-brand-slate mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
