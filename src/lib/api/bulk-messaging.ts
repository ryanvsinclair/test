import {
  BulkMessageContext,
  BulkMessageRecipient,
  BulkMessagePreview,
  BulkMessageJob,
  BulkMessageRateLimit,
} from '@/types/bulk-messaging';
import { messageService } from './messages';

/**
 * BULK MESSAGING SAFETY MODEL:
 * 
 * - Only existing conversations eligible
 * - Buyers who disengaged are automatically excluded
 * - Rate limits enforced based on dealer trust score
 * - All sends logged for reputation analysis
 * - No cold messaging allowed
 */

// Mock closed/blocked conversations (in production: query DB)
const closedConversations = new Set<string>();
const blockedBuyers = new Set<string>(); // buyers who blocked this dealer
const mutedConversations = new Set<string>();

// Mock rate limit data (in production: Redis or DB)
const rateLimitStore: Record<string, BulkMessageRateLimit> = {};

// Mock trust scores (in production: fetch from reputation system)
const dealerTrustScores: Record<string, number> = {
  'dealer-1': 0.85,
  'dealer-2': 0.72,
  'dealer-3': 0.95,
};

export const bulkMessageService = {
  /**
   * Get eligible recipients for bulk message based on context
   */
  getEligibleRecipients: async (
    dealerId: string,
    context: BulkMessageContext
  ): Promise<BulkMessageRecipient[]> => {
    // Get all conversations for this dealer
    const conversations = messageService.getConversationsForDealer(dealerId);

    // Filter by context
    let contextualConversations = conversations;

    if (context.type === 'listing' && context.listingId) {
      contextualConversations = conversations.filter(
        c => c.vehicleId === context.listingId
      );
    }

    // Map to recipients and check eligibility
    const recipients: BulkMessageRecipient[] = contextualConversations.map(conv => {
      let eligible = true;
      let exclusionReason: BulkMessageRecipient['exclusionReason'];

      // Check if conversation was closed by buyer
      if (closedConversations.has(conv.id)) {
        eligible = false;
        exclusionReason = 'disengaged';
      }

      // Check if buyer blocked this dealer
      if (blockedBuyers.has(conv.buyerId)) {
        eligible = false;
        exclusionReason = 'blocked';
      }

      // Check if conversation was muted
      if (mutedConversations.has(conv.id)) {
        eligible = false;
        exclusionReason = 'muted';
      }

      return {
        userId: conv.buyerId,
        userName: conv.buyerName,
        conversationId: conv.id,
        eligible,
        exclusionReason,
      };
    });

    return recipients;
  },

  /**
   * Preview bulk message before sending
   */
  previewBulkMessage: async (
    dealerId: string,
    context: BulkMessageContext,
    message: string
  ): Promise<BulkMessagePreview> => {
    const recipients = await bulkMessageService.getEligibleRecipients(dealerId, context);
    const eligible = recipients.filter(r => r.eligible);
    const excluded = recipients.filter(r => !r.eligible);

    // Extract personalization tokens from message
    const tokenRegex = /\{\{(\w+)\}\}/g;
    const tokens: string[] = [];
    let match;
    while ((match = tokenRegex.exec(message)) !== null) {
      tokens.push(match[1]);
    }

    return {
      context,
      recipients,
      eligibleCount: eligible.length,
      excludedCount: excluded.length,
      message,
      personalizationTokens: tokens,
    };
  },

  /**
   * Check rate limits for dealer
   */
  checkRateLimit: async (dealerId: string): Promise<BulkMessageRateLimit> => {
    const trustScore = dealerTrustScores[dealerId] || 0.5;

    // Dynamic rate limits based on trust score
    // High trust = higher limits, low trust = lower limits
    const limit24h = Math.floor(50 * trustScore); // 0-50 messages per day
    const limitWeek = Math.floor(200 * trustScore); // 0-200 messages per week

    const current = rateLimitStore[dealerId] || {
      dealerId,
      messagesLast24h: 0,
      messagesLastWeek: 0,
      limit24h,
      limitWeek,
      trustScore,
    };

    return current;
  },

  /**
   * Send bulk message (server-side enforcement)
   */
  sendBulkMessage: async (
    dealerId: string,
    dealerName: string,
    context: BulkMessageContext,
    message: string
  ): Promise<BulkMessageJob> => {
    // Check rate limits first
    const rateLimit = await bulkMessageService.checkRateLimit(dealerId);
    
    if (rateLimit.messagesLast24h >= rateLimit.limit24h) {
      throw new Error('Rate limit exceeded: Daily limit reached');
    }

    if (rateLimit.messagesLastWeek >= rateLimit.limitWeek) {
      throw new Error('Rate limit exceeded: Weekly limit reached');
    }

    // Get eligible recipients
    const recipients = await bulkMessageService.getEligibleRecipients(dealerId, context);
    const eligible = recipients.filter(r => r.eligible);

    if (eligible.length === 0) {
      throw new Error('No eligible recipients');
    }

    // Create job
    const job: BulkMessageJob = {
      id: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dealerId,
      context,
      message,
      recipientIds: eligible.map(r => r.userId),
      sentAt: new Date().toISOString(),
      status: 'sending',
      successCount: 0,
      failureCount: 0,
    };

    // Send messages with personalization
    let successCount = 0;
    let failureCount = 0;

    for (const recipient of eligible) {
      try {
        // Personalize message
        const personalizedMessage = message
          .replace(/\{\{firstName\}\}/g, recipient.userName.split(' ')[0])
          .replace(/\{\{name\}\}/g, recipient.userName);

        // Send via existing message service
        messageService.sendMessage(
          recipient.conversationId,
          dealerId,
          dealerName,
          personalizedMessage
        );

        successCount++;
      } catch (error) {
        console.error(`Failed to send to ${recipient.userId}:`, error);
        failureCount++;
      }
    }

    // Update rate limit counters
    rateLimitStore[dealerId] = {
      ...rateLimit,
      messagesLast24h: rateLimit.messagesLast24h + successCount,
      messagesLastWeek: rateLimit.messagesLastWeek + successCount,
    };

    // Update job status
    job.status = 'completed';
    job.successCount = successCount;
    job.failureCount = failureCount;

    // Log for reputation analysis
    bulkMessageService.logBulkSend(job);

    return job;
  },

  /**
   * Log bulk message send for reputation tracking
   */
  logBulkSend: (job: BulkMessageJob): void => {
    // In production: Store in analytics DB
    console.log('[BULK_MESSAGE_ANALYTICS]', {
      jobId: job.id,
      dealerId: job.dealerId,
      context: job.context,
      recipientCount: job.recipientIds.length,
      successCount: job.successCount,
      failureCount: job.failureCount,
      sentAt: job.sentAt,
    });
  },

  /**
   * Track buyer disengagement after bulk message
   */
  trackDisengagement: (conversationId: string, bulkMessageId?: string): void => {
    closedConversations.add(conversationId);

    if (bulkMessageId) {
      // In production: Update reputation score based on disengagement after bulk send
      console.log('[BULK_MESSAGE_DISENGAGEMENT]', {
        conversationId,
        bulkMessageId,
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Silently restrict bulk messaging for dealer (reputation enforcement)
   */
  restrictBulkMessaging: (dealerId: string, reason: string): void => {
    // Silently reduce rate limits without notifying dealer
    rateLimitStore[dealerId] = {
      dealerId,
      messagesLast24h: 0,
      messagesLastWeek: 0,
      limit24h: 5, // Severely restricted
      limitWeek: 20,
      trustScore: 0.2, // Low trust
    };

    console.log('[BULK_MESSAGE_RESTRICTION]', {
      dealerId,
      reason,
      timestamp: new Date().toISOString(),
    });
  },
};
