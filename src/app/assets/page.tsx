"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { assetRepository } from "@/lib/mock/assets";
import type { Asset, AssetStatus } from "@/types/asset";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function AssetsListPage() {
  const { user } = useSession();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "ALL">("ALL");

  useEffect(() => {
    const loadAssets = () => {
      // Vendor isolation: When authenticated as VENDOR, strictly filter by vendorId
      const vendorId = user?.role === "VENDOR" ? user.vendorId : undefined;
      const filtered = assetRepository.listAssets({
        vendorId,
        status: statusFilter,
        search,
      });
      setAssets(filtered);
    };

    loadAssets();
    const unsubscribe = assetRepository.subscribe(loadAssets);
    return () => unsubscribe();
  }, [user, search, statusFilter]);

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[12px] font-semibold bg-[#DEF7EC] text-[#03543F]">
            ACTIVE
          </span>
        );
      case "MAINTENANCE":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[12px] font-semibold bg-[#FEF08A] text-[#854D0E]">
            MAINTENANCE
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[12px] font-semibold bg-[#F3F4F6] text-[#4B5563]">
            INACTIVE
          </span>
        );
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="86:2147"
        data-name="CC-AST-01__Admin__Ready"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="86:2186"
            >
              Assets List
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-AST-01 (Node 86:2147) · Fleet &amp; Physical Asset Inventory
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/assets/create"
              className="h-[48px] min-w-[240px] px-[24px] bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#17191D] inline-flex items-center justify-center transition-colors shadow-sm"
              data-node-id="86:2187"
            >
              Create asset
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-4 shadow-card mb-[20px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px] max-w-[480px] relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets by name, code, category, or destination..."
              className="w-full h-[40px] pl-3.5 pr-8 bg-white border border-[#DDD8CF] rounded-[8px] text-[13px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-[#5B616B] hover:text-[#0B0C0E] text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#5B616B] font-medium">Status:</span>
            <div className="inline-flex rounded-[8px] border border-[#DDD8CF] p-0.5 bg-[#FAF8F4]">
              {(["ALL", "ACTIVE", "MAINTENANCE", "INACTIVE"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors ${
                    statusFilter === st
                      ? "bg-white text-[#0B0C0E] shadow-sm"
                      : "text-[#5B616B] hover:text-[#0B0C0E]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assets Table (Figma Node 86:2189) */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card mb-[16px]"
          data-node-id="86:2189"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="bg-[#EEE9E0] border-b border-[#DDD8CF] text-[#5B616B] text-[13px] font-semibold"
                  data-node-id="86:2190"
                >
                  <th className="py-3.5 px-6" data-node-id="86:2191">
                    Display name
                  </th>
                  <th className="py-3.5 px-6" data-node-id="86:2192">
                    Owner
                  </th>
                  <th className="py-3.5 px-6" data-node-id="86:2193">
                    Destination
                  </th>
                  <th className="py-3.5 px-6" data-node-id="86:2194">
                    Code
                  </th>
                  <th className="py-3.5 px-6" data-node-id="86:2195">
                    Capacity
                  </th>
                  <th className="py-3.5 px-6" data-node-id="86:2196">
                    Status
                  </th>
                  <th className="py-3.5 px-6 text-right" data-node-id="86:2197">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF]">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#5B616B] text-[14px]">
                      No assets found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-4 px-6">
                        <div className="text-[14px] font-semibold text-[#0B0C0E]">{asset.name}</div>
                        <div className="text-[12px] text-[#5B616B]">{asset.category}</div>
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#0B0C0E]">
                        {asset.ownerType === "XTREME" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0E7FF] text-[#3730A3]">
                            XTREME Fleet
                          </span>
                        ) : (
                          <span className="text-[13px] text-[#0B0C0E] font-medium">
                            {asset.vendorName || "Vendor"}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#5B616B]">{asset.destination}</td>
                      <td className="py-4 px-6 text-[14px] font-mono font-medium text-[#0B0C0E]">
                        {asset.code}
                      </td>
                      <td className="py-4 px-6 text-[14px] text-[#0B0C0E] font-medium">
                        {asset.capacity} pax
                      </td>
                      <td className="py-4 px-6 text-[14px]">{getStatusBadge(asset.status)}</td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="text-[#164D53] hover:text-[#0B0C0E] font-semibold text-[14px] inline-flex items-center gap-1"
                          data-node-id="86:2205"
                        >
                          View ›
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footnote (Figma Node 86:2254) */}
        <p className="text-[12px] text-[#5B616B]" data-node-id="86:2254">
          Vendor sees own assets; Admin/Super Admin remain permission/scoped.
        </p>
      </div>
    </CommandCenterShell>
  );
}
