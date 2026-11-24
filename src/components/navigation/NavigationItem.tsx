import { cn } from "@/lib/utils";
import type { CommandCenterNavItem } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export interface NavigationItemProps {
  item: CommandCenterNavItem;
  isActive: boolean;
  onClick?: () => void;
}

export function NavigationItem({ item, isActive, onClick }: NavigationItemProps) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between h-9 px-3 rounded-md text-xs font-semibold transition-all group select-none",
        isActive
          ? "bg-brand-graphite text-white font-medium"
          : "text-brand-slate hover:bg-brand-carbon hover:text-white",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "w-4 h-4 flex items-center justify-center opacity-80 group-hover:opacity-100",
            isActive && "opacity-100 text-brand-gold",
          )}
        >
          <Image
            src={`/icons/${item.iconName}.svg`}
            alt=""
            width={16}
            height={16}
            className="invert opacity-80 brightness-200"
          />
        </span>
        <span>{item.label}</span>
      </div>

      {item.badge !== undefined && (
        <span
          className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-bold",
            isActive
              ? "bg-brand-gold text-brand-onyx"
              : "bg-brand-carbon text-brand-slate group-hover:bg-brand-graphite group-hover:text-white",
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
