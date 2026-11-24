import { cn } from "@/lib/utils";
import React from "react";

export interface StatusBadgeProps {
  status: "success" | "warning" | "danger" | "info" | "neutral";
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const styles = {
    success: "bg-state-successBg text-state-success border-state-success/20",
    warning: "bg-state-warningBg text-state-warning border-state-warning/20",
    danger: "bg-state-dangerBg text-state-danger border-state-danger/20",
    info: "bg-state-infoBg text-state-info border-state-info/20",
    neutral: "bg-surface-subtle text-brand-slate border-brand-line",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-semibold border",
        styles[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
