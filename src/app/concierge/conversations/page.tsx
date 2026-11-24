"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { conversationRepository } from "@/lib/mock/conversations";
import type { ConciergeConversation } from "@/types/concierge";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function ConciergeConversationInboxPage() {
  const [conversations, setConversations] = useState<ConciergeConversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = () => {
      setConversations(conversationRepository.listConversations());
    };
    loadData();
    const unsubscribe = conversationRepository.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const filteredConversations = conversations.filter((c) => {
    return (
      !searchTerm ||
      c.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessageText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]";
      case "IN_PROGRESS":
        return "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]";
      case "COMPLETED":
        return "bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]";
      default:
        return "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1280px] w-full"
        data-node-id="83:1533"
        data-name="CC-CON-03__Concierge__Ready"
      >
        {/* Module Sub-navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-[#DDD8CF] mb-[24px]">
          <Link
            href="/concierge/requests"
            className="pb-3 text-[14px] font-medium text-[#5B616B] hover:text-[#0B0C0E] transition-colors"
          >
            Requests List
          </Link>
          <Link
            href="/concierge/conversations"
            className="pb-3 border-b-2 border-[#0B0C0E] text-[14px] font-bold text-[#0B0C0E]"
          >
            Conversation Inbox
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="83:1570"
            >
              Concierge Conversation Inbox
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-CON-03 (Node 83:1533) · VIP customer direct communication threads
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border border-[#DDD8CF] rounded-[12px] p-4 mb-[24px] flex items-center justify-between shadow-card">
          <div className="relative w-full sm:w-[360px]">
            <input
              type="text"
              placeholder="Search conversation, customer, messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[40px] pl-3 pr-3 text-[14px] border border-[#DDD8CF] rounded-[8px] focus:outline-none focus:border-[#0B0C0E]"
            />
          </div>
        </div>

        {/* Conversations Table */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card"
          data-node-id="83:1580"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#FAF8F4] border-b border-[#DDD8CF] text-[#5B616B] text-[12px] uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Conversation</th>
                  <th className="py-3.5 px-6">Customer / Context</th>
                  <th className="py-3.5 px-6">Unread</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Updated</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CF]">
                {filteredConversations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#5B616B] text-[14px]">
                      No conversations found.
                    </td>
                  </tr>
                ) : (
                  filteredConversations.map((conv) => (
                    <tr key={conv.id} className="hover:bg-[#FAF8F4]/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#0B0C0E]">
                        <Link
                          href={`/concierge/conversations/${conv.id}`}
                          className="hover:text-[#164D53]"
                        >
                          {conv.reference}
                        </Link>
                      </td>

                      <td className="py-4 px-6">
                        <Link
                          href={`/customers/${conv.customerId}`}
                          className="font-semibold text-[#0B0C0E] hover:underline block"
                        >
                          {conv.customerName}
                        </Link>
                        <span className="text-[12px] text-[#5B616B] block truncate max-w-[280px]">
                          {conv.lastMessageText}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {conv.unreadCount > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[#FDE8E8] text-[#9B1C1C]">
                            {conv.unreadCount} unread
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#5B616B]">0 unread</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusBadge(
                            conv.status,
                          )}`}
                        >
                          {conv.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-[#5B616B] text-[13px]">
                        {conv.updatedDisplay}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/concierge/conversations/${conv.id}`}
                          className="text-[#164D53] hover:text-[#0B0C0E] font-semibold text-[13px] inline-flex items-center gap-1"
                        >
                          View ›
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
