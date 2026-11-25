"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { CatalogNavigationTabs } from "@/features/catalog/CatalogNavigationTabs";
import { useSession } from "@/lib/auth/session";
import { catalogRepository } from "@/lib/mock/catalog";
import type { CatalogCategory } from "@/types";
import React, { useEffect, useState } from "react";

export default function CatalogDirectoryPage() {
  const { user } = useSession();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [parentFilter, setParentFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [languageFilter, setLanguageFilter] = useState<"ALL" | "en" | "fr">("ALL");
  const [sortOption, setSortOption] = useState<"order" | "name" | "updated">("order");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Scope Notices
  const [addCategoryNoticeOpen, setAddCategoryNoticeOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null);

  useEffect(() => {
    const loadCategories = () => {
      const activeParam = statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE";
      const data = catalogRepository.listCategories({
        parentId: parentFilter,
        active: activeParam,
        language: languageFilter,
        sort: sortOption,
        search: searchQuery.trim() || undefined,
      });
      setCategories(data);
    };

    loadCategories();
    const unsubscribe = catalogRepository.subscribe(loadCategories);
    return () => unsubscribe();
  }, [parentFilter, statusFilter, languageFilter, sortOption, searchQuery]);

  const handleToggleActive = (catId: string, currentActive: boolean) => {
    if (!user) return;
    try {
      catalogRepository.toggleCategoryActive(user, catId, !currentActive);
    } catch {
      // Ignore or log
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="90:3740"
        data-name="CC-CAT-01__Catalog__Ready"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-tight leading-[36px]"
              data-node-id="90:3745"
            >
              Catalog
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Manage service categories, subcategories, and localized offerings
            </p>
          </div>

          <Button
            onClick={() => setAddCategoryNoticeOpen(true)}
            className="h-[44px] px-5 bg-[#0B0C0E] hover:bg-[#17191D] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            + Add Category
          </Button>
        </div>

        {/* Catalog Navigation Tabs */}
        <CatalogNavigationTabs />

        {/* Filters Toolbar */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 shadow-sm mb-6 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search category, slug, or French translation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[38px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] placeholder-[#8C8F97] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            <div className="w-full md:w-[180px]">
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="w-full h-[38px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-xs font-medium text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Parents</option>
                <option value="ROOT">Root Categories Only</option>
                <option value="cat_aviation">Aviation &amp; Air Charter</option>
                <option value="cat_yacht">Marine &amp; Yachting</option>
              </select>
            </div>

            <div className="w-full md:w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-[38px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-xs font-medium text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="w-full md:w-[150px]">
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value as "ALL" | "en" | "fr")}
                className="w-full h-[38px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-xs font-medium text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Languages</option>
                <option value="en">English (EN)</option>
                <option value="fr">French (FR)</option>
              </select>
            </div>

            <div className="w-full md:w-[160px]">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as "order" | "name" | "updated")}
                className="w-full h-[38px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-xs font-medium text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="order">Sort: Order (1-9)</option>
                <option value="name">Sort: Alphabetical</option>
                <option value="updated">Sort: Recently Updated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#DDD8CF] bg-[#FAF8F4] text-[#5B616B] text-[12px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Parent Level</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Localized Name</th>
                  <th className="py-3 px-4 text-center">Sort</th>
                  <th className="py-3 px-4 text-center">Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF] text-[#0B0C0E]">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#5B616B]">
                      No categories found matching current filters.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {cat.parentId ? (
                            <span className="text-[#8C8F97] font-mono pl-3">└─</span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-[#164D53]" />
                          )}
                          <div>
                            <span className="font-semibold text-[#0B0C0E]">{cat.name}</span>
                            <span className="text-[11px] text-[#5B616B] block">
                              {cat.serviceCount} active service{cat.serviceCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {cat.parentName ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF8F4] border border-[#DDD8CF] text-[#5B616B]">
                            {cat.parentName}
                          </span>
                        ) : (
                          <span className="font-semibold text-[#164D53]">Root Category</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#5B616B]">/{cat.slug}</td>
                      <td className="py-3.5 px-4 text-xs">
                        <div>
                          <span className="font-medium text-[#0B0C0E]">
                            {cat.localizedNames.en}
                          </span>
                          <span className="text-[#8C8F97] block italic">
                            FR: {cat.localizedNames.fr}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs">{cat.sortOrder}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat.id, cat.active)}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
                            cat.active
                              ? "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5] hover:bg-[#D1FADF]"
                              : "bg-[#F2F4F7] text-[#5B616B] border-[#D0D5DD] hover:bg-[#EAECF0]"
                          }`}
                        >
                          {cat.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedCategory(cat)}
                          className="h-[32px] px-3 text-xs font-semibold border border-[#DDD8CF] rounded-md hover:bg-[#FAF8F4]"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-xs text-[#8C8F97] flex items-center justify-between">
          <span>
            Strict Scope Boundary: CC-CAT-01 provides catalog taxonomy audit and visibility.
            Category mutations (CC-CAT-02) are scheduled for a future planned phase.
          </span>
          <span>Showing {categories.length} categories</span>
        </div>

        {/* Scope Boundary Notice Modal: + Add Category */}
        {addCategoryNoticeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DDD8CF]">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDD8CF] mb-4">
                <h3 className="text-base font-bold text-[#0B0C0E]">Add Category Scope Notice</h3>
                <button
                  type="button"
                  onClick={() => setAddCategoryNoticeOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="p-3.5 bg-[#FAF8F4] border border-[#DDD8CF] rounded-lg text-xs text-[#5B616B] space-y-2 mb-5">
                <p>
                  <strong>Phase 4.9 Scope Confirmation:</strong>
                </p>
                <p>
                  Category creation, multi-level hierarchy manipulation, and localized editing forms
                  (Screen CC-CAT-02) are strictly reserved for a subsequent catalog management
                  phase.
                </p>
                <p>Current delivery strictly covers exactly 45/64 screens (Batch 9).</p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setAddCategoryNoticeOpen(false)}
                  className="h-[38px] px-5 bg-[#0B0C0E] text-white text-xs font-semibold rounded-lg"
                >
                  Understood
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Category Detail Modal */}
        {selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#DDD8CF]">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDD8CF] mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0B0C0E]">{selectedCategory.name}</h3>
                  <span className="font-mono text-xs text-[#5B616B]">
                    ID: {selectedCategory.id} · /{selectedCategory.slug}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-bold text-[#5B616B] block uppercase tracking-wider mb-1">
                    Description
                  </span>
                  <p className="text-[#0B0C0E] bg-[#FAF8F4] p-3 rounded-lg border border-[#DDD8CF]">
                    {selectedCategory.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-[#5B616B] block uppercase tracking-wider mb-1">
                      English Localized
                    </span>
                    <span className="text-[#0B0C0E] font-medium block">
                      {selectedCategory.localizedNames.en}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-[#5B616B] block uppercase tracking-wider mb-1">
                      French Localized
                    </span>
                    <span className="text-[#0B0C0E] font-medium block">
                      {selectedCategory.localizedNames.fr}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#DDD8CF]">
                  <div>
                    <span className="text-[#5B616B] block">Parent Level:</span>
                    <span className="font-semibold text-[#0B0C0E]">
                      {selectedCategory.parentName || "Root Top-Level"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5B616B] block">Sort Priority:</span>
                    <span className="font-mono font-semibold text-[#0B0C0E]">
                      {selectedCategory.sortOrder}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF8F4] border border-[#DDD8CF] rounded-lg text-[11px] text-[#5B616B]">
                  <strong>Scope Notice:</strong> Category editing (CC-CAT-02) is scheduled for a
                  future planned release.
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setSelectedCategory(null)}
                  className="h-[36px] px-4 bg-[#0B0C0E] text-white text-xs font-semibold rounded-lg"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CommandCenterShell>
  );
}
