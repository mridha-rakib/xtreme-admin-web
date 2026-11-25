"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { AvailabilityRuleForm } from "@/features/availability/AvailabilityRuleForm";
import { useSession } from "@/lib/auth/session";
import { availabilityRepository } from "@/lib/mock/availability";
import type { AvailabilityRule } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditAvailabilityRulePage() {
  const params = useParams();
  const ruleId = params?.ruleId as string;
  const { user } = useSession();

  const [rule, setRule] = useState<AvailabilityRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !ruleId) return;

    try {
      const found = availabilityRepository.getRuleById(user, ruleId);
      if (found) {
        setRule(found);
      } else {
        setError(`Availability rule "${ruleId}" was not found or access is restricted.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load rule.");
    } finally {
      setLoading(false);
    }
  }, [user, ruleId]);

  if (loading) {
    return (
      <CommandCenterShell>
        <div className="p-8 text-[#5B616B]">Loading availability rule details...</div>
      </CommandCenterShell>
    );
  }

  if (error || !rule) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-xl">
          <div className="p-4 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl text-[#B42318] mb-4 text-sm">
            {error || "Rule not found."}
          </div>
          <Link
            href="/availability"
            className="inline-flex px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-lg hover:bg-[#17191D]"
          >
            ← Back to Availability Rules
          </Link>
        </div>
      </CommandCenterShell>
    );
  }

  return (
    <CommandCenterShell>
      <AvailabilityRuleForm initialRule={rule} isEdit={true} />
    </CommandCenterShell>
  );
}
