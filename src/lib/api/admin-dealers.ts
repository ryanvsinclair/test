/**
 * Admin API for dealer metrics and oversight
 * All data access through admin API routes (service role)
 */

export interface DealerMetrics {
  dealer_id: string;
  dealer_email: string;
  dealer_name: string;
  dealer_status: 'pending' | 'approved' | 'rejected';
  onboarded_at: string;
  
  // Listing metrics
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  
  // Engagement metrics
  total_conversations: number;
  total_messages: number;
  unread_messages: number;
  
  // Appointment metrics
  total_appointments: number;
  scheduled_appointments: number;
  completed_appointments: number;
  
  // Activity
  last_activity_at: string | null;
}

export interface DealerDetailMetrics extends DealerMetrics {
  deleted_listings: number;
  active_conversations: number;
  messages_sent: number;
  messages_received: number;
  avg_response_time_hours: number | null;
  cancelled_appointments: number;
  recent_listings_7d: number;
  recent_messages_7d: number;
  recent_appointments_7d: number;
}

/**
 * Get overview metrics for all dealers
 * Fetches from admin API route (server-side with service role)
 */
export async function getDealerOverview(): Promise<DealerMetrics[]> {
  try {
    const response = await fetch('/api/admin/dealer-metrics', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dealer metrics');
    }

    const { dealers } = await response.json();
    return dealers || [];
  } catch (error) {
    console.error('[ADMIN] Failed to fetch dealer overview:', error);
    throw new Error('Failed to fetch dealer metrics');
  }
}

/**
 * Get detailed metrics for a specific dealer
 * Admin-only: Enforced by RLS
 */
export async function getDealerDetailMetrics(dealerId: string): Promise<DealerDetailMetrics | null> {
  const supabase = getSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .rpc('get_dealer_detail_metrics', { target_dealer_id: dealerId });
  
  if (error) {
    console.error('[ADMIN] Failed to fetch dealer detail metrics:', error);
    throw new Error('Failed to fetch dealer detail metrics');
  }
  
  return data?.[0] || null;
}

/**
 * Get dealer's recent listings
 * Admin-only: Enforced by RLS
 */
export async function getDealerListings(dealerId: string, limit: number = 10) {
  const supabase = getSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('listings')
    .select('id, vin, year, make, model, status, created_at, updated_at')
    .eq('dealer_id', dealerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[ADMIN] Failed to fetch dealer listings:', error);
    throw new Error('Failed to fetch dealer listings');
  }
  
  return data || [];
}

/**
 * Get dealer's recent conversations
 * Admin-only: Enforced by RLS
 */
export async function getDealerConversations(dealerId: string, limit: number = 10) {
  const supabase = getSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('conversations')
    .select('id, buyer_id, listing_id, status, unread_count, last_message_at, created_at')
    .eq('dealer_id', dealerId)
    .order('last_message_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[ADMIN] Failed to fetch dealer conversations:', error);
    throw new Error('Failed to fetch dealer conversations');
  }
  
  return data || [];
}

/**
 * Get dealer's recent appointments
 * Admin-only: Enforced by RLS
 */
export async function getDealerAppointments(dealerId: string, limit: number = 10) {
  const supabase = getSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('appointments')
    .select('id, buyer_id, listing_id, scheduled_at, status, created_at')
    .eq('dealer_id', dealerId)
    .order('scheduled_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[ADMIN] Failed to fetch dealer appointments:', error);
    throw new Error('Failed to fetch dealer appointments');
  }
  
  return data || [];
}
