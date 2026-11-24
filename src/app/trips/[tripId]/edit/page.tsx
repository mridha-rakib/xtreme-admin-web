"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { TripForm } from "@/features/trips/TripForm";
import { tripRepository } from "@/lib/mock/trips";
import type { Trip } from "@/types/trip";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditTripPage() {
  const params = useParams();
  const tripId = params?.tripId as string;
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);

  useEffect(() => {
    if (!tripId) return;
    const t = tripRepository.getTripById(tripId);
    setTrip(t || null);
  }, [tripId]);

  if (trip === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading trip details...</div>
      </CommandCenterShell>
    );
  }

  if (trip === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Trip Container Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              No trip record exists for identifier &ldquo;{tripId}&rdquo;.
            </p>
            <Link
              href="/trips"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Trips List
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  return (
    <CommandCenterShell>
      <TripForm initialTrip={trip} mode="edit" />
    </CommandCenterShell>
  );
}
