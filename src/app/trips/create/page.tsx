"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { TripForm } from "@/features/trips/TripForm";
import React from "react";

export default function CreateTripPage() {
  return (
    <CommandCenterShell>
      <TripForm mode="create" />
    </CommandCenterShell>
  );
}
