/**
 * ⚠️ ARCHIVED - DO NOT USE ⚠️
 * 
 * This file contains legacy test drive logic that has been replaced
 * by the unified Appointment system.
 * 
 * This file is kept for historical reference only.
 * 
 * ✅ NEW CODE MUST USE:
 * - @/lib/appointments/db
 * - @/lib/appointments/state-machine
 * 
 * All test drive requests are now created as appointments with type: 'test_drive'
 * 
 * Archived: December 2024
 */

export const ARCHIVED_NOTICE = 'This file has been archived. Use @/lib/appointments/* instead.';

// All logic below this line is inactive and archived for reference only

  createRequest: (
    request: Omit<TestDriveRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'version'>,
    idempotencyKey?: string
  ): { success: boolean; request?: TestDriveRequest; error?: string } => {
    // Idempotency check
    const autoKey = idempotencyKey || generateIdempotencyKey(
      request.buyerId,
      request.vehicleId,
      Date.now()
    );
    
    if (requestIdempotencyKeys.has(autoKey)) {
      const existingRequestId = requestIdempotencyKeys.get(autoKey);
      const existingRequest = testDriveRequests.find(r => r.id === existingRequestId);
      if (existingRequest) {
        return { success: true, request: existingRequest };
      }
    }

    // Parse requested time window
    const windowStart = new Date(request.requestedWindowStart);
    const windowEnd = new Date(request.requestedWindowEnd);

    // Check for buyer overlapping appointments
    if (hasOverlappingAppointment(request.buyerId, windowStart, windowEnd)) {
      return {
        success: false,
        error: 'You already have a confirmed test drive during this time. Please choose a different time.'
      };
    }

    // Create the request
    const newRequest: TestDriveRequest = {
      ...request,
      id: `td-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'requested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    
    testDriveRequests.push(newRequest);
    
    // Store idempotency key temporarily
    requestIdempotencyKeys.set(autoKey, newRequest.id);
    setTimeout(() => requestIdempotencyKeys.delete(autoKey), REQUEST_IDEMPOTENCY_TIMEOUT);

    // Create or update conversation thread
    if (newRequest.conversationId) {
      messageService.sendMessage(newRequest.conversationId, {
        senderId: request.buyerId,
        senderName: request.buyerName,
        content: `Test drive requested for ${request.requestedDate} at ${request.requestedTime}${request.buyerMessage ? ': ' + request.buyerMessage : ''}`,
        isSystemMessage: true,
      });
    }

    return { success: true, request: newRequest };
  },

  /**
   * Get requests by buyer ID
   */
  getByBuyerId: (buyerId: string): TestDriveRequest[] => {
    return testDriveRequests.filter(req => req.buyerId === buyerId);
  },

  /**
   * Get requests by dealer ID
   */
  getByDealerId: (dealerId: string): TestDriveRequest[] => {
    return testDriveRequests.filter(req => req.dealerId === dealerId);
  },

  /**
   * Get requests by listing ID (for showing on listing rows)
   */
  getByListingId: (listingId: string): TestDriveRequest[] => {
    return testDriveRequests.filter(req => req.listingId === listingId);
  },

  /**
   * Get single request by ID
   */
  getById: (requestId: string): TestDriveRequest | undefined => {
    return testDriveRequests.find(req => req.id === requestId);
  },

  /**
   * Dealer: Approve request and confirm exact datetime
   */
  approveRequest: (
    requestId: string,
    dealerId: string,
    confirmedAt: string,
    assignedSalesperson?: TestDriveRequest['assignedSalesperson'],
    dealerResponse?: string
  ): { success: boolean; request?: TestDriveRequest; error?: string } => {
    const request = testDriveRequests.find(req => req.id === requestId);
    
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Authorization check
    if (request.dealerId !== dealerId) {
      return { success: false, error: 'Unauthorized: You can only approve your own requests' };
    }

    // State validation
    if (!isValidTransition(request.status, 'confirmed')) {
      return { success: false, error: `Cannot approve request in ${request.status} state` };
    }

    // Check for dealer overlap
    const confirmedTime = new Date(confirmedAt);
    const confirmedEnd = new Date(confirmedTime.getTime() + 60 * 60 * 1000);
    
    if (hasDealerOverlap(dealerId, request.vehicleId, confirmedTime, confirmedEnd, requestId)) {
      return {
        success: false,
        error: 'This time slot is already booked for this vehicle. Please choose a different time.'
      };
    }

    // Update request
    request.status = 'confirmed';
    request.confirmedAt = confirmedAt;
    request.assignedSalesperson = assignedSalesperson;
    request.dealerResponse = dealerResponse;
    request.updatedAt = new Date().toISOString();
    request.version++;

    // Send notification via conversation
    if (request.conversationId) {
      messageService.sendMessage(request.conversationId, {
        senderId: dealerId,
        senderName: request.dealerName,
        content: `Test drive confirmed for ${new Date(confirmedAt).toLocaleString()}${dealerResponse ? '. ' + dealerResponse : ''}`,
        isSystemMessage: true,
      });
    }

    return { success: true, request };
  },

  /**
   * Dealer: Propose reschedule with alternate times
   */
  proposeReschedule: (
    requestId: string,
    dealerId: string,
    proposedWindowStart: string,
    proposedWindowEnd: string,
    dealerResponse?: string
  ): { success: boolean; request?: TestDriveRequest; error?: string } => {
    const request = testDriveRequests.find(req => req.id === requestId);
    
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Authorization check
    if (request.dealerId !== dealerId) {
      return { success: false, error: 'Unauthorized' };
    }

    // State validation
    if (!isValidTransition(request.status, 'reschedule_proposed')) {
      return { success: false, error: `Cannot propose reschedule in ${request.status} state` };
    }

    // Update request
    request.status = 'reschedule_proposed';
    request.proposedWindowStart = proposedWindowStart;
    request.proposedWindowEnd = proposedWindowEnd;
    request.dealerResponse = dealerResponse;
    request.updatedAt = new Date().toISOString();
    request.version++;

    // Send notification
    if (request.conversationId) {
      messageService.sendMessage(request.conversationId, {
        senderId: dealerId,
        senderName: request.dealerName,
        content: `Alternate time proposed: ${new Date(proposedWindowStart).toLocaleString()} - ${new Date(proposedWindowEnd).toLocaleString()}${dealerResponse ? '. ' + dealerResponse : ''}`,
        isSystemMessage: true,
      });
    }

    return { success: true, request };
  },

  /**
   * Dealer: Decline request
   */
  declineRequest: (
    requestId: string,
    dealerId: string,
    declineReason: string
  ): { success: boolean; request?: TestDriveRequest; error?: string } => {
    const request = testDriveRequests.find(req => req.id === requestId);
    
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Authorization check
    if (request.dealerId !== dealerId) {
      return { success: false, error: 'Unauthorized' };
    }

    // State validation
    if (!isValidTransition(request.status, 'declined')) {
      return { success: false, error: `Cannot decline request in ${request.status} state` };
    }

    // Update request
    request.status = 'declined';
    request.declineReason = declineReason;
    request.updatedAt = new Date().toISOString();
    request.version++;

    // Send notification
    if (request.conversationId) {
      messageService.sendMessage(request.conversationId, {
        senderId: dealerId,
        senderName: request.dealerName,
        content: `Test drive request declined. Reason: ${declineReason}`,
        isSystemMessage: true,
      });
    }

    return { success: true, request };
  },

  /**
   * Buyer: Accept reschedule proposal
   */
  acceptReschedule: (
    requestId: string,
    buyerId: string
  ): { success: boolean; request?: TestDriveRequest; error?: string } => {
    const request = testDriveRequests.find(req => req.id === requestId);
    
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Authorization check
    if (request.buyerId !== buyerId) {
      return { success: false, error: 'Unauthorized' };
    }

    // State validation
    if (request.status !== 'reschedule_proposed') {
      return { success: false, error: 'No reschedule proposal to accept' };
    }

    if (!request.proposedWindowStart || !request.proposedWindowEnd) {
      return { success: false, error: 'Invalid reschedule proposal' };
    }

    // Update request to confirmed with proposed time
    request.status = 'confirmed';
    request.confirmedAt = request.proposedWindowStart;
    request.updatedAt = new Date().toISOString();
    request.version++;

    // Send notification
    if (request.conversationId) {
      messageService.sendMessage(request.conversationId, {
        senderId: buyerId,
        senderName: request.buyerName,
        content: `Reschedule accepted. Confirmed for ${new Date(request.proposedWindowStart).toLocaleString()}`,
        isSystemMessage: true,
      });
    }

    return { success: true, request };
  },

  /**
   * Buyer: Cancel request
   */
  cancelRequest: (
    requestId: string,
    buyerId: string,
    cancelReason?: string
  ): { success: boolean; request?: TestDriveRequest; error?: string } => {
    const request = testDriveRequests.find(req => req.id === requestId);
    
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Authorization check
    if (request.buyerId !== buyerId) {
      return { success: false, error: 'Unauthorized' };
    }

    // State validation
    if (!isValidTransition(request.status, 'cancelled')) {
      return { success: false, error: `Cannot cancel request in ${request.status} state` };
    }

    // Update request
    request.status = 'cancelled';
    request.cancelReason = cancelReason;
    request.updatedAt = new Date().toISOString();
    request.version++;

    // Send notification
    if (request.conversationId) {
      messageService.sendMessage(request.conversationId, {
        senderId: buyerId,
        senderName: request.buyerName,
        content: `Test drive cancelled${cancelReason ? '. Reason: ' + cancelReason : ''}`,
        isSystemMessage: true,
      });
    }

    return { success: true, request };
  },

  /**
   * Dealer: Mark as completed
   */
  markCompleted: (
    requestId: string,
    dealerId: string
  ): { success: boolean; request?: TestDriveRequest; error?: string } => {
    const request = testDriveRequests.find(req => req.id === requestId);
    
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Authorization check
    if (request.dealerId !== dealerId) {
      return { success: false, error: 'Unauthorized' };
    }

    // State validation
    if (!isValidTransition(request.status, 'completed')) {
      return { success: false, error: `Cannot mark as completed in ${request.status} state` };
    }

    // Update request
    request.status = 'completed';
    request.updatedAt = new Date().toISOString();
    request.version++;

    return { success: true, request };
  },

  /**
   * Dealer: Mark as no-show
   */
  markNoShow: (
    requestId: string,
    dealerId: string,
    noShowReason?: string
  ): { success: boolean; request?: TestDriveRequest; error?: string } => {
    const request = testDriveRequests.find(req => req.id === requestId);
    
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Authorization check
    if (request.dealerId !== dealerId) {
      return { success: false, error: 'Unauthorized' };
    }

    // State validation
    if (!isValidTransition(request.status, 'no_show')) {
      return { success: false, error: `Cannot mark as no-show in ${request.status} state` };
    }

    // Update request
    request.status = 'no_show';
    request.noShowReason = noShowReason;
    request.updatedAt = new Date().toISOString();
    request.version++;

    return { success: true, request };
  },

  /**
   * Auto-cancel requests when listing changes status
   */
  autoCancelByListing: (
    listingId: string,
    reason: string
  ): number => {
    let cancelledCount = 0;
    
    testDriveRequests.forEach(request => {
      if (request.listingId === listingId && 
          request.status !== 'completed' && 
          request.status !== 'declined' &&
          request.status !== 'cancelled' &&
          request.status !== 'no_show') {
        
        request.status = 'cancelled';
        request.cancelReason = reason;
        request.updatedAt = new Date().toISOString();
        request.version++;
        cancelledCount++;

        // Send notification
        if (request.conversationId) {
          messageService.sendMessage(request.conversationId, {
            senderId: request.dealerId,
            senderName: request.dealerName,
            content: `Test drive automatically cancelled. Reason: ${reason}`,
            isSystemMessage: true,
          });
        }
      }
    });

    return cancelledCount;
  },

  /**
   * Check if listing can accept new test drive requests
   */
  canAcceptRequests: (listingStatus: 'active' | 'pending' | 'paused' | 'sold'): { canAccept: boolean; reason?: string } => {
    if (listingStatus === 'sold') {
      return { canAccept: false, reason: 'This vehicle has been sold and is no longer available for test drives.' };
    }
    
    if (listingStatus === 'pending' || listingStatus === 'paused') {
      return { canAccept: false, reason: 'This listing is currently not accepting test drive requests. Please contact the dealer directly.' };
    }

    return { canAccept: true };
  },

  /**
   * Get statistics for dealer dashboard
   */
  getDealerStats: (dealerId: string) => {
    const dealerRequests = testDriveRequests.filter(req => req.dealerId === dealerId);
    
    return {
      total: dealerRequests.length,
      requested: dealerRequests.filter(r => r.status === 'requested').length,
      rescheduleProposed: dealerRequests.filter(r => r.status === 'reschedule_proposed').length,
      confirmed: dealerRequests.filter(r => r.status === 'confirmed').length,
      completed: dealerRequests.filter(r => r.status === 'completed').length,
      noShow: dealerRequests.filter(r => r.status === 'no_show').length,
      cancelled: dealerRequests.filter(r => r.status === 'cancelled').length,
      declined: dealerRequests.filter(r => r.status === 'declined').length,
    };
  },
};
