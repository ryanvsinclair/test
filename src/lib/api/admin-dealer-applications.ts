/**
 * Admin-only operations for dealer applications
 * All data access through admin API routes (service role)
 */

/**
 * Get count of pending applications
 * Fetches from admin API route (server-side with service role)
 */
export async function getPendingApplicationsCount(): Promise<number> {
  try {
    const response = await fetch('/api/admin/dealer-applications', {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[ADMIN] Failed to fetch applications:', response.status);
      return 0;
    }

    const { applications } = await response.json();
    const pending = applications.filter((app: { status: string }) => app.status === 'pending');
    return pending.length;
  } catch (error) {
    console.error('[ADMIN] Failed to count pending applications:', error);
    return 0;
  }
}

/**
 * Approve dealer application
 * Calls server API route which has service role access
 * Admin-only via RLS
 */
export async function approveDealerApplication(applicationId: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/admin/approve-dealer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applicationId }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to approve application' };
    }
    
    return { success: true };
  } catch (err) {
    console.error('[ADMIN] Approval failed:', err);
    return { success: false, error: 'Failed to approve application' };
  }
}
