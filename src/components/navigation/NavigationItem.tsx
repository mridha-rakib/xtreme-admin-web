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
        "relative flex items-center h-[36px] w-[208px] rounded-[8px] transition-colors select-none group",
        isActive ? "bg-[#24272D] text-white" : "text-white/80 hover:bg-[#17191D] hover:text-white",
      )}
    >
      <div className="absolute left-[12px] top-[7.5px] w-[21px] h-[21px] flex items-center justify-center">
        <Image
          src={`/icons/${item.iconName}.svg`}
          alt=""
          width={18}
          height={18}
          className={cn(
            "brightness-200 invert transition-opacity",
            isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100",
          )}
        />
      </div>
      <span className="absolute left-[46px] top-[9px] text-[13px] font-semibold tracking-[0.15px] leading-[18px]">
        {item.label}
      </span>
      {item.badge !== undefined && (
        <span className="absolute right-[12px] top-[8px] px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#17191D] text-white/70">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
