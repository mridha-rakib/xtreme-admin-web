import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

export interface BrandLogoProps {
  className?: string;
  variant?: "dark" | "light";
  height?: number;
}

export function BrandLogo({ className, variant = "dark", height = 28 }: BrandLogoProps) {
  // Uses authoritative Figma brand asset
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/branding/logo-sidebar-dark.png"
        alt="XTREME Concierge"
        width={130}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  );
}
