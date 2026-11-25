"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { CatalogNavigationTabs } from "@/features/catalog/CatalogNavigationTabs";
import { useSession } from "@/lib/auth/session";
import { catalogRepository } from "@/lib/mock/catalog";
import { serviceRepository } from "@/lib/mock/services";
import type { CatalogCategory, CatalogService, ServiceBookingMode, ServiceTemplate } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function ServicesListPage() {
  const { user } = useSession();
  const [services, setServices] = useState<CatalogService[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [templateFilter, setTemplateFilter] = useState<string>("ALL");
  const [bookingModeFilter, setBookingModeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    const loadData = () => {
      setCategories(catalogRepository.listCategories());
      const data = serviceRepository.listServices({
        search: searchQuery.trim() || undefined,
        categoryId: categoryFilter !== "ALL" ? categoryFilter : undefined,
        template: templateFilter !== "ALL" ? (templateFilter as ServiceTemplate) : undefined,
        bookingMode:
          bookingModeFilter !== "ALL" ? (bookingModeFilter as ServiceBookingMode) : undefined,
        active: statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE",
      });
      setServices(data);
    };

    loadData();
    const unsubServices = serviceRepository.subscribe(loadData);
    const unsubCats = catalogRepository.subscribe(loadData);
    return () => {
      unsubServices();
      unsubCats();
    };
  }, [searchQuery, categoryFilter, templateFilter, bookingModeFilter, statusFilter]);

  const handleToggleActive = (serviceId: string, currentActive: boolean) => {
    if (!user) return;
    try {
      serviceRepository.toggleServiceActive(user, serviceId, !currentActive);
    } catch (err) {
      console.error("Failed to toggle service active state:", err);
    }
  };

  const getTemplateBadge = (tpl: ServiceTemplate) => {
    switch (tpl) {
      case "AIR_CHARTER":
        return "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]";
      case "YACHT_CHARTER":
        return "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]";
      case "CHAUFFEUR_TRANSFER":
        return "bg-[#F9F5FF] text-[#6941C6] border-[#E9D7FE]";
      case "FINE_DINING":
        return "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]";
      case "SECURITY_DETAIL":
        return "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]";
      default:
        return "bg-[#F2F4F7] text-[#344054] border-[#D0D5DD]";
    }
  };

  const getBookingModeBadge = (mode: ServiceBookingMode) => {
    switch (mode) {
      case "INSTANT_CONFIRMATION":
        return "bg-[#ECFDF3] text-[#027A48]";
      case "QUOTE_REQUIRED":
        return "bg-[#EFF8FF] text-[#175CD3]";
      case "MANUAL_APPROVAL":
        return "bg-[#FFFAEB] text-[#B54708]";
      default:
        return "bg-[#F2F4F7] text-[#344054]";
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="90:3840"
        data-name="CC-CAT-02__ServicesList__Ready"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-tight leading-[36px]"
              data-node-id="90:3845"
            >
              Services
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Manage luxury concierge services, execution templates, and custom booking field
              configurations
            </p>
          </div>

          <Link href="/catalog/services/create">
            <Button className="h-[44px] px-5 bg-[#0B0C0E] hover:bg-[#17191D] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
              + Create Service
            </Button>
          </Link>
        </div>

        {/* Catalog Navigation Tabs */}
        <CatalogNavigationTabs />

        {/* UI-API-03 Notice */}
        <div className="mb-6 p-4 rounded-xl bg-[#EFF8FF] border border-[#B2DDFF] flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#175CD3] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
            i
          </div>
          <div className="text-sm text-[#1E40AF]">
            <div className="font-semibold text-[#1E3A8A]">
              UI-API-03 Reconciliation Notice: Operational Fulfillment Pipeline
            </div>
            <p className="mt-0.5 text-[#1E40AF] leading-relaxed">
              Catalog services are synchronized with operational fulfillment pipelines. Category
              assignments, execution templates, and service activation states immediately reflect
              across customer reservation workflows and quote generation engines.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 shadow-sm mb-6 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search service name, slug, category, or French description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[38px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] placeholder-[#8C8F97] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            <div className="w-full md:w-[180px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-[38px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-xs font-medium text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-[160px]">
              <select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                className="w-full h-[38px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-xs font-medium text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Templates</option>
                <option value="AIR_CHARTER">AIR CHARTER</option>
                <option value="YACHT_CHARTER">YACHT CHARTER</option>
                <option value="CHAUFFEUR_TRANSFER">CHAUFFEUR</option>
                <option value="FINE_DINING">FINE DINING</option>
                <option value="SECURITY_DETAIL">SECURITY</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>

            <div className="w-full md:w-[160px]">
              <select
                value={bookingModeFilter}
                onChange={(e) => setBookingModeFilter(e.target.value)}
                className="w-full h-[38px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-xs font-medium text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Booking Modes</option>
                <option value="INSTANT_CONFIRMATION">Instant Confirmation</option>
                <option value="QUOTE_REQUIRED">Quote Required</option>
                <option value="MANUAL_APPROVAL">Manual Approval</option>
              </select>
            </div>

            <div className="w-full md:w-[120px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-[38px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-xs font-medium text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#DDD8CF] bg-[#FAF8F4] text-[#5B616B] text-[12px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Template</th>
                  <th className="py-3.5 px-4">Booking Mode</th>
                  <th className="py-3.5 px-4">Custom Fields</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF] text-[#0B0C0E]">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#5B616B]">
                      No catalog services found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  services.map((srv) => (
                    <tr key={srv.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/catalog/services/${srv.id}`}
                          className="font-semibold text-[#0B0C0E] hover:underline"
                        >
                          {srv.name}
                        </Link>
                        <div className="text-xs font-mono text-[#8C8F97]">{srv.slug}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#5B616B]">
                        {srv.categoryName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTemplateBadge(
                            srv.template,
                          )}`}
                        >
                          {srv.template.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getBookingModeBadge(
                            srv.bookingMode,
                          )}`}
                        >
                          {srv.bookingMode.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/catalog/services/${srv.id}/custom-fields`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#164D53] hover:underline"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#EBF5F5] flex items-center justify-center text-[11px]">
                            {srv.customFieldCount}
                          </span>
                          <span>fields</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            srv.active
                              ? "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]"
                              : "bg-[#F2F4F7] text-[#5B616B] border-[#D0D5DD]"
                          }`}
                        >
                          {srv.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link href={`/catalog/services/${srv.id}`}>
                            <Button
                              variant="secondary"
                              className="h-[30px] px-2.5 text-xs font-semibold border border-[#DDD8CF] rounded-md hover:bg-[#FAF8F4]"
                            >
                              View
                            </Button>
                          </Link>
                          <Link href={`/catalog/services/${srv.id}/edit`}>
                            <Button
                              variant="secondary"
                              className="h-[30px] px-2.5 text-xs font-semibold border border-[#DDD8CF] rounded-md hover:bg-[#FAF8F4]"
                            >
                              Edit
                            </Button>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(srv.id, srv.active)}
                            className={`h-[30px] px-2.5 text-xs font-semibold rounded-md border transition-colors ${
                              srv.active
                                ? "border-[#FDA29B] text-[#B42318] hover:bg-[#FEF3F2]"
                                : "border-[#A6F4C5] text-[#027A48] hover:bg-[#ECFDF3]"
                            }`}
                          >
                            {srv.active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-[#8C8F97] flex items-center justify-between">
          <span>
            Command Center Service Catalog Management · Reconciled with operational workflows
          </span>
          <span>Showing {services.length} services</span>
        </div>
      </div>
    </CommandCenterShell>
  );
}
