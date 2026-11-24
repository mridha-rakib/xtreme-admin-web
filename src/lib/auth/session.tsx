"use client";

import type { CommandCenterRole, CommandCenterSession, CommandCenterUser } from "@/types";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export const MOCK_PERSONAS: Record<CommandCenterRole, CommandCenterUser> = {
  SUPER_ADMIN: {
    id: "usr_super_01",
    name: "Victoria Vance",
    email: "victoria.vance@xtremeconcierge.internal",
    role: "SUPER_ADMIN",
    department: "Executive Command",
  },
  ADMIN: {
    id: "usr_admin_01",
    name: "Marcus Reynolds",
    email: "marcus.reynolds@xtremeconcierge.internal",
    role: "ADMIN",
    department: "Operations & Fleet",
  },
  CONCIERGE: {
    id: "usr_concierge_01",
    name: "Elena Rostova",
    email: "elena.rostova@xtremeconcierge.internal",
    role: "CONCIERGE",
    department: "VIP Guest Experience",
  },
  VENDOR: {
    id: "usr_vendor_01",
    name: "Arman K.",
    email: "ops@aerojet-partners.internal",
    role: "VENDOR",
    department: "AeroJet Aviation Ops",
    vendorId: "vnd_aerojet_99",
  },
};

interface SessionContextType extends CommandCenterSession {
  switchRole: (role: CommandCenterRole) => void;
  signIn: (role?: CommandCenterRole) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CommandCenterUser | null>(
    MOCK_PERSONAS.SUPER_ADMIN,
  );
  const [status, setStatus] = useState<CommandCenterSession["status"]>("authenticated");

  // In production builds, verify fail-closed authorization behavior
  useEffect(() => {
    const isProduction = process.env.NODE_ENV === "production";
    const allowMock = process.env.NEXT_PUBLIC_ENABLE_MOCK_PERSONAS !== "false";

    if (isProduction && !allowMock) {
      // In strict production mode without mock personas enabled, default to unauthenticated
      setCurrentUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const switchRole = (role: CommandCenterRole) => {
    const targetUser = MOCK_PERSONAS[role];
    if (targetUser) {
      setCurrentUser(targetUser);
      setStatus("authenticated");
    }
  };

  const signIn = (role: CommandCenterRole = "SUPER_ADMIN") => {
    switchRole(role);
  };

  const signOut = () => {
    setCurrentUser(null);
    setStatus("unauthenticated");
  };

  return (
    <SessionContext.Provider
      value={{
        user: currentUser,
        isAuthenticated: status === "authenticated" && currentUser !== null,
        status,
        switchRole,
        signIn,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
