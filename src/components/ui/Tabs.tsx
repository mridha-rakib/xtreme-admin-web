import { cn } from "@/lib/utils";
import React from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("border-b border-brand-line flex gap-6", className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative flex items-center gap-2",
              isActive ? "text-brand-onyx font-semibold" : "text-brand-slate hover:text-brand-onyx",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-xs",
                  isActive ? "bg-brand-onyx text-white" : "bg-surface-subtle text-brand-slate",
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
