"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { AssetForm } from "@/features/assets/AssetForm";
import { useSession } from "@/lib/auth/session";
import { assetRepository } from "@/lib/mock/assets";
import type { Asset } from "@/types/asset";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditAssetPage() {
  const params = useParams();
  const assetId = typeof params?.assetId === "string" ? params.assetId : "";
  const { user } = useSession();

  const [asset, setAsset] = useState<Asset | null | undefined>(undefined);

  useEffect(() => {
    if (!assetId || !user) {
      if (!user) setAsset(undefined);
      else setAsset(null);
      return;
    }

    const loadAsset = () => {
      try {
        const found = assetRepository.getAssetById(user, assetId);
        setAsset(found || null);
      } catch {
        setAsset(null);
      }
    };

    loadAsset();
    const unsubscribe = assetRepository.subscribe(loadAsset);
    return () => unsubscribe();
  }, [assetId, user]);

  if (asset === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-8 text-center text-[#5B616B] text-[14px]">Loading asset...</div>
      </CommandCenterShell>
    );
  }

  if (asset === null) {
    return (
      <CommandCenterShell>
        <div className="p-8 text-center text-[#DC2626] text-[14px]">
          Asset with ID &quot;{assetId}&quot; was not found or is outside your organization scope.
          <div className="mt-4">
            <Link href="/assets" className="text-[#164D53] font-semibold underline text-sm">
              ← Back to Assets
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  return <AssetForm initialData={asset} mode="edit" assetId={assetId} />;
}
