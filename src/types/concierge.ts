export type ConciergeRequestType = "PLAN_TRIP" | "SERVICE_REQUEST" | "SPECIAL_REQUEST";

export type ConciergeRequestStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ConciergeRequest {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  tripId?: string;
  tripReference?: string;
  serviceId?: string;
  serviceName?: string;
  type: ConciergeRequestType;
  typeDisplay: string;
  status: ConciergeRequestStatus;
  assignedStaffName: string;
  details: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
  updatedDisplay: string;
}

export interface CreateConciergeRequestParams {
  customerId: string;
  type: ConciergeRequestType;
  details: string;
  tripId?: string;
  serviceName?: string;
  assignedStaffName?: string;
}

export interface UpdateConciergeRequestParams {
  status?: ConciergeRequestStatus;
  assignedStaffName?: string;
  details?: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderType: "CUSTOMER" | "CONCIERGE";
  senderName: string;
  content: string;
  timestamp: string;
  timestampDisplay: string;
  read: boolean;
}

export interface ConciergeConversation {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  tripId?: string;
  tripReference?: string;
  requestId?: string;
  requestReference?: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
  unreadCount: number;
  lastMessageText: string;
  lastMessageSender: "CUSTOMER" | "CONCIERGE";
  lastMessageAt: string;
  updatedAt: string;
  updatedDisplay: string;
  messages: ConversationMessage[];
}

export interface SendMessageParams {
  conversationId: string;
  content: string;
  senderName?: string;
}
