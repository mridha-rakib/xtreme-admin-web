"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { assetRepository } from "@/lib/mock/assets";
import type { Asset, AssetStatus } from "@/types/asset";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AssetDetailPage() {
  const router = useRouter();
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
        <div className="p-8 text-center text-[#5B616B] text-[14px]">Loading asset details...</div>
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

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-[6px] text-[13px] font-semibold bg-[#DEF7EC] text-[#03543F]"
            data-node-id="86:2295"
          >
            ACTIVE
          </span>
        );
      case "MAINTENANCE":
        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-[6px] text-[13px] font-semibold bg-[#FEF08A] text-[#854D0E]"
            data-node-id="86:2295"
          >
            MAINTENANCE
          </span>
        );
      case "INACTIVE":
        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-[6px] text-[13px] font-semibold bg-[#F3F4F6] text-[#4B5563]"
            data-node-id="86:2295"
          >
            INACTIVE
          </span>
        );
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="86:2255"
        data-name="CC-AST-02__Admin__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/assets"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Assets
          </Link>
        </div>

        {/* Header (Figma Node 86:2294) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[20px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="86:2294"
            >
              Asset Detail
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Asset Record: {asset.name} ({asset.code})
            </p>
          </div>
        </div>

        {/* Status Badge (Figma Node 86:2295) */}
        <div className="mb-[24px]">{getStatusBadge(asset.status)}</div>

        {/* Grid Layout: Asset Card (620x330) and Operational Rule Card (420x330) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-[32px]">
          {/* Asset Card (Figma Node 86:2298) */}
          <div
            className="lg:col-span-7 bg-white border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card flex flex-col justify-between"
            data-node-id="86:2298"
          >
            <div>
              <h2
                className="text-[18px] font-bold text-[#0B0C0E] mb-[20px] pb-3 border-b border-[#DDD8CF]"
                data-node-id="86:2299"
              >
                Asset
              </h2>

              <dl className="space-y-4 text-[14px]">
                <div className="flex flex-col sm:flex-row sm:items-baseline">
                  <dt className="w-[180px] font-semibold text-[#5B616B]" data-node-id="86:2300">
                    Owner type
                  </dt>
                  <dd className="flex-1 font-medium text-[#0B0C0E]" data-node-id="86:2301">
                    {asset.ownerType === "XTREME" ? "XTREME Fleet" : "Vendor Organization"}
                  </dd>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline">
                  <dt className="w-[180px] font-semibold text-[#5B616B]" data-node-id="86:2302">
                    Vendor
                  </dt>
                  <dd className="flex-1 font-medium text-[#0B0C0E]" data-node-id="86:2303">
                    {asset.vendorName || "XTREME Managed (Where permitted)"}
                  </dd>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline">
                  <dt className="w-[180px] font-semibold text-[#5B616B]" data-node-id="86:2304">
                    Destination
                  </dt>
                  <dd className="flex-1 font-medium text-[#0B0C0E]" data-node-id="86:2305">
                    {asset.destination}
                  </dd>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline">
                  <dt className="w-[180px] font-semibold text-[#5B616B]" data-node-id="86:2306">
                    Internal code
                  </dt>
                  <dd
                    className="flex-1 font-mono font-medium text-[#0B0C0E]"
                    data-node-id="86:2307"
                  >
                    {asset.code}
                  </dd>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline">
                  <dt className="w-[180px] font-semibold text-[#5B616B]" data-node-id="86:2308">
                    Display name
                  </dt>
                  <dd className="flex-1 font-semibold text-[#0B0C0E]" data-node-id="86:2309">
                    {asset.name} ({asset.category})
                  </dd>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline">
                  <dt className="w-[180px] font-semibold text-[#5B616B]" data-node-id="86:2310">
                    Capacity
                  </dt>
                  <dd className="flex-1 font-medium text-[#0B0C0E]" data-node-id="86:2311">
                    {asset.capacity} passengers / configured capacity
                  </dd>
                </div>
              </dl>
            </div>

            {asset.description && (
              <div className="mt-6 pt-4 border-t border-[#DDD8CF] text-[13px] text-[#5B616B]">
                <span className="font-semibold text-[#0B0C0E]">Notes: </span>
                {asset.description}
              </div>
            )}
          </div>

          {/* Operational Rule Card (Figma Node 86:2312) */}
          <div
            className="lg:col-span-5 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[12px] p-[24px] shadow-card flex flex-col justify-start space-y-[20px]"
            data-node-id="86:2312"
          >
            <h2
              className="text-[18px] font-bold text-[#0B0C0E] pb-3 border-b border-[#DDD8CF]"
              data-node-id="86:2313"
            >
              Operational rule
            </h2>

            <div className="p-4 bg-white border border-[#DDD8CF] rounded-[8px] space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[#854D0E] font-bold text-base leading-none mt-0.5">⚠️</span>
                <p
                  className="text-[14px] font-medium text-[#0B0C0E] leading-[22px]"
                  data-node-id="86:2314"
                >
                  Status change to MAINTENANCE/INACTIVE blocks new allocations.
                </p>
              </div>
            </div>

            <div className="p-4 bg-white border border-[#DDD8CF] rounded-[8px] space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[#03543F] font-bold text-base leading-none mt-0.5">🛡️</span>
                <p
                  className="text-[14px] font-medium text-[#0B0C0E] leading-[22px]"
                  data-node-id="86:2315"
                >
                  Existing confirmed commitments remain and require explicit Operations resolution;
                  they are never silently cancelled.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons (Figma Nodes 86:2316 & 86:2318) */}
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/assets/${asset.id}/edit`}
            className="h-[48px] min-w-[180px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] transition-colors inline-flex items-center justify-center shadow-sm"
            data-node-id="86:2316"
          >
            Edit asset
          </Link>
          <button
            type="button"
            onClick={() => router.push("/assets")}
            className="h-[48px] min-w-[210px] px-[24px] bg-white border border-[#DDD8CF] text-[#0B0C0E] text-[14px] font-semibold rounded-[12px] hover:bg-[#FAF8F4] transition-colors inline-flex items-center justify-center shadow-sm"
            data-node-id="86:2318"
          >
            Back to Assets
          </button>
        </div>
      </div>
    </CommandCenterShell>
  );
}
