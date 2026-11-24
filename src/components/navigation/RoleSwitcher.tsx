"use client";

import { useSession } from "@/lib/auth/session";
import type { CommandCenterRole } from "@/types";
import React from "react";

const ROLES: Array<{ role: CommandCenterRole; label: string; desc: string }> = [
  { role: "SUPER_ADMIN", label: "Super Admin", desc: "Full root access & IAM" },
  { role: "ADMIN", label: "Operations Admin", desc: "Commercial & fleet ops" },
  { role: "CONCIERGE", label: "Concierge Lead", desc: "Guest desk & bookings" },
  { role: "VENDOR", label: "Partner Vendor", desc: "Scoped assets & orders" },
];

export function RoleSwitcher() {
  const { user, switchRole } = useSession();

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="role-select"
        className="text-[11px] font-semibold text-brand-slate uppercase tracking-wider hidden sm:inline"
      >
        Persona:
      </label>
      <select
        id="role-select"
        value={user?.role || "SUPER_ADMIN"}
        onChange={(e) => switchRole(e.target.value as CommandCenterRole)}
        className="h-8 rounded-md border border-brand-line bg-surface-card px-2 text-xs font-semibold text-brand-onyx focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
        aria-label="Switch administrative role persona"
      >
        {ROLES.map((r) => (
          <option key={r.role} value={r.role}>
            {r.label} ({r.role})
          </option>
        ))}
      </select>
    </div>
  );
}
