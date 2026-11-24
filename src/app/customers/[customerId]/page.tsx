"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { customerRepository } from "@/lib/mock/customers";
import type { Customer } from "@/types/customer";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params?.customerId as string;

  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);

  useEffect(() => {
    if (!customerId) return;
    const resolved = customerRepository.getCustomerById(customerId);
    setCustomer(resolved || null);

    const unsubscribe = customerRepository.subscribe(() => {
      const updated = customerRepository.getCustomerById(customerId);
      setCustomer(updated || null);
    });

    return () => unsubscribe();
  }, [customerId]);

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1200px] w-full"
        data-node-id="77:341"
        data-name="CC-CUS-02__Customer_Detail__Ready"
      >
        {/* Breadcrumb / Back Link */}
        <div className="mb-[16px]">
          <Link
            href="/customers"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Customer Directory
          </Link>
        </div>

        {/* Header */}
        <div className="mb-[24px]">
          <h1
            className="text-[28px] font-bold leading-[36px] tracking-[-0.1px] text-[#0B0C0E]"
            data-node-id="77:380"
          >
            Customer Detail
          </h1>
          <p
            className="text-[20px] font-semibold leading-[28px] text-[#0B0C0E] mt-[4px]"
            data-node-id="77:381"
          >
            Basic profile data only
          </p>
        </div>

        {customer === undefined ? (
          <div className="py-[48px] text-center text-[#5B616B] text-[14px]">
            Resolving customer record...
          </div>
        ) : customer === null ? (
          <div className="p-[32px] bg-white border border-[#DDD8CF] rounded-[12px] text-center max-w-[520px]">
            <p className="text-[16px] font-bold text-[#0B0C0E] mb-1">Customer Not Found</p>
            <p className="text-[13px] text-[#5B616B] mb-4">
              No customer record matches identifier &ldquo;{customerId}&rdquo;.
            </p>
            <Link
              href="/customers"
              className="inline-flex px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md"
            >
              Return to Directory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[40px] items-start">
            {/* Left: Detail Rows & Edit Action */}
            <div className="space-y-[10px] max-w-[520px]">
              {/* Row 1: Name */}
              <div
                className="bg-white border border-[#DDD8CF] rounded-[10px] h-[58px] overflow-hidden flex items-center relative shadow-xs"
                data-node-id="77:382"
              >
                <div
                  className="bg-[#F3EBDD] h-full w-[225px] flex items-center px-[16px] gap-[12px] shrink-0"
                  data-node-id="3037:6782"
                >
                  <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <Image src="/figma-assets/imgDecorIconUser.svg" alt="" width={20} height={20} />
                  </div>
                  <span
                    className="text-[14px] font-semibold text-[#0B0C0E] tracking-[0.1px]"
                    data-node-id="77:383"
                  >
                    Name
                  </span>
                </div>
                <div
                  className="px-[24px] text-[14px] font-normal text-[#5B616B] truncate"
                  data-node-id="77:384"
                >
                  {customer.firstName} {customer.lastName}
                </div>
              </div>

              {/* Row 2: Email */}
              <div
                className="bg-white border border-[#DDD8CF] rounded-[10px] h-[58px] overflow-hidden flex items-center relative shadow-xs"
                data-node-id="77:385"
              >
                <div
                  className="bg-[#F3EBDD] h-full w-[225px] flex items-center px-[16px] gap-[12px] shrink-0"
                  data-node-id="3037:6786"
                >
                  <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <Image src="/figma-assets/imgDecorIconMail.svg" alt="" width={20} height={20} />
                  </div>
                  <span
                    className="text-[14px] font-semibold text-[#0B0C0E] tracking-[0.1px]"
                    data-node-id="77:386"
                  >
                    Email
                  </span>
                </div>
                <div
                  className="px-[24px] text-[14px] font-normal text-[#5B616B] truncate"
                  data-node-id="77:387"
                >
                  {customer.email}
                </div>
              </div>

              {/* Row 3: Phone */}
              <div
                className="bg-white border border-[#DDD8CF] rounded-[10px] h-[58px] overflow-hidden flex items-center relative shadow-xs"
                data-node-id="77:388"
              >
                <div
                  className="bg-[#F3EBDD] h-full w-[225px] flex items-center px-[16px] gap-[12px] shrink-0"
                  data-node-id="3037:6790"
                >
                  <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <Image
                      src="/figma-assets/imgDecorIconPhone.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </div>
                  <span
                    className="text-[14px] font-semibold text-[#0B0C0E] tracking-[0.1px]"
                    data-node-id="77:389"
                  >
                    Phone
                  </span>
                </div>
                <div
                  className="px-[24px] text-[14px] font-normal text-[#5B616B] truncate"
                  data-node-id="77:390"
                >
                  {customer.phone}
                </div>
              </div>

              {/* Row 4: Verification */}
              <div
                className="bg-white border border-[#DDD8CF] rounded-[10px] h-[58px] overflow-hidden flex items-center relative shadow-xs"
                data-node-id="77:391"
              >
                <div
                  className="bg-[#F3EBDD] h-full w-[225px] flex items-center px-[16px] gap-[12px] shrink-0"
                  data-node-id="3037:6793"
                >
                  <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <Image
                      src="/figma-assets/imgDecorIconShield.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </div>
                  <span
                    className="text-[14px] font-semibold text-[#0B0C0E] tracking-[0.1px]"
                    data-node-id="77:392"
                  >
                    Verification
                  </span>
                </div>
                <div className="px-[24px]" data-node-id="3037:6794">
                  <span
                    className="inline-flex items-center justify-center h-[34px] w-[118px] bg-[#E5F4E3] rounded-[16px] text-[14px] font-semibold text-[#226E35]"
                    data-node-id="77:393"
                  >
                    {customer.verificationStatus}
                  </span>
                </div>
              </div>

              {/* Row 5: Preferred Language */}
              <div
                className="bg-white border border-[#DDD8CF] rounded-[10px] h-[58px] overflow-hidden flex items-center relative shadow-xs"
                data-node-id="77:394"
              >
                <div
                  className="bg-[#F3EBDD] h-full w-[225px] flex items-center px-[16px] gap-[12px] shrink-0"
                  data-node-id="3037:6798"
                >
                  <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <Image
                      src="/figma-assets/imgDecorIconGlobe.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </div>
                  <span
                    className="text-[14px] font-semibold text-[#0B0C0E] tracking-[0.1px]"
                    data-node-id="77:395"
                  >
                    Preferred language
                  </span>
                </div>
                <div
                  className="px-[24px] text-[14px] font-normal text-[#5B616B] truncate"
                  data-node-id="77:396"
                >
                  {customer.preferredLanguage}
                </div>
              </div>

              {/* Action Button: Edit basic profile */}
              <div className="pt-[24px]">
                <Link
                  href={`/customers/${customer.id}/edit`}
                  className="w-[220px] h-[48px] bg-[#0B0C0E] hover:bg-[#17191D] border-[1.3px] border-[#B48737] rounded-[12px] text-white text-[14px] font-semibold tracking-[0.1px] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  data-node-id="77:397"
                  data-name="Button/Primary"
                >
                  Edit basic profile
                </Link>
              </div>
            </div>

            {/* Right: Scope Guard Card */}
            <div
              className="bg-[#F1E7D2] rounded-[12px] p-[24px] w-full max-w-[520px] shadow-xs"
              data-node-id="77:399"
              data-name="Frame"
            >
              <div className="flex items-center gap-[12px] mb-[12px]">
                <div className="w-[24px] h-[24px] flex items-center justify-center">
                  <Image src="/figma-assets/imgDecorIconShield.svg" alt="" width={22} height={22} />
                </div>
                <h3
                  className="text-[18px] font-semibold leading-[26px] text-[#0B0C0E]"
                  data-node-id="77:400"
                >
                  Scope guard
                </h3>
              </div>
              <p
                className="text-[14px] font-normal leading-[22px] text-[#5B616B]"
                data-node-id="77:401"
              >
                No create/delete controls and no phone verification, password or recovery controls.
                Only the approved Customer admin projection is shown.
              </p>
            </div>
          </div>
        )}
      </div>
    </CommandCenterShell>
  );
}
