import type {
  ConciergeConversation,
  ConversationMessage,
  SendMessageParams,
} from "@/types/concierge";

export class ConversationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConversationValidationError";
  }
}

export const INITIAL_CONVERSATIONS: ConciergeConversation[] = [
  {
    id: "conv_001",
    reference: "CONV-261124-01",
    customerId: "cus_001",
    customerName: "Olivia Carter",
    customerEmail: "olivia.carter@demo.com",
    tripId: "TRIP-261124-04",
    tripReference: "TRIP-261124-04",
    requestId: "cr_001",
    requestReference: "CR-261124-01",
    status: "OPEN",
    unreadCount: 1,
    lastMessageText: "Understood, we are arranging the VIP tarmac helicopter transfer now.",
    lastMessageSender: "CONCIERGE",
    lastMessageAt: "2026-11-24T09:15:00Z",
    updatedAt: "2026-11-24T09:15:00Z",
    updatedDisplay: "Nov 24 · 09:15",
    messages: [
      {
        id: "msg_1",
        conversationId: "conv_001",
        senderType: "CUSTOMER",
        senderName: "Olivia Carter",
        content: "Hello, could you coordinate our JFK arrival transfer with our estate concierge?",
        timestamp: "2026-11-24T09:00:00Z",
        timestampDisplay: "09:00",
        read: true,
      },
      {
        id: "msg_2",
        conversationId: "conv_001",
        senderType: "CONCIERGE",
        senderName: "Elena Rostova",
        content:
          "Good morning Ms. Carter. Absolutely, I have notified the chauffeur and private aviation desk.",
        timestamp: "2026-11-24T09:05:00Z",
        timestampDisplay: "09:05",
        read: true,
      },
      {
        id: "msg_3",
        conversationId: "conv_001",
        senderType: "CUSTOMER",
        senderName: "Olivia Carter",
        content: "Also please ensure 2 additional luggage tags are provided for tarmac pickup.",
        timestamp: "2026-11-24T09:10:00Z",
        timestampDisplay: "09:10",
        read: false,
      },
      {
        id: "msg_4",
        conversationId: "conv_001",
        senderType: "CONCIERGE",
        senderName: "Elena Rostova",
        content: "Understood, we are arranging the VIP tarmac helicopter transfer now.",
        timestamp: "2026-11-24T09:15:00Z",
        timestampDisplay: "09:15",
        read: true,
      },
    ],
  },
  {
    id: "conv_002",
    reference: "CONV-261124-02",
    customerId: "cus_002",
    customerName: "Ethan Mitchell",
    customerEmail: "ethan.mitchell@demo.com",
    tripId: "TRIP-261124-02",
    tripReference: "TRIP-261124-02",
    requestId: "cr_002",
    requestReference: "CR-261124-02",
    status: "IN_PROGRESS",
    unreadCount: 0,
    lastMessageText: "Chef Antoine has confirmed the 5-course tasting menu with Bordeaux pairing.",
    lastMessageSender: "CONCIERGE",
    lastMessageAt: "2026-11-24T08:30:00Z",
    updatedAt: "2026-11-24T08:30:00Z",
    updatedDisplay: "Nov 24 · 08:30",
    messages: [
      {
        id: "msg_5",
        conversationId: "conv_002",
        senderType: "CUSTOMER",
        senderName: "Ethan Mitchell",
        content: "We have one guest who requires a gluten-free menu for dinner.",
        timestamp: "2026-11-24T08:15:00Z",
        timestampDisplay: "08:15",
        read: true,
      },
      {
        id: "msg_6",
        conversationId: "conv_002",
        senderType: "CONCIERGE",
        senderName: "Marcus Vance",
        content: "Chef Antoine has confirmed the 5-course tasting menu with Bordeaux pairing.",
        timestamp: "2026-11-24T08:30:00Z",
        timestampDisplay: "08:30",
        read: true,
      },
    ],
  },
  {
    id: "conv_003",
    reference: "CONV-261124-03",
    customerId: "cus_003",
    customerName: "Sophia Reed",
    customerEmail: "sophia.reed@demo.com",
    tripId: "TRIP-261124-01",
    tripReference: "TRIP-261124-01",
    requestId: "cr_003",
    requestReference: "CR-261124-03",
    status: "COMPLETED",
    unreadCount: 0,
    lastMessageText: "Thank you for an exquisite Paris experience. Everything was flawless.",
    lastMessageSender: "CUSTOMER",
    lastMessageAt: "2026-11-16T17:45:00Z",
    updatedAt: "2026-11-16T17:45:00Z",
    updatedDisplay: "Nov 16 · 17:45",
    messages: [
      {
        id: "msg_7",
        conversationId: "conv_003",
        senderType: "CUSTOMER",
        senderName: "Sophia Reed",
        content: "Thank you for an exquisite Paris experience. Everything was flawless.",
        timestamp: "2026-11-16T17:45:00Z",
        timestampDisplay: "17:45",
        read: true,
      },
    ],
  },
];

