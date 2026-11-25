"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { CustomFieldForm } from "@/features/catalog/CustomFieldForm";
import { serviceCustomFieldRepository } from "@/lib/mock/service-custom-fields";
import { serviceRepository } from "@/lib/mock/services";
import type { CatalogService, ServiceCustomField } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditCustomFieldPage() {
  const params = useParams();
  const serviceId = typeof params?.serviceId === "string" ? params.serviceId : "";
  const fieldId = typeof params?.fieldId === "string" ? params.fieldId : "";

  const [service, setService] = useState<CatalogService | null>(null);
  const [field, setField] = useState<ServiceCustomField | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!serviceId || !fieldId) return;

    const s = serviceRepository.getServiceById(serviceId);
    const f = serviceCustomFieldRepository.getFieldById(fieldId);

    if (!s || !f || f.serviceId !== s.id) {
      setNotFound(true);
      return;
    }

    setService(s);
    setField(f);
  }, [serviceId, fieldId]);

  if (notFound) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-4xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold text-[#0B0C0E]">Custom Field Not Found</h2>
          <p className="text-sm text-[#5B616B] mt-2">
            The requested custom field &ldquo;{fieldId}&rdquo; was not found on service &ldquo;
            {serviceId}&rdquo;.
          </p>
          <div className="mt-6">
            <Link href={`/catalog/services/${serviceId}/custom-fields`}>
              <Button className="bg-[#0B0C0E] text-white">Back to Custom Fields</Button>
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  if (!service || !field) {
    return (
      <CommandCenterShell>
        <div className="p-8 text-center text-[#5B616B]">Loading field details...</div>
      </CommandCenterShell>
    );
  }

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1000px] w-full"
        data-node-id="90:4222"
        data-name="CC-CAT-06__EditCustomField__Ready"
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
          <Link href={`/catalog/services/${service.id}/custom-fields`} className="hover:underline">
            Custom Fields
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#0B0C0E]">{field.fieldKey}</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-[28px] font-bold text-[#0B0C0E] tracking-tight leading-[36px]"
            data-node-id="90:4225"
          >
            Edit Custom Field: {field.label}
          </h1>
          <p className="text-[14px] text-[#5B616B] mt-[4px]">
            Modify field key, localization, usage, and validation rules for {service.name}
          </p>
        </div>

        <CustomFieldForm serviceId={service.id} initialData={field} isEdit={true} />
      </div>
    </CommandCenterShell>
  );
}
