/**
 * Dealer Application Service
 * Public anon-safe insert + admin read via API routes
 */

import { DealerApplication } from '@/types';

export const dealerApplicationService = {
  /**
   * Create new application via API route
   * Public endpoint - no auth required
   */
  createApplication: async (
    application: Omit<
      DealerApplication,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >
  ): Promise<void> => {
    const response = await fetch('/api/dealer-applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(application),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to submit application');
    }
  },

  /**
   * Admin-only
   * Fetch all dealer applications via API route
   */
  getAllApplications: async (): Promise<DealerApplication[]> => {
    const response = await fetch('/api/admin/dealer-applications');

    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }

    const { applications } = await response.json();
    return applications ?? [];
  },
};
