import type { Metadata } from "next";
import "@/styles/globals.css";
import { SessionProvider } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "XTREME Concierge — Admin Command Center",
  description:
    "Administrative command center for VIP concierge operations, fleet management and dispatch",
  icons: {
    icon: "/icons/shield.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-canvas text-brand-onyx antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
