"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { Button } from "@/components/ui/Button";
import { ServiceForm } from "@/features/catalog/ServiceForm";
import { serviceRepository } from "@/lib/mock/services";
import type { CatalogService } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditServicePage() {
  const params = useParams();
  const serviceId = typeof params?.serviceId === "string" ? params.serviceId : "";

  const [service, setService] = useState<CatalogService | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    const s = serviceRepository.getServiceById(serviceId);
    if (!s) {
      setNotFound(true);
      return;
    }
    setService(s);
  }, [serviceId]);

  if (notFound) {
    return (
      <CommandCenterShell>
        <div className="p-8 max-w-4xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold text-[#0B0C0E]">Service Not Found</h2>
          <p className="text-sm text-[#5B616B] mt-2">
            The service &ldquo;{serviceId}&rdquo; does not exist in the catalog.
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
        className="p-[32px] max-w-[1000px] w-full"
        data-node-id="90:4006"
        data-name="CC-CAT-04__EditService__Ready"
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
          <span className="font-semibold text-[#0B0C0E]">Edit</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-[28px] font-bold text-[#0B0C0E] tracking-tight leading-[36px]"
            data-node-id="90:4010"
          >
            Edit Service: {service.name}
          </h1>
          <p className="text-[14px] text-[#5B616B] mt-[4px]">
            Update service template, booking governance, and localization
          </p>
        </div>

        <ServiceForm initialData={service} isEdit={true} />
      </div>
    </CommandCenterShell>
  );
}
