"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { customerRepository } from "@/lib/mock/customers";
import type { Customer } from "@/types/customer";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function EditCustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.customerId as string;

  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    const resolved = customerRepository.getCustomerById(customerId);
    if (resolved) {
      setCustomer(resolved);
      setFirstName(resolved.firstName);
      setLastName(resolved.lastName);
      setEmail(resolved.email);
      setPreferredLanguage(resolved.preferredLanguage);
    } else {
      setCustomer(null);
    }
  }, [customerId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMessage("First name, last name, and email are required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSaving(true);

    try {
      customerRepository.updateCustomerBasicProfile(customerId, {
        firstName,
        lastName,
        email,
        preferredLanguage,
      });
      // Redirect back to Customer Detail screen
      router.push(`/customers/${customerId}`);
    } catch (err: unknown) {
      setIsSaving(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to save customer profile.");
      }
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1200px] w-full"
        data-node-id="77:402"
        data-name="CC-CUS-03__Edit_Customer_Basic_Profile__Ready"
      >
        {/* Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href={`/customers/${customerId}`}
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Cancel and Return to Customer Detail
          </Link>
        </div>

        {/* Title */}
        <h1
          className="text-[28px] font-bold leading-[36px] tracking-[-0.1px] text-[#0B0C0E] mb-[28px]"
          data-node-id="77:441"
        >
          Edit Customer Basic Profile
        </h1>

        {customer === undefined ? (
          <div className="py-[48px] text-center text-[#5B616B] text-[14px]">
            Loading customer profile...
          </div>
        ) : customer === null ? (
          <div className="p-[32px] bg-white border border-[#DDD8CF] rounded-[12px] text-center max-w-[520px]">
            <p className="text-[16px] font-bold text-[#0B0C0E] mb-1">Customer Not Found</p>
            <p className="text-[13px] text-[#5B616B] mb-4">
              Unable to edit profile. No customer found for &ldquo;{customerId}&rdquo;.
            </p>
            <Link
              href="/customers"
              className="inline-flex px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md"
            >
              Return to Directory
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSave} noValidate className="space-y-[32px]">
            {errorMessage && (
              <div
                className="max-w-[642px] p-[12px] rounded-[8px] bg-[#FEF3F2] border border-[#FECDCA] text-[13px] font-medium text-[#B42318]"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <div className="space-y-[12px] max-w-[642px]">
              {/* Field 1: First Name */}
              <div
                className="bg-white border border-[#DED6C9] rounded-[11px] h-[55px] overflow-hidden flex items-center shadow-xs"
                data-node-id="3042:6741"
                data-name="Approved/Profile field/First name"
              >
                <div
                  className="bg-[#F3EBDD] h-full w-[252px] flex items-center px-[17px] gap-[12px] shrink-0"
                  data-node-id="3042:6742"
                >
                  <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <Image src="/figma-assets/imgDecorIconUser.svg" alt="" width={20} height={20} />
                  </div>
                  <label
                    htmlFor="first-name-input"
                    className="text-[15px] font-semibold text-[#121417]"
                    data-node-id="3042:6746"
                  >
                    First name
                  </label>
                </div>
                <input
                  id="first-name-input"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-full px-[23px] text-[16px] text-[#121417] bg-transparent focus:outline-none"
                  data-node-id="3042:6747"
                />
              </div>

              {/* Field 2: Last Name */}
              <div
                className="bg-white border border-[#DED6C9] rounded-[11px] h-[55px] overflow-hidden flex items-center shadow-xs"
                data-node-id="3042:6748"
                data-name="Approved/Profile field/Last name"
              >
                <div
                  className="bg-[#F3EBDD] h-full w-[252px] flex items-center px-[17px] gap-[12px] shrink-0"
                  data-node-id="3042:6749"
                >
                  <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <Image src="/figma-assets/imgDecorIconUser.svg" alt="" width={20} height={20} />
                  </div>
                  <label
                    htmlFor="last-name-input"
                    className="text-[15px] font-semibold text-[#121417]"
                    data-node-id="3042:6753"
                  >
                    Last name
                  </label>
                </div>
                <input
                  id="last-name-input"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-full px-[23px] text-[16px] text-[#121417] bg-transparent focus:outline-none"
                  data-node-id="3042:6754"
                />
              </div>

              {/* Field 3: Email */}
              <div
                className="bg-white border border-[#DED6C9] rounded-[11px] h-[55px] overflow-hidden flex items-center shadow-xs"
                data-node-id="3042:6755"
                data-name="Approved/Profile field/Email"
              >
                <div
                  className="bg-[#F3EBDD] h-full w-[252px] flex items-center px-[17px] gap-[12px] shrink-0"
                  data-node-id="3042:6756"
                >
                  <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <Image src="/figma-assets/imgDecorIconMail.svg" alt="" width={20} height={20} />
                  </div>
                  <label
                    htmlFor="email-input"
                    className="text-[15px] font-semibold text-[#121417]"
                    data-node-id="3042:6760"
                  >
                    Email
                  </label>
                </div>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-full px-[23px] text-[16px] text-[#121417] bg-transparent focus:outline-none"
                  data-node-id="3042:6761"
                />
              </div>

              {/* Field 4: Preferred Language */}
              <div
                className="bg-white border border-[#DED6C9] rounded-[11px] h-[55px] overflow-hidden flex items-center shadow-xs"
                data-node-id="3042:6762"
                data-name="Approved/Profile field/Preferred language"
              >
                <div
                  className="bg-[#F3EBDD] h-full w-[252px] flex items-center px-[17px] gap-[12px] shrink-0"
                  data-node-id="3042:6763"
                >
                  <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    <Image
                      src="/figma-assets/imgDecorIconGlobe.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </div>
                  <label
                    htmlFor="language-input"
                    className="text-[15px] font-semibold text-[#121417]"
                    data-node-id="3042:6767"
                  >
                    Preferred language
                  </label>
                </div>
                <select
                  id="language-input"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full h-full px-[23px] text-[16px] text-[#121417] bg-transparent focus:outline-none cursor-pointer"
                  data-node-id="3042:6768"
                >
                  <option value="English">English</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Italian">Italian</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>
            </div>

            {/* Action Buttons: Save & Cancel */}
            <div className="flex items-center gap-[16px]">
              <button
                type="submit"
                disabled={isSaving}
                className="w-[180px] h-[48px] bg-[#0B0C0E] hover:bg-[#17191D] border-[1.3px] border-[#B48737] rounded-[12px] text-white text-[14px] font-semibold tracking-[0.1px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                data-node-id="77:463"
                data-name="Button/Primary"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>

              <Link
                href={`/customers/${customerId}`}
                className="w-[180px] h-[48px] bg-white hover:bg-[#FAF8F4] border border-[#A6A19A] rounded-[12px] text-[#0B0C0E] text-[14px] font-semibold tracking-[0.1px] flex items-center justify-center transition-colors cursor-pointer"
                data-node-id="77:464"
                data-name="Button/Secondary"
              >
                Cancel
              </Link>
            </div>

            {/* Bottom Scope Restriction Note */}
            <div
              className="bg-[#F1E7D2] rounded-[12px] p-[24px] max-w-[1040px] relative overflow-hidden flex items-start gap-[16px] shadow-xs"
              data-node-id="77:467"
              data-name="Frame"
            >
              <div
                className="bg-[#B48737] w-[4px] h-[55px] rounded-[2px] shrink-0"
                data-node-id="3042:6769"
                data-name="Decor/Note accent"
              />
              <p
                className="text-[14px] font-normal leading-[22px] text-[#5B616B]"
                data-node-id="77:468"
              >
                Only first name, last name, email and preferred language are editable here. Phone,
                verification, password and recovery controls are intentionally absent.
              </p>
            </div>
          </form>
        )}
      </div>
    </CommandCenterShell>
  );
}
