"use client";

import { CommandCenterShell } from "@/components/layout/CommandCenterShell";
import { useSession } from "@/lib/auth/session";
import { ConversationValidationError, conversationRepository } from "@/lib/mock/conversations";
import type { ConciergeConversation } from "@/types/concierge";
import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";

export default function ConciergeConversationDetailPage() {
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const { user } = useSession();

  const [conversation, setConversation] = useState<ConciergeConversation | null | undefined>(
    undefined,
  );
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;

    const loadData = () => {
      const conv = conversationRepository.getConversationById(conversationId);
      if (conv) {
        setConversation({ ...conv, messages: [...conv.messages] });
        conversationRepository.markAsRead(conv.id);
      } else {
        setConversation(null);
      }
    };

    loadData();
    const unsubscribe = conversationRepository.subscribe(loadData);
    return () => unsubscribe();
  }, [conversationId]);

  const messagesCount = conversation?.messages?.length;
  useEffect(() => {
    if (messagesCount !== undefined) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesCount]);

  if (conversation === undefined) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] text-sm text-[#5B616B]">Loading conversation thread...</div>
      </CommandCenterShell>
    );
  }

  if (conversation === null) {
    return (
      <CommandCenterShell>
        <div className="p-[32px] max-w-[800px]">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-[#0B0C0E]">Conversation Not Found</h2>
            <p className="text-sm text-[#5B616B]">
              No conversation thread exists for identifier &ldquo;{conversationId}&rdquo;.
            </p>
            <Link
              href="/concierge/conversations"
              className="inline-flex items-center px-4 py-2 bg-[#0B0C0E] text-white text-xs font-semibold rounded-md hover:bg-[#17191D]"
            >
              Return to Conversation Inbox
            </Link>
          </div>
        </div>
      </CommandCenterShell>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!messageText.trim()) {
      setErrorMessage("Message cannot be empty or whitespace only.");
      return;
    }

    setIsSending(true);
    try {
      conversationRepository.sendMessage({
        conversationId: conversation.id,
        content: messageText.trim(),
        senderName: user?.name || "Elena Rostova",
      });
      setMessageText("");
    } catch (err) {
      if (err instanceof ConversationValidationError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while sending the message.");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <CommandCenterShell>
      <div
        className="p-[32px] max-w-[1140px] w-full"
        data-node-id="83:1633"
        data-name="CC-CON-04__Concierge__Ready"
      >
        {/* Navigation Breadcrumb */}
        <div className="mb-[16px]">
          <Link
            href="/concierge/conversations"
            className="text-[13px] font-semibold text-[#164D53] hover:text-[#0B0C0E] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Conversation Inbox
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[24px]">
          <div>
            <h1
              className="text-[28px] font-bold text-[#0B0C0E] tracking-[-0.1px] leading-[36px]"
              data-node-id="83:1670"
            >
              Concierge Conversation Detail
            </h1>
            <p className="text-[14px] text-[#5B616B] mt-[4px]">
              Figma CC-CON-04 (Node 83:1633) · Thread: {conversation.reference}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F1EFEA] border border-[#DDD8CF] rounded-full text-xs font-semibold text-[#0B0C0E]">
            <span className="w-2 h-2 rounded-full bg-[#164D53]" />
            Direct VIP Thread
          </div>
        </div>

        {/* Realtime MVP Scope Notice */}
        <div
          className="mb-[24px] p-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[10px] text-[13px] text-[#5B616B] flex items-start gap-3"
          data-node-id="83:1680"
        >
          <span className="font-bold text-[#0B0C0E] text-base leading-none">ℹ</span>
          <div>
            <p className="font-semibold text-[#0B0C0E]">Realtime MVP Boundary</p>
            <p className="mt-0.5">
              No separate realtime/WebSocket feature is required by the locked MVP. Messages are
              persisted deterministically to the centralized repository state.
            </p>
          </div>
        </div>

        {/* Card 1: Conversation Context */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] p-[20px] mb-[24px] shadow-card"
          data-node-id="83:1672"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[#0B0C0E]">Conversation context</h2>
            <span className="text-[12px] text-[#5B616B]">
              Last updated: {conversation.updatedDisplay}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
            <div>
              <span className="text-[#5B616B] block">Customer:</span>
              <Link
                href={`/customers/${conversation.customerId}`}
                className="font-bold text-[#164D53] hover:underline"
              >
                {conversation.customerName}
              </Link>
              <span className="text-[12px] text-[#5B616B] block">{conversation.customerEmail}</span>
            </div>

            <div>
              <span className="text-[#5B616B] block">Trip Container:</span>
              {conversation.tripId ? (
                <Link
                  href={`/trips/${conversation.tripId}`}
                  className="font-bold text-[#164D53] hover:underline"
                >
                  {conversation.tripReference || conversation.tripId}
                </Link>
              ) : (
                <span className="text-[#0B0C0E] font-medium">None linked</span>
              )}
            </div>

            <div>
              <span className="text-[#5B616B] block">Concierge Request:</span>
              {conversation.requestId ? (
                <Link
                  href={`/concierge/requests/${conversation.requestId}`}
                  className="font-bold text-[#164D53] hover:underline"
                >
                  {conversation.requestReference || conversation.requestId}
                </Link>
              ) : (
                <span className="text-[#0B0C0E] font-medium">General inquiry</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Message History & Composer */}
        <div
          className="bg-white border border-[#DDD8CF] rounded-[12px] overflow-hidden shadow-card flex flex-col h-[560px]"
          data-node-id="83:1675"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#DDD8CF] bg-[#FAF8F4] flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#0B0C0E]">Message history</h2>
            <span className="text-xs text-[#5B616B]">
              {conversation.messages.length} messages in thread
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FAF8F4]/40">
            {conversation.messages.map((msg) => {
              const isConcierge = msg.senderType === "CONCIERGE";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isConcierge ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-[#5B616B]">
                    <span className="font-semibold text-[#0B0C0E]">{msg.senderName}</span>
                    <span>•</span>
                    <span>{msg.timestampDisplay}</span>
                  </div>

                  <div
                    className={`max-w-[75%] p-3.5 rounded-[12px] text-[14px] leading-[22px] border ${
                      isConcierge
                        ? "bg-[#F1E7D2] border-[#DDD8CF] text-[#0B0C0E] rounded-tr-none"
                        : "bg-[#EEE9E0] border-[#DDD8CF] text-[#0B0C0E] rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-[#DDD8CF] bg-white flex items-center gap-3"
          >
            <div className="flex-1">
              <label htmlFor="msg-composer-input" className="sr-only">
                Message Input
              </label>
              <input
                id="msg-composer-input"
                type="text"
                placeholder={`Type a message to ${conversation.customerName}...`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full h-[48px] px-4 bg-[#FAF8F4] border border-[#DDD8CF] rounded-[10px] text-[14px] text-[#0B0C0E] focus:outline-none focus:border-[#0B0C0E]"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="h-[48px] px-6 bg-[#0B0C0E] text-white text-[14px] font-semibold rounded-[10px] hover:bg-[#17191D] disabled:opacity-50 transition-colors shrink-0"
            >
              {isSending ? "Sending..." : "Send Message"}
            </button>
          </form>

          {errorMessage && (
            <div className="px-4 py-2 bg-[#FDE8E8] text-[#9B1C1C] text-[12px] font-medium border-t border-[#F8B4B4]">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </CommandCenterShell>
  );
}
