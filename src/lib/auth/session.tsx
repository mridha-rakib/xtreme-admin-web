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

export const VENDOR_B_PERSONA: CommandCenterUser = {
  id: "usr_vendor_02",
  name: "Claire Delacroix",
  email: "charters@cotedazur-marine.internal",
  role: "VENDOR",
  department: "Riviera Maritime Ops",
  vendorId: "vnd_azure_01",
};

export interface SignInCredentials {
  identifier: string;
  password?: string;
  role?: CommandCenterRole;
}

export interface SignInResult {
  success: boolean;
  error?: string;
}

/**
 * Validates whether mock authentication and mock personas are permitted.
 * Strictly requires explicit development, test, or QA environment and explicit flag.
 * Fails closed in production or unverified/unknown environments.
 */
export function isMockAuthAllowed(): boolean {
  if (process.env.NODE_ENV === "test") {
    // In automated unit/integration tests, allow mock personas unless explicitly disabled
    return process.env.NEXT_PUBLIC_ENABLE_MOCK_PERSONAS !== "false";
  }

  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  const enableMock = process.env.NEXT_PUBLIC_ENABLE_MOCK_PERSONAS;

  // In production or unknown environments, strictly fail closed
  const isPermittedEnv = appEnv === "development" || appEnv === "qa";
  return isPermittedEnv && enableMock === "true";
}

interface SessionContextType extends CommandCenterSession {
  switchRole: (role: CommandCenterRole) => void;
  switchUser: (user: CommandCenterUser) => void;
  signIn: (credentials?: SignInCredentials | CommandCenterRole) => Promise<SignInResult>;
  signOut: () => void;
  isQAMode: boolean;
  setQAMode: (enabled: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CommandCenterUser | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("xtreme_session_user");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    // Fail closed in production and unknown environments
    if (!isMockAuthAllowed()) {
      return null;
    }
    return MOCK_PERSONAS.SUPER_ADMIN;
  });

  const [status, setStatus] = useState<CommandCenterSession["status"]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("xtreme_session_user");
      if (stored) return "authenticated";
    }
    if (!isMockAuthAllowed()) {
      return "unauthenticated";
    }
    return "authenticated";
  });

  const [isQAMode, setQAMode] = useState<boolean>(true);

  const switchRole = (role: CommandCenterRole) => {
    if (!isMockAuthAllowed()) {
      return;
    }
    const targetUser = MOCK_PERSONAS[role];
    if (targetUser) {
      setCurrentUser(targetUser);
      setStatus("authenticated");
      if (typeof window !== "undefined") {
        localStorage.setItem("xtreme_session_user", JSON.stringify(targetUser));
      }
    }
  };

  const switchUser = (targetUser: CommandCenterUser) => {
    if (!isMockAuthAllowed()) {
      return;
    }
    setCurrentUser(targetUser);
    setStatus("authenticated");
    if (typeof window !== "undefined") {
      localStorage.setItem("xtreme_session_user", JSON.stringify(targetUser));
    }
  };

  const signIn = async (
    credentials?: SignInCredentials | CommandCenterRole,
  ): Promise<SignInResult> => {
    // Fail-closed enforcement for production/unknown environments
    if (!isMockAuthAllowed()) {
      return {
        success: false,
        error:
          "Mock authentication is disabled in this environment. Production authentication required.",
      };
    }

    // If passed directly as a role string (from dev switcher or tests)
    if (typeof credentials === "string") {
      switchRole(credentials);
      return { success: true };
    }

    if (!credentials) {
      switchRole("SUPER_ADMIN");
      return { success: true };
    }

    const { identifier, password, role } = credentials;

    if (!identifier || !identifier.trim()) {
      return { success: false, error: "Identifier is required." };
    }

    if (!password || !password.trim()) {
      return { success: false, error: "Password is required." };
    }

    // Check for suspended account test case
    const cleanId = identifier.trim().toLowerCase();
    if (cleanId.includes("suspended")) {
      return {
        success: false,
        error: "Account is suspended. Contact operations director.",
      };
    }

    // Check password validity (mock standard: allow xtreme2026, admin123, or any non-empty test password except "wrong" or "invalid")
    if (password === "wrong" || password === "invalid" || password.length < 4) {
      return { success: false, error: "Invalid credentials provided." };
    }

    // Determine role based on identifier or explicit role
    let resolvedRole: CommandCenterRole = role || "SUPER_ADMIN";
    if (cleanId.includes("concierge")) {
      resolvedRole = "CONCIERGE";
    } else if (cleanId.includes("vendor") || cleanId.includes("aerojet")) {
      resolvedRole = "VENDOR";
    } else if (cleanId.includes("operations") || cleanId.includes("admin@")) {
      resolvedRole = "ADMIN";
    }

    const userToSet = MOCK_PERSONAS[resolvedRole];
    const fullUser = {
      ...userToSet,
      email: cleanId.includes("@") ? cleanId : userToSet.email,
    };
    setCurrentUser(fullUser);
    setStatus("authenticated");
    if (typeof window !== "undefined") {
      localStorage.setItem("xtreme_session_user", JSON.stringify(fullUser));
    }

    return { success: true };
  };

  const signOut = () => {
    setCurrentUser(null);
    setStatus("unauthenticated");
    if (typeof window !== "undefined") {
      localStorage.removeItem("xtreme_session_user");
    }
  };

  return (
    <SessionContext.Provider
      value={{
        user: currentUser,
        isAuthenticated: status === "authenticated" && currentUser !== null,
        status,
        switchRole,
        switchUser,
        signIn,
        signOut,
        isQAMode,
        setQAMode,
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
