"use client";

import { Button, Card, Input } from "@/components/ui";
import { BrandLogo } from "@/components/ui/BrandLogo";
import Link from "next/link";
import React from "react";

export default function SignInPlaceholderPage() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-surface-canvas p-4">
      <Card className="w-full max-w-sm p-6 shadow-modal">
        <div className="flex flex-col items-center mb-6">
          <BrandLogo height={32} />
          <h2 className="text-base font-bold text-brand-onyx mt-4">Command Center Sign In</h2>
          <p className="text-xs text-brand-slate text-center mt-1">
            Access to administrative operations is restricted to authorized credentials.
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <Input label="Email address" type="email" placeholder="name@xtremeconcierge.internal" />
          <Input label="Access token or password" type="password" placeholder="••••••••••••" />
          <Button variant="primary" className="w-full">
            Sign In
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-brand-line/60 text-center">
          <Link href="/" className="text-xs font-semibold text-brand-accent hover:underline">
            ← Return to Foundation Overview
          </Link>
        </div>
      </Card>
    </div>
  );
}
