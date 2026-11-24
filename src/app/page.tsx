"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  AccessDeniedState,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  Pagination,
  Select,
  StatusBadge,
  Tabs,
} from "@/components/ui";
import { useSession } from "@/lib/auth/session";
import { MOCK_FOUNDATION_METRICS } from "@/lib/mock";
import { hasCommandCenterPermission } from "@/types";
import React, { useState } from "react";

export default function FoundationReadinessPage() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Check RBAC permission for financial audit overview
  const canViewFinance = hasCommandCenterPermission(user?.role, "view:finance");
  const canManageSystem = hasCommandCenterPermission(user?.role, "manage:system");

  const sampleColumns = [
    { key: "module", header: "Architecture Domain" },
    {
      key: "status",
      header: "Governance State",
      render: () => <StatusBadge status="success" label="Active" />,
    },
    { key: "roleRequired", header: "Access Level" },
    { key: "screensScope", header: "Batch Scope" },
  ];

  const sampleData = [
    {
      module: "Dashboard & Operations (Section 05_01)",
      roleRequired: "ALL ROLES",
      screensScope: "Phase 4.1",
    },
    {
      module: "Guest Bookings & Dispatch (Section 05_02)",
      roleRequired: "CONCIERGE+",
      screensScope: "Phase 4.2",
    },
    {
      module: "Fleet & Asset Pool (Section 05_03)",
      roleRequired: "ADMIN+",
      screensScope: "Phase 4.3",
    },
    {
      module: "Financial Ledger & Billings (Section 05_04)",
      roleRequired: "ADMIN+",
      screensScope: "Phase 4.4",
    },
    {
      module: "Access Governance & IAM (Section 05_05)",
      roleRequired: "SUPER_ADMIN",
      screensScope: "Phase 4.5",
    },
  ];

  return (
    <CommandCenterShell>
      <PageContainer
        title="Admin Web Command Center — Foundation Readiness"
        description="Phase 4.0.1 independent architectural foundation, RBAC testbed, and Figma token integration. Business screens (0/64) will follow in batch implementation phases."
        badge={<StatusBadge status="info" label="Foundation Build" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
              Preview Foundation Modal
            </Button>
            <Button variant="primary" size="sm">
              Live Health Status
            </Button>
          </div>
        }
      >
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_FOUNDATION_METRICS.map((metric) => (
            <Card key={metric.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-slate">
                  {metric.label}
                </span>
                <span className="text-[11px] font-semibold text-state-success bg-state-successBg px-1.5 py-0.5 rounded">
                  {metric.delta}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-brand-onyx">{metric.value}</p>
              <p className="mt-1 text-[11px] text-brand-slate">{metric.contextText}</p>
            </Card>
          ))}
        </div>

        {/* Foundation Tabs */}
        <div className="space-y-4">
          <Tabs
            tabs={[
              { id: "overview", label: "Architecture Overview" },
              { id: "primitives", label: "UI Primitives Gallery" },
              { id: "rbac", label: "RBAC Security Testbed" },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card
                  title="Independent Project Setup Verification"
                  subtitle="Strict separation from mobile application packages"
                >
                  <DataTable
                    columns={sampleColumns}
                    data={sampleData}
                    keyExtractor={(row) => row.module}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={3}
                    onPageChange={setCurrentPage}
                    className="mt-4 border-t border-brand-line/60 pt-3"
                  />
                </Card>

                <Card
                  title="Zero-Reuse Policy Compliance"
                  subtitle="Standalone packages, independent styling & types"
                >
                  <ul className="space-y-2 text-xs text-brand-slate">
                    <li className="flex items-center gap-2">
                      <span className="text-state-success font-bold">✓</span>
                      Independent repository:{" "}
                      <code className="bg-surface-subtle px-1 py-0.5 rounded text-brand-onyx">
                        mridha-rakib/xtreme-admin-web
                      </code>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-state-success font-bold">✓</span>
                      Native Web UI components (Tailwind CSS, HTML5, React 19)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-state-success font-bold">✓</span>
                      Authoritative Figma design tokens & brand assets extracted directly from
                      Section 05_Command_Center
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-state-success font-bold">✓</span>
                      Fail-closed role governance and mock session context
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-state-success font-bold">✓</span>
                      Strict scope restriction: Exactly 0 of 64 business screens implemented
                    </li>
                  </ul>
                </Card>
              </div>

              <div className="space-y-6">
                <Card title="Active Operational Session" subtitle="Current simulated persona">
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-brand-slate">User Name:</span>
                      <p className="font-semibold text-brand-onyx">{user?.name}</p>
                    </div>
                    <div>
                      <span className="text-brand-slate">Email Address:</span>
                      <p className="font-semibold text-brand-onyx">{user?.email}</p>
                    </div>
                    <div>
                      <span className="text-brand-slate">Active Role:</span>
                      <p className="font-semibold text-brand-onyx">{user?.role}</p>
                    </div>
                    <div>
                      <span className="text-brand-slate">Department:</span>
                      <p className="font-semibold text-brand-onyx">{user?.department}</p>
                    </div>
                  </div>
                </Card>

                <Card
                  title="Permission Evaluation"
                  subtitle="Dynamic permission resolution based on persona"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>View Financial Ledger:</span>
                      <StatusBadge
                        status={canViewFinance ? "success" : "danger"}
                        label={canViewFinance ? "Authorized" : "Denied"}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Manage Access Governance:</span>
                      <StatusBadge
                        status={canManageSystem ? "success" : "danger"}
                        label={canManageSystem ? "Authorized" : "Denied"}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "primitives" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Inputs & Form Controls">
                <div className="space-y-3">
                  <Input label="Flight Call Sign" placeholder="e.g. N104XQ" />
                  <Select
                    label="Fleet Priority"
                    options={[
                      { value: "STANDARD", label: "Standard Charter" },
                      { value: "HEAD_OF_STATE", label: "VIP Diplomatic Priority" },
                      { value: "URGENT", label: "Urgent Medical / Evac" },
                    ]}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button variant="primary" size="sm">
                      Primary
                    </Button>
                    <Button variant="secondary" size="sm">
                      Secondary
                    </Button>
                    <Button variant="outline" size="sm">
                      Outline
                    </Button>
                    <Button variant="danger" size="sm">
                      Danger
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title="State Views Preview">
                <div className="space-y-4">
                  <LoadingState message="Testing loader primitive..." />
                  <EmptyState
                    title="Sample Empty View"
                    description="Used when datasets or searches return empty."
                  />
                </div>
              </Card>
            </div>
          )}

          {activeTab === "rbac" && (
            <div className="space-y-6">
              <Card title="Simulated Access Control Guard">
                {canManageSystem ? (
                  <div className="p-4 rounded-md bg-state-successBg border border-state-success/30 text-xs text-state-success font-medium">
                    Access Granted: Your persona ({user?.role}) has permission to manage system
                    governance.
                  </div>
                ) : (
                  <AccessDeniedState
                    title="Access Restricted for Role"
                    description={`Your currently selected persona (${user?.role}) does not have permission to manage system governance.`}
                  />
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Test Modal Component */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Foundation Primitives Modal"
          description="Interactive dialog component verifying accessibility and keybindings."
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
                Confirm Action
              </Button>
            </>
          }
        >
          <p className="text-xs text-brand-slate leading-relaxed">
            This dialog verifies that focus management, backdrop rendering, and escape-key listener
            behave properly in the independent Admin Web foundation.
          </p>
        </Modal>
      </PageContainer>
    </CommandCenterShell>
  );
}
