"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { AvailabilitySlotForm } from "@/features/availability/AvailabilitySlotForm";
import { useSession } from "@/lib/auth/session";
import { availabilitySlotRepository } from "@/lib/mock/availability-slots";
import type { AvailabilitySlot } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditAvailabilitySlotPage() {
  const params = useParams();
  const slotId = params?.slotId as string;
  const { user } = useSession();

  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !slotId) return;

    try {
      const found = availabilitySlotRepository.getSlotById(user, slotId);
      if (found) {
        setSlot(found);
      } else {
        setError(`Availability slot "${slotId}" was not found or access is restricted.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load slot.");
    } finally {
      setLoading(false);
    }
  }, [user, slotId]);

  if (loading) {
    return (
      <CommandCenterShell>
        <div className="p-8 text-[#5B616B]">Loading availability slot details...</div>
      </CommandCenterShell>
    );
  }

  if (error || !slot) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-xl">
          <div className="p-4 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl text-[#B42318] mb-4 text-sm">
            {error || "Slot not found."}
          </div>
          <Link
            href="/availability/slots"
            className="inline-flex px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-lg hover:bg-[#17191D]"
          >
            ← Back to Availability Slots
          </Link>
        </div>
      </CommandCenterShell>
    );
  }

  return (
    <CommandCenterShell>
      <AvailabilitySlotForm initialSlot={slot} isEdit={true} />
    </CommandCenterShell>
  );
}
