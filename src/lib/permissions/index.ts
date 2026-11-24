import {
  type CommandCenterNavItem,
  type CommandCenterRole,
  hasCommandCenterPermission,
} from "@/types";

export const COMMAND_CENTER_NAV_ITEMS: readonly CommandCenterNavItem[] = [
  // Main Operational Group
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    iconName: "home",
    requiredPermission: "view:dashboard",
    section: "main",
  },
  {
    id: "bookings",
    label: "Bookings",
    href: "/bookings",
    iconName: "calendar",
    requiredPermission: "view:bookings",
    badge: "12",
    section: "main",
  },
  {
    id: "trips",
    label: "Trips & Itineraries",
    href: "/trips",
    iconName: "plane",
    requiredPermission: "view:trips",
    section: "main",
  },
  {
    id: "concierge",
    label: "Concierge Desk",
    href: "/concierge",
    iconName: "cloche",
    requiredPermission: "view:concierge",
    badge: "5",
    section: "main",
  },

  // Management Group
  {
    id: "customers",
    label: "Customer Directory",
    href: "/customers",
    iconName: "user",
    requiredPermission: "view:customers",
    section: "management",
  },
  {
    id: "vendors",
    label: "Vendors & Partners",
    href: "/vendors",
    iconName: "store",
    requiredPermission: "view:vendors",
    section: "management",
  },
  {
    id: "assets",
    label: "Fleet & Asset Pool",
    href: "/assets",
    iconName: "layers",
    requiredPermission: "view:assets",
    section: "management",
  },
  {
    id: "finance",
    label: "Financial Ledger",
    href: "/finance",
    iconName: "tag",
    requiredPermission: "view:finance",
    section: "management",
  },

  // System & Governance Group
  {
    id: "iam",
    label: "Access Governance",
    href: "/iam",
    iconName: "shield",
    requiredPermission: "manage:users",
    section: "system",
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    href: "/audit-logs",
    iconName: "clipboard",
    requiredPermission: "manage:system",
    section: "system",
  },
] as const;

export function getVisibleNavItems(
  role: CommandCenterRole | null | undefined,
): CommandCenterNavItem[] {
  if (!role) return [];
  return COMMAND_CENTER_NAV_ITEMS.filter((item) =>
    hasCommandCenterPermission(role, item.requiredPermission),
  );
}
