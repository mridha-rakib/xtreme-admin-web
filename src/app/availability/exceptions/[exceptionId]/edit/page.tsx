"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { AvailabilityExceptionForm } from "@/features/availability/AvailabilityExceptionForm";
import { useSession } from "@/lib/auth/session";
import { availabilityExceptionRepository } from "@/lib/mock/availability-exceptions";
import type { AvailabilityException } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditAvailabilityExceptionPage() {
  const params = useParams();
  const exceptionId = params?.exceptionId as string;
  const { user } = useSession();

  const [exception, setException] = useState<AvailabilityException | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !exceptionId) return;

    try {
      const found = availabilityExceptionRepository.getExceptionById(user, exceptionId);
      if (found) {
        setException(found);
      } else {
        setError(`Availability exception "${exceptionId}" was not found or access is restricted.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load exception.");
    } finally {
      setLoading(false);
    }
  }, [user, exceptionId]);

  if (loading) {
    return (
      <CommandCenterShell>
        <div className="p-8 text-[#5B616B]">Loading exception details...</div>
      </CommandCenterShell>
    );
  }

  if (error || !exception) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-xl">
          <div className="p-4 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl text-[#B42318] mb-4 text-sm">
            {error || "Exception not found."}
          </div>
          <Link
            href="/availability/exceptions"
            className="inline-flex px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-lg hover:bg-[#17191D]"
          >
            ← Back to Availability Exceptions
          </Link>
        </div>
      </CommandCenterShell>
    );
  }

  return (
    <CommandCenterShell>
      <AvailabilityExceptionForm initialException={exception} isEdit={true} />
    </CommandCenterShell>
  );
}
