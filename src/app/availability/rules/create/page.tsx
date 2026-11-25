import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { AvailabilityRuleForm } from "@/features/availability/AvailabilityRuleForm";
import React from "react";

export default function CreateAvailabilityRulePage() {
  return (
    <CommandCenterShell>
      <AvailabilityRuleForm isEdit={false} />
    </CommandCenterShell>
  );
}
