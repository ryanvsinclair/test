export interface BulkMessageContext {
  type: 'listing' | 'appointment' | 'inquiry';
  listingId?: string;
  appointmentWindow?: {
    start: string;
    end: string;
  };
  inquiryThread?: string;
}

export interface BulkMessageRecipient {
  userId: string;
  userName: string;
  conversationId: string;
  eligible: boolean;
  exclusionReason?: 'disengaged' | 'blocked' | 'muted' | 'no_context' | 'rate_limited';
}

export interface BulkMessagePreview {
  context: BulkMessageContext;
  recipients: BulkMessageRecipient[];
  eligibleCount: number;
  excludedCount: number;
  message: string;
  personalizationTokens: string[];
}

export interface BulkMessageJob {
  id: string;
  dealerId: string;
  context: BulkMessageContext;
  message: string;
  recipientIds: string[];
  sentAt: string;
  status: 'pending' | 'sending' | 'completed' | 'failed';
  successCount: number;
  failureCount: number;
}

export interface BulkMessageRateLimit {
  dealerId: string;
  messagesLast24h: number;
  messagesLastWeek: number;
  limit24h: number;
  limitWeek: number;
  trustScore: number;
}
