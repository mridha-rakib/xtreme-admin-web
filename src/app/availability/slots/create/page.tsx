import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { AvailabilitySlotForm } from "@/features/availability/AvailabilitySlotForm";
import React from "react";

export default function CreateAvailabilitySlotPage() {
  return (
    <CommandCenterShell>
      <AvailabilitySlotForm isEdit={false} />
    </CommandCenterShell>
  );
}
