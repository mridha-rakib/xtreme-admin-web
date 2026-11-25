import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { AvailabilityExceptionForm } from "@/features/availability/AvailabilityExceptionForm";
import React from "react";

export default function CreateAvailabilityExceptionPage() {
  return (
    <CommandCenterShell>
      <AvailabilityExceptionForm isEdit={false} />
    </CommandCenterShell>
  );
}
