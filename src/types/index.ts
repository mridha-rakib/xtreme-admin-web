export type CommandCenterRole = "SUPER_ADMIN" | "ADMIN" | "CONCIERGE" | "VENDOR";

export type CommandCenterPermission =
  | "view:dashboard"
  | "manage:customers"
  | "view:customers"
  | "manage:bookings"
  | "view:bookings"
  | "manage:trips"
  | "view:trips"
  | "manage:concierge"
  | "view:concierge"
  | "manage:vendors"
  | "view:vendors"
  | "manage:assets"
  | "view:assets"
  | "manage:finance"
  | "view:finance"
  | "manage:users"
  | "manage:system";

export const COMMAND_CENTER_ROLE_PERMISSIONS: Record<
  CommandCenterRole,
  readonly CommandCenterPermission[]
> = {
  SUPER_ADMIN: [
    "view:dashboard",
    "manage:customers",
    "view:customers",
    "manage:bookings",
    "view:bookings",
    "manage:trips",
    "view:trips",
    "manage:concierge",
    "view:concierge",
    "manage:vendors",
    "view:vendors",
    "manage:assets",
    "view:assets",
    "manage:finance",
    "view:finance",
    "manage:users",
    "manage:system",
  ],
  ADMIN: [
    "view:dashboard",
    "manage:customers",
    "view:customers",
    "manage:bookings",
    "view:bookings",
    "manage:trips",
    "view:trips",
    "manage:concierge",
    "view:concierge",
    "manage:vendors",
    "view:vendors",
    "manage:assets",
    "view:assets",
    "view:finance",
  ],
  CONCIERGE: [
    "view:dashboard",
    "view:customers",
    "manage:bookings",
    "view:bookings",
    "manage:trips",
    "view:trips",
    "manage:concierge",
    "view:concierge",
    "view:assets",
  ],
  VENDOR: ["view:dashboard", "view:bookings", "view:trips", "view:assets"],
} as const;

export function hasCommandCenterPermission(
  role: CommandCenterRole | undefined | null,
  permission: CommandCenterPermission,
): boolean {
  if (!role) return false;
  const permissions = COMMAND_CENTER_ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export interface CommandCenterUser {
  id: string;
  name: string;
  email: string;
  role: CommandCenterRole;
  avatarUrl?: string;
  department?: string;
  vendorId?: string;
}

export interface AuthorizedActor {
  id?: string;
  name?: string;
  email?: string;
  role: CommandCenterRole;
  vendorId?: string;
}

export interface CommandCenterSession {
  user: CommandCenterUser | null;
  isAuthenticated: boolean;
  status: "loading" | "authenticated" | "unauthenticated";
}

export interface CommandCenterNavItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  requiredPermission: CommandCenterPermission;
  badge?: string | number;
  section: "main" | "management" | "system";
}

export * from "./customer";
export * from "./booking";
export * from "./payment";
export * from "./trip";
export * from "./concierge";
export * from "./vendor";
export * from "./asset";
export * from "./availability";
export * from "./pricing";
