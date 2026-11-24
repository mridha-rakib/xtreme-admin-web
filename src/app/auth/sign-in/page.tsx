"use client";

import { useSession } from "@/lib/auth/session";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useSession();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage("Identifier is required.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Password is required.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn({ identifier, password });
      if (!result.success) {
        setErrorMessage(result.error || "Authentication failed.");
        setIsLoading(false);
      } else {
        router.push("/");
      }
    } catch {
      setErrorMessage("An unexpected authentication error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="bg-[#FAF8F4] min-h-screen w-full relative flex overflow-x-hidden"
      data-node-id="77:2"
      data-name="CC-AUTH-01__Sign_In__Ready"
    >
      {/* 240px Command Center Authority Rail */}
      <div
        className="w-[240px] min-w-[240px] bg-[#0B0C0E] h-screen sticky top-0 overflow-hidden shrink-0 flex flex-col"
        data-node-id="77:3"
        data-name="Command Center rail"
      >
        <div className="pt-[16px] px-[16px] h-[104px]">
          <div className="w-[208px] h-[88px] rounded-[10px] relative overflow-hidden flex items-center justify-center">
            <Image
              src="/branding/logo-sidebar-dark.png"
              alt="XTREME Concierge"
              width={208}
              height={88}
              priority
              className="object-contain"
            />
          </div>
        </div>

        <div className="px-[24px] pt-[30px] space-y-[26px]">
          <p className="text-[14px] font-normal leading-[22px] text-white" data-node-id="77:6">
            Secure operational access
          </p>
          <p
            className="text-[12px] font-medium leading-[16px] tracking-[0.1px] text-white/80"
            data-node-id="77:7"
          >
            No protected module or business data is rendered before authorization resolves.
          </p>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div
          className="h-[72px] min-h-[72px] bg-white border-b border-[#DDD8CF] w-full"
          data-node-id="77:8"
          data-name="Top bar"
        />

        {/* Content Container */}
        <div className="p-[40px] max-w-[1200px] w-full">
          <h1
            className="text-[28px] font-bold leading-[36px] tracking-[-0.1px] text-[#0B0C0E] mb-[20px]"
            data-node-id="77:9"
          >
            Sign In
          </h1>

          {/* Center Card */}
          <div className="flex justify-center pt-[16px]">
            <div
              className="w-full max-w-[640px] bg-white border border-[#DDD8CF] rounded-[20px] p-[47px] shadow-sm relative"
              data-node-id="77:10"
              data-name="Frame"
            >
              <h2
                className="text-[28px] font-bold leading-[36px] tracking-[-0.1px] text-[#0B0C0E]"
                data-node-id="77:11"
              >
                Command Center Sign In
              </h2>
              <p
                className="text-[14px] font-normal leading-[22px] text-[#5B616B] mt-[8px] mb-[28px]"
                data-node-id="77:12"
              >
                Concierge, Vendor, Admin and Super Admin access only.
              </p>

              {errorMessage && (
                <div
                  className="mb-[20px] p-[12px] rounded-[8px] bg-[#FEF3F2] border border-[#FECDCA] text-[13px] font-medium text-[#B42318]"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-[24px]">
                {/* Identifier Field */}
                <div className="space-y-[6px]" data-node-id="77:18">
                  <label
                    htmlFor="identifier-input"
                    className="block text-[14px] font-semibold leading-[20px] tracking-[0.1px] text-[#0B0C0E]"
                    data-node-id="17:3"
                  >
                    Identifier
                  </label>
                  <input
                    id="identifier-input"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Registered email or E.164 mobile number"
                    disabled={isLoading}
                    className="w-full h-[48px] px-[14px] bg-white border border-[#DDD8CF] rounded-[8px] text-[15px] text-[#0B0C0E] placeholder:text-[#5B616B] focus:outline-none focus:ring-2 focus:ring-[#164D53] focus:border-transparent transition-colors"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-[6px]">
                  <label
                    htmlFor="password-input"
                    className="block text-[14px] font-semibold leading-[20px] tracking-[0.1px] text-[#0B0C0E]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      disabled={isLoading}
                      className="w-full h-[48px] px-[14px] pr-[44px] bg-white border border-[#DDD8CF] rounded-[8px] text-[15px] text-[#0B0C0E] placeholder:text-[#5B616B] focus:outline-none focus:ring-2 focus:ring-[#164D53] focus:border-transparent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-[14px] top-[14px] text-[#5B616B] hover:text-[#0B0C0E] focus:outline-none cursor-pointer"
                    >
                      <Image
                        src="/figma-assets/imgThirdPartySimpleDsEye.svg"
                        alt=""
                        width={20}
                        height={20}
                        className={showPassword ? "opacity-100" : "opacity-60"}
                      />
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-[16px]">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[48px] bg-[#0B0C0E] text-white text-[14px] font-semibold tracking-[0.1px] rounded-[12px] flex items-center justify-center hover:bg-[#17191D] active:bg-[#24272D] disabled:opacity-50 transition-colors cursor-pointer"
                    data-node-id="14:2"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>
              </form>

              {/* Fixed Notice */}
              <p
                className="text-[12px] font-medium leading-[16px] tracking-[0.1px] text-[#5B616B] mt-[24px]"
                data-node-id="77:25"
              >
                client_type=COMMAND_CENTER is fixed internally and is not exposed as a field.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
