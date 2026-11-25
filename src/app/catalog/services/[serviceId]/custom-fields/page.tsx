"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth/session";
import { serviceCustomFieldRepository } from "@/lib/mock/service-custom-fields";
import { serviceRepository } from "@/lib/mock/services";
import type {
  CatalogService,
  CustomFieldDataType,
  CustomFieldUsage,
  ServiceCustomField,
} from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function ServiceCustomFieldsPage() {
  const params = useParams();
  const { user } = useSession();
  const serviceId = typeof params?.serviceId === "string" ? params.serviceId : "";

  const [service, setService] = useState<CatalogService | null>(null);
  const [fields, setFields] = useState<ServiceCustomField[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [usageFilter, setUsageFilter] = useState<string>("ALL");
  const [dataTypeFilter, setDataTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!serviceId) return;

    const loadData = () => {
      const s = serviceRepository.getServiceById(serviceId);
      if (!s) {
        setNotFound(true);
        return;
      }
      setService(s);

      const data = serviceCustomFieldRepository.listFieldsByService(s.id, {
        search: searchQuery.trim() || undefined,
        usage: usageFilter !== "ALL" ? (usageFilter as CustomFieldUsage) : undefined,
        dataType: dataTypeFilter !== "ALL" ? (dataTypeFilter as CustomFieldDataType) : undefined,
        active: statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE",
      });
      setFields(data);
    };

    loadData();
    const unsubService = serviceRepository.subscribe(loadData);
    const unsubFields = serviceCustomFieldRepository.subscribe(loadData);
    return () => {
      unsubService();
      unsubFields();
    };
  }, [serviceId, searchQuery, usageFilter, dataTypeFilter, statusFilter]);

  const handleToggleActive = (fieldId: string, currentActive: boolean) => {
    if (!user) return;
    try {
      serviceCustomFieldRepository.toggleFieldActive(user, fieldId, !currentActive);
    } catch (err) {
      console.error("Failed to toggle custom field active:", err);
    }
  };

  if (notFound) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-4xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold text-[#0B0C0E]">Service Not Found</h2>
          <p className="text-sm text-[#5B616B] mt-2">
            The service &ldquo;{serviceId}&rdquo; was not found in the catalog.
          </p>
          <div className="mt-6">
            <Link href="/catalog/services">
              <Button className="bg-[#0B0C0E] text-white">Back to Services</Button>
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  if (!service) {
    return (
      <CommandCenterShell>
        <div className="p-8 text-center text-[#5B616B]">Loading custom fields...</div>
      </CommandCenterShell>
    );
  }

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="90:4104"
        data-name="CC-CAT-05__ServiceCustomFields__Ready"
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#5B616B] mb-4">
          <Link href="/catalog" className="hover:underline">
            Catalog
          </Link>
          <span>/</span>
          <Link href="/catalog/services" className="hover:underline">
            Services
          </Link>
          <span>/</span>
          <Link href={`/catalog/services/${service.id}`} className="hover:underline">
            {service.name}
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#0B0C0E]">Custom Fields</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-[28px] font-bold text-[#0B0C0E] tracking-tight leading-[36px]"
                data-node-id="90:4110"
              >
                Service Custom Fields
              </h1>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
                {service.name}
              </span>
            </div>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Configure dynamic form fields, operational requirements, and customer visibility rules
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/catalog/services/${service.id}`}>
              <Button
                variant="secondary"
                className="h-[44px] px-4 text-xs font-semibold border border-[#DDD8CF] rounded-xl hover:bg-[#FAF8F4]"
              >
                ← Back to Service Detail
              </Button>
            </Link>
            <Link href={`/catalog/services/${service.id}/custom-fields/create`}>
              <Button className="h-[44px] px-5 bg-[#0B0C0E] hover:bg-[#17191D] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                + Add Custom Field
              </Button>
            </Link>
          </div>
        </div>

        {/* UI-API-04 Notice */}
        <div className="mb-6 p-4 rounded-xl bg-[#EFF8FF] border border-[#B2DDFF] flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#175CD3] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
            i
          </div>
          <div className="text-sm text-[#1E40AF]">
            <div className="font-semibold text-[#1E3A8A]">
              UI-API-04 Reconciliation Notice: Historical Booking Preservation
            </div>
            <p className="mt-0.5 text-[#1E40AF] leading-relaxed">
              Dynamic custom fields are attached to service booking forms. Inactivating a field
              preserves historical booking values and answers while cleanly excluding it from new
              customer reservation flows.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 shadow-sm mb-6 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search field key, English label, or French label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[38px] px-3.5 bg-white border border-[#DDD8CF] rounded-lg text-sm text-[#0B0C0E] placeholder-[#8C8F97] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            <div className="w-full md:w-[180px]">
              <select
                value={usageFilter}
                onChange={(e) => setUsageFilter(e.target.value)}
                className="w-full h-[38px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-xs font-medium text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Usages</option>
                <option value="BOOKING_FORM">BOOKING FORM</option>
                <option value="INTERNAL_OPS">INTERNAL OPS</option>
                <option value="INVOICE">INVOICE</option>
              </select>
            </div>

            <div className="w-full md:w-[160px]">
              <select
                value={dataTypeFilter}
                onChange={(e) => setDataTypeFilter(e.target.value)}
                className="w-full h-[38px] px-3 bg-white border border-[#DDD8CF] rounded-lg text-xs font-medium text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              >
                <option value="ALL">All Data Types</option>
                <option value="TEXT">TEXT</option>
                <option value="NUMBER">NUMBER</option>
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="SELECT">SELECT</option>
                <option value="MULTI_SELECT">MULTI SELECT</option>
                <option value="DATE">DATE</option>
                <option value="DATETIME">DATETIME</option>
                <option value="TEXTAREA">TEXTAREA</option>
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

        {/* Table */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#DDD8CF] bg-[#FAF8F4] text-[#5B616B] text-[12px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Field Key</th>
                  <th className="py-3.5 px-4">Label (EN / FR)</th>
                  <th className="py-3.5 px-4">Usage</th>
                  <th className="py-3.5 px-4">Data Type</th>
                  <th className="py-3.5 px-4">Required</th>
                  <th className="py-3.5 px-4">Customer Visible</th>
                  <th className="py-3.5 px-4">Sort</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF] text-[#0B0C0E]">
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-[#5B616B]">
                      No custom fields found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  fields.map((f) => (
                    <tr key={f.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-xs text-[#0B0C0E]">
                        {f.fieldKey}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[#0B0C0E]">{f.label}</div>
                        <div className="text-xs text-[#5B616B] italic">
                          {f.localizedLabels?.fr || "—"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-[#FAF8F4] border border-[#DDD8CF] text-[#5B616B]">
                          {f.usage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#5B616B]">
                        {f.dataType}
                        {f.options && f.options.length > 0 && (
                          <div className="text-[11px] text-[#8C8F97] truncate max-w-[150px]">
                            ({f.options.join(", ")})
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        {f.required ? (
                          <span className="text-[#B42318]">Required</span>
                        ) : (
                          <span className="text-[#8C8F97]">Optional</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {f.customerVisible ? (
                          <span className="text-[#027A48] font-semibold">Customer Facing</span>
                        ) : (
                          <span className="text-[#5B616B]">Internal Only</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-[#5B616B]">
                        #{f.sortOrder}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            f.active
                              ? "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]"
                              : "bg-[#F2F4F7] text-[#5B616B] border-[#D0D5DD]"
                          }`}
                        >
                          {f.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link href={`/catalog/services/${service.id}/custom-fields/${f.id}/edit`}>
                            <Button
                              variant="secondary"
                              className="h-[30px] px-2.5 text-xs font-semibold border border-[#DDD8CF] rounded-md hover:bg-[#FAF8F4]"
                            >
                              Edit
                            </Button>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(f.id, f.active)}
                            className={`h-[30px] px-2.5 text-xs font-semibold rounded-md border transition-colors ${
                              f.active
                                ? "border-[#FDA29B] text-[#B42318] hover:bg-[#FEF3F2]"
                                : "border-[#A6F4C5] text-[#027A48] hover:bg-[#ECFDF3]"
                            }`}
                          >
                            {f.active ? "Deactivate" : "Activate"}
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
          <span>Dynamic Custom Field Repository · Linked to Service {service.name}</span>
          <span>Showing {fields.length} custom fields</span>
        </div>
      </div>
    </CommandCenterShell>
  );
}