export class ConversationRepository {
  private conversations: ConciergeConversation[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.conversations = JSON.parse(JSON.stringify(INITIAL_CONVERSATIONS));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const fn of this.listeners) {
      fn();
    }
  }

  public listConversations(): ConciergeConversation[] {
    return [...this.conversations];
  }

  public getConversationById(id: string): ConciergeConversation | undefined {
    return this.conversations.find(
      (c) =>
        c.id.toLowerCase() === id.toLowerCase() || c.reference.toLowerCase() === id.toLowerCase(),
    );
  }

  public getConversationByCustomer(customerId: string): ConciergeConversation | undefined {
    return this.conversations.find((c) => c.customerId === customerId);
  }

  public getConversationByRequest(requestId: string): ConciergeConversation | undefined {
    return this.conversations.find(
      (c) =>
        c.requestId?.toLowerCase() === requestId.toLowerCase() ||
        c.requestReference?.toLowerCase() === requestId.toLowerCase(),
    );
  }

  public markAsRead(conversationId: string): void {
    const conv = this.getConversationById(conversationId);
    if (!conv) return;

    let hasUnread = false;
    for (const msg of conv.messages) {
      if (!msg.read) {
        msg.read = true;
        hasUnread = true;
      }
    }
    if (conv.unreadCount > 0 || hasUnread) {
      conv.unreadCount = 0;
      this.notify();
    }
  }

  public sendMessage(params: SendMessageParams): ConversationMessage {
    const conv = this.getConversationById(params.conversationId);
    if (!conv) {
      throw new ConversationValidationError(`Conversation not found: ${params.conversationId}`);
    }

    if (!params.content || !params.content.trim()) {
      throw new ConversationValidationError("Message content cannot be empty or whitespace only.");
    }

    const now = new Date();
    const msgId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const timestampDisplay = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const updatedDisplay = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg: ConversationMessage = {
      id: msgId,
      conversationId: conv.id,
      senderType: "CONCIERGE",
      senderName: params.senderName || "Elena Rostova",
      content: params.content.trim(),
      timestamp: now.toISOString(),
      timestampDisplay,
      read: true,
    };

    conv.messages.push(newMsg);
    conv.lastMessageText = newMsg.content;
    conv.lastMessageSender = "CONCIERGE";
    conv.lastMessageAt = now.toISOString();
    conv.updatedAt = now.toISOString();
    conv.updatedDisplay = updatedDisplay;
    conv.unreadCount = 0; // Concierge sent, conversation is acknowledged

    this.notify();
    return newMsg;
  }

  public resetDefaults(): void {
    this.conversations = JSON.parse(JSON.stringify(INITIAL_CONVERSATIONS));
    this.notify();
  }
}

export const conversationRepository = new ConversationRepository();
