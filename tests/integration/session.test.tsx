import { SessionProvider, useSession } from "@/lib/auth/session";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

function SessionTestConsumer() {
  const { user, status, switchRole, signOut, signIn } = useSession();

  return (
    <div>
      <span data-testid="user-name">{user?.name}</span>
      <span data-testid="user-role">{user?.role}</span>
      <span data-testid="session-status">{status}</span>
      <button type="button" onClick={() => switchRole("CONCIERGE")}>
        Switch to Concierge
      </button>
      <button type="button" onClick={() => switchRole("VENDOR")}>
        Switch to Vendor
      </button>
      <button type="button" onClick={() => signOut()}>
        Sign Out
      </button>
      <button type="button" onClick={() => signIn("ADMIN")}>
        Sign In Admin
      </button>
    </div>
  );
}

describe("Session Context & Provider", () => {
  it("defaults to SUPER_ADMIN mock persona in development", () => {
    render(
      <SessionProvider>
        <SessionTestConsumer />
      </SessionProvider>,
    );

    expect(screen.getByTestId("user-name")).toHaveTextContent("Victoria Vance");
    expect(screen.getByTestId("user-role")).toHaveTextContent("SUPER_ADMIN");
    expect(screen.getByTestId("session-status")).toHaveTextContent("authenticated");
  });

  it("switches persona role and updates context values", () => {
    render(
      <SessionProvider>
        <SessionTestConsumer />
      </SessionProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Switch to Concierge" }));
    expect(screen.getByTestId("user-name")).toHaveTextContent("Elena Rostova");
    expect(screen.getByTestId("user-role")).toHaveTextContent("CONCIERGE");

    fireEvent.click(screen.getByRole("button", { name: "Switch to Vendor" }));
    expect(screen.getByTestId("user-name")).toHaveTextContent("Arman K.");
    expect(screen.getByTestId("user-role")).toHaveTextContent("VENDOR");
  });

  it("handles sign out and sign in transitions", () => {
    render(
      <SessionProvider>
        <SessionTestConsumer />
      </SessionProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));
    expect(screen.getByTestId("session-status")).toHaveTextContent("unauthenticated");
    expect(screen.getByTestId("user-name")).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole("button", { name: "Sign In Admin" }));
    expect(screen.getByTestId("session-status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("user-role")).toHaveTextContent("ADMIN");
  });

  it("throws error if useSession is called outside SessionProvider", () => {
    expect(() => renderHook(() => useSession())).toThrow(
      "useSession must be used within a SessionProvider",
    );
  });

  it("fails closed when mock personas are explicitly disabled", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_ENABLE_MOCK_PERSONAS;
    process.env.NEXT_PUBLIC_ENABLE_MOCK_PERSONAS = "false";
    localStorage.clear();

    try {
      const { result } = renderHook(() => useSession(), {
        wrapper: ({ children }) => <SessionProvider>{children}</SessionProvider>,
      });

      expect(result.current.user).toBeNull();
      expect(result.current.status).toBe("unauthenticated");
      expect(result.current.isAuthenticated).toBe(false);

      // Attempting mock sign in fails closed
      const res = await result.current.signIn({
        identifier: "victoria.vance@xtremeconcierge.internal",
        password: "xtreme2026",
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Mock authentication is disabled");
    } finally {
      process.env.NEXT_PUBLIC_ENABLE_MOCK_PERSONAS = originalEnv;
      localStorage.clear();
    }
  });
});
