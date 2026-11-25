"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth/session";
import { serviceCustomFieldRepository } from "@/lib/mock/service-custom-fields";
import { serviceRepository } from "@/lib/mock/services";
import type { CatalogService, ServiceCustomField } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSession();
  const serviceId = typeof params?.serviceId === "string" ? params.serviceId : "";

  const [service, setService] = useState<CatalogService | null>(null);
  const [fields, setFields] = useState<ServiceCustomField[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!serviceId) return;

    const load = () => {
      const s = serviceRepository.getServiceById(serviceId);
      if (!s) {
        setNotFound(true);
        return;
      }
      setService(s);
      const customFields = serviceCustomFieldRepository.listFieldsByService(s.id);
      setFields(customFields);
    };

    load();
    const unsubService = serviceRepository.subscribe(load);
    const unsubFields = serviceCustomFieldRepository.subscribe(load);
    return () => {
      unsubService();
      unsubFields();
    };
  }, [serviceId]);

  const handleToggleActive = () => {
    if (!user || !service) return;
    try {
      const updated = serviceRepository.toggleServiceActive(user, service.id, !service.active);
      setService(updated);
    } catch (err) {
      console.error("Failed to toggle service active:", err);
    }
  };

  if (notFound) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-4xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold text-[#0B0C0E]">Service Not Found</h2>
          <p className="text-sm text-[#5B616B] mt-2">
            The service &ldquo;{serviceId}&rdquo; does not exist or has been removed from the
            catalog.
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
        <div className="p-8 text-center text-[#5B616B]">Loading service details...</div>
      </CommandCenterShell>
    );
  }

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="90:3942"
        data-name="CC-CAT-03__ServiceDetail__Ready"
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
          <span className="font-semibold text-[#0B0C0E]">{service.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-[28px] font-bold text-[#0B0C0E] tracking-tight leading-[36px]"
                data-node-id="90:3945"
              >
                {service.name}
              </h1>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  service.active
                    ? "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]"
                    : "bg-[#F2F4F7] text-[#5B616B] border-[#D0D5DD]"
                }`}
              >
                {service.active ? "Active" : "Inactive"}
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
                {service.template.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs font-mono text-[#8C8F97] mt-1">
              ID: {service.id} · Slug: {service.slug} · Version: v{service.version}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href={`/catalog/services/${service.id}/custom-fields`}>
              <Button
                variant="secondary"
                className="h-[40px] px-4 text-xs font-semibold border border-[#DDD8CF] rounded-xl hover:bg-[#FAF8F4]"
              >
                Manage Custom Fields ({fields.length})
              </Button>
            </Link>
            <Link href={`/catalog/services/${service.id}/edit`}>
              <Button
                variant="secondary"
                className="h-[40px] px-4 text-xs font-semibold border border-[#DDD8CF] rounded-xl hover:bg-[#FAF8F4]"
              >
                Edit Service
              </Button>
            </Link>
            <button
              type="button"
              onClick={handleToggleActive}
              className={`h-[40px] px-4 text-xs font-semibold rounded-xl border transition-colors ${
                service.active
                  ? "border-[#FDA29B] text-[#B42318] hover:bg-[#FEF3F2]"
                  : "border-[#A6F4C5] text-[#027A48] hover:bg-[#ECFDF3]"
              }`}
            >
              {service.active ? "Deactivate Service" : "Activate Service"}
            </button>
          </div>
        </div>

        {/* Configuration Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Service Specs */}
          <div className="lg:col-span-2 bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#0B0C0E]">Service Configuration</h2>
              <p className="text-xs text-[#5B616B] mt-0.5">
                Core execution template, availability constraints, and booking governance
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#DDD8CF]">
                <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider block">
                  Category
                </span>
                <span className="font-semibold text-[#0B0C0E] mt-1 block">
                  {service.categoryName}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#DDD8CF]">
                <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider block">
                  Template
                </span>
                <span className="font-semibold text-[#0B0C0E] mt-1 block">
                  {service.template.replace(/_/g, " ")}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#DDD8CF]">
                <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider block">
                  Booking Mode
                </span>
                <span className="font-semibold text-[#0B0C0E] mt-1 block">
                  {service.bookingMode.replace(/_/g, " ")}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#DDD8CF]">
                <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider block">
                  Availability Model
                </span>
                <span className="font-semibold text-[#0B0C0E] mt-1 block">
                  {service.availabilityModel.replace(/_/g, " ")}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#DDD8CF]">
                <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider block">
                  Payment Mode
                </span>
                <span className="font-semibold text-[#0B0C0E] mt-1 block">
                  {service.paymentMode.replace(/_/g, " ")}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#DDD8CF]">
                <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider block">
                  Custom Field Definitions
                </span>
                <span className="font-semibold text-[#0B0C0E] mt-1 block">
                  {fields.length} dynamic fields configured
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#DDD8CF]">
              <div>
                <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider block mb-1">
                  English Description
                </span>
                <p className="text-sm text-[#0B0C0E] bg-[#FAF8F4] p-3 rounded-lg border border-[#DDD8CF]">
                  {service.localizedDescriptions?.en || service.description || "—"}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#5B616B] uppercase tracking-wider block mb-1">
                  French Description
                </span>
                <p className="text-sm text-[#0B0C0E] bg-[#FAF8F4] p-3 rounded-lg border border-[#DDD8CF]">
                  {service.localizedDescriptions?.fr || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Side Context & Metadata Card */}
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#0B0C0E]">Fulfillment Governance</h2>
              <p className="text-xs text-[#5B616B] mt-0.5">
                Lifecycle audit trail and customer quote configuration
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#DDD8CF]">
                <span className="text-[#5B616B]">Record Version</span>
                <span className="font-semibold font-mono text-[#0B0C0E]">v{service.version}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#DDD8CF]">
                <span className="text-[#5B616B]">Created Timestamp</span>
                <span className="font-medium text-[#0B0C0E]">
                  {new Date(service.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#DDD8CF]">
                <span className="text-[#5B616B]">Last Modified</span>
                <span className="font-medium text-[#0B0C0E]">
                  {new Date(service.updatedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#DDD8CF]">
                <span className="text-[#5B616B]">Quote Engine Sync</span>
                <span className="font-semibold text-[#027A48]">Authoritative Active</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DDD8CF] space-y-2">
              <Link href={`/catalog/services/${service.id}/custom-fields`} className="block">
                <Button className="w-full h-[38px] text-xs font-semibold bg-[#0B0C0E] hover:bg-[#17191D] text-white rounded-lg">
                  Configure Booking Fields →
                </Button>
              </Link>
              <Link href="/catalog/services" className="block">
                <Button
                  variant="secondary"
                  className="w-full h-[38px] text-xs font-semibold border border-[#DDD8CF] rounded-lg hover:bg-[#FAF8F4]"
                >
                  ← Back to Services
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Attached Custom Fields Preview Card */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B0C0E]">
                Booking Custom Fields ({fields.length})
              </h2>
              <p className="text-xs text-[#5B616B] mt-0.5">
                Dynamic fields rendered on client reservation forms and operational dispatch
                manifests
              </p>
            </div>
            <Link href={`/catalog/services/${service.id}/custom-fields/create`}>
              <Button className="h-[34px] px-3 text-xs font-semibold bg-[#0B0C0E] hover:bg-[#17191D] text-white rounded-lg">
                + Add Custom Field
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DDD8CF] bg-[#FAF8F4] text-[#5B616B] uppercase font-semibold">
                  <th className="py-2.5 px-3">Field Key</th>
                  <th className="py-2.5 px-3">Label (EN)</th>
                  <th className="py-2.5 px-3">Data Type</th>
                  <th className="py-2.5 px-3">Usage</th>
                  <th className="py-2.5 px-3">Required</th>
                  <th className="py-2.5 px-3">Customer Visible</th>
                  <th className="py-2.5 px-3">Active</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF] text-[#0B0C0E]">
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#5B616B]">
                      No custom fields configured for this service yet.
                    </td>
                  </tr>
                ) : (
                  fields.map((f) => (
                    <tr key={f.id} className="hover:bg-[#FAF8F4]">
                      <td className="py-2.5 px-3 font-mono font-medium">{f.fieldKey}</td>
                      <td className="py-2.5 px-3 font-semibold">{f.label}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#5B616B]">
                        {f.dataType}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[11px]">{f.usage}</td>
                      <td className="py-2.5 px-3">
                        {f.required ? (
                          <span className="text-[#B42318] font-semibold">Yes</span>
                        ) : (
                          <span className="text-[#8C8F97]">No</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {f.customerVisible ? (
                          <span className="text-[#027A48]">Visible</span>
                        ) : (
                          <span className="text-[#8C8F97]">Hidden</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            f.active ? "bg-[#ECFDF3] text-[#027A48]" : "bg-[#F2F4F7] text-[#5B616B]"
                          }`}
                        >
                          {f.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/catalog/services/${service.id}/custom-fields/${f.id}/edit`}
                          className="font-semibold text-[#164D53] hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CommandCenterShell>
  );
}
