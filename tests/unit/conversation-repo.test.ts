import { ConversationValidationError, conversationRepository } from "@/lib/mock/conversations";
import { beforeEach, describe, expect, it } from "vitest";

describe("ConversationRepository Unit & Domain Model Tests", () => {
  beforeEach(() => {
    conversationRepository.resetDefaults();
  });

  it("lists initial seeded conversations matching authoritative Figma references", () => {
    const convs = conversationRepository.listConversations();
    expect(convs.length).toBeGreaterThanOrEqual(3);

    const conv001 = conversationRepository.getConversationById("conv_001");
    expect(conv001).toBeDefined();
    expect(conv001?.reference).toBe("CONV-261124-01");
    expect(conv001?.customerName).toBe("Olivia Carter");
    expect(conv001?.requestId).toBe("cr_001");
    expect(conv001?.tripId).toBe("TRIP-261124-04");
    expect(conv001?.status).toBe("OPEN");
    expect(conv001?.unreadCount).toBe(1);
    expect(conv001?.messages.length).toBe(4);
  });

  it("finds conversations by ID, reference, customerId, and requestId", () => {
    expect(conversationRepository.getConversationById("CONV-261124-01")?.id).toBe("conv_001");
    expect(conversationRepository.getConversationByCustomer("cus_002")?.id).toBe("conv_002");
    expect(conversationRepository.getConversationByRequest("cr_003")?.id).toBe("conv_003");
    expect(conversationRepository.getConversationById("non_existent")).toBeUndefined();
  });

  it("validates that sendMessage rejects empty or whitespace-only messages", () => {
    expect(() =>
      conversationRepository.sendMessage({
        conversationId: "conv_001",
        content: "",
      }),
    ).toThrow(ConversationValidationError);

    expect(() =>
      conversationRepository.sendMessage({
        conversationId: "conv_001",
        content: "     ",
      }),
    ).toThrow(ConversationValidationError);

    expect(() =>
      conversationRepository.sendMessage({
        conversationId: "non_existent_conv",
        content: "Valid text",
      }),
    ).toThrow(ConversationValidationError);
  });

  it("sends a concierge message, appends to thread, updates preview, and clears unread count", () => {
    const initialMsgCount =
      conversationRepository.getConversationById("conv_001")?.messages.length || 0;

    const sent = conversationRepository.sendMessage({
      conversationId: "conv_001",
      senderName: "Marcus Vance",
      content: "Chauffeur has arrived at private terminal 3.",
    });

    expect(sent.senderType).toBe("CONCIERGE");
    expect(sent.senderName).toBe("Marcus Vance");
    expect(sent.content).toBe("Chauffeur has arrived at private terminal 3.");

    const updatedConv = conversationRepository.getConversationById("conv_001");
    expect(updatedConv?.messages.length).toBe(initialMsgCount + 1);
    expect(updatedConv?.lastMessageText).toBe("Chauffeur has arrived at private terminal 3.");
    expect(updatedConv?.lastMessageSender).toBe("CONCIERGE");
    expect(updatedConv?.unreadCount).toBe(0);
  });

  it("marks unread messages as read and zeroes unreadCount", () => {
    const conv001 = conversationRepository.getConversationById("conv_001");
    expect(conv001?.unreadCount).toBe(1);

    conversationRepository.markAsRead("conv_001");

    const afterRead = conversationRepository.getConversationById("conv_001");
    expect(afterRead?.unreadCount).toBe(0);
    expect(afterRead?.messages.every((m) => m.read)).toBe(true);
  });
});
