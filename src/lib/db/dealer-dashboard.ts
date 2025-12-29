/**
 * DEALER DASHBOARD DATABASE QUERIES (RLS-ENFORCED)
 * 
 * All queries use Supabase client with RLS enforcement.
 * Access control handled by database policies - dealer only sees own data.
 * 
 * RLS Policies (defined in schema-rls.sql):
 * - Listings: Dealers can only view own listings
 * - Conversations: Dealers can only view conversations where dealer_id = auth.uid()
 * - Appointments: Dealers can only view own appointments
 */

import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  newLeadsToday: number;
  activeConversations: number;
  upcomingAppointments: number;
  activeListings: number;
}

export interface TodayPerformance {
  totalViews: number;
  totalSaves: number;
  totalMessages: number;
}

export interface HotListing {
  listingId: string;
  views: number;
  saves: number;
  messages: number;
  engagementScore: number;
}

export interface ConversationNeedingAttention {
  id: string;
  buyerName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  verified?: boolean;
  linkedListing?: {
    year: number;
    make: string;
    model: string;
  };
}

/**
 * Get KPI stats for dealer dashboard
 * Uses dealershipId to scope queries (RLS enforces based on profiles.dealership_id)
 */
export async function getDashboardStats(dealershipId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // New leads today - conversations for this dealership's dealers
  const { count: newLeadsToday } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  // Active conversations - last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { count: activeConversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .gte('last_message_at', sevenDaysAgo.toISOString())
    .eq('archived_by_dealer', false);

  // Upcoming appointments - next 7 days
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  const { count: upcomingAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_at', new Date().toISOString())
    .lte('scheduled_at', sevenDaysFromNow.toISOString())
    .not('status', 'in', '(cancelled,completed)');

  // Active listings - scoped by dealership_id
  const { count: activeListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('dealership_id', dealershipId)
    .eq('status', 'active');

  return {
    newLeadsToday: newLeadsToday || 0,
    activeConversations: activeConversations || 0,
    upcomingAppointments: upcomingAppointments || 0,
    activeListings: activeListings || 0,
  };
}

/**
 * Get today's performance metrics across all listings
 * Scoped by dealership_id
 */
export async function getTodayPerformance(dealershipId: string): Promise<TodayPerformance> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: listings } = await supabase
    .from('listings')
    .select('view_count, inquiry_count')
    .eq('dealership_id', dealershipId);

  const totalViews = listings?.reduce((sum, l) => sum + (l.view_count || 0), 0) || 0;
  const totalMessages = listings?.reduce((sum, l) => sum + (l.inquiry_count || 0), 0) || 0;

  return {
    totalViews,
    totalSaves: 0,
    totalMessages,
  };
}

/**
 * Get hot listings based on engagement
 * Scoped by dealership_id
 */
export async function getHotListings(dealershipId: string): Promise<HotListing[]> {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from('listings')
    .select('id, view_count, inquiry_count')
    .eq('dealership_id', dealershipId)
    .eq('status', 'active')
    .order('view_count', { ascending: false })
    .limit(5);

  return (listings || []).map(l => ({
    listingId: l.id,
    views: l.view_count || 0,
    saves: 0,
    messages: l.inquiry_count || 0,
    engagementScore: (l.view_count || 0) + (l.inquiry_count || 0) * 20,
  }));
}

/**
 * Get conversations needing dealer attention
 * RLS enforced: Only dealer's conversations visible
 */
export async function getNeedsAttention(dealerId: string): Promise<ConversationNeedingAttention[]> {
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      buyer_id,
      last_message_at,
      unread_count_dealer,
      listing_id,
      listings:listing_id(year, make, model)
    `)
    .gt('unread_count_dealer', 0)
    .order('last_message_at', { ascending: false })
    .limit(20);

  if (!conversations) return [];

  // Fetch buyer profiles and last messages
  const conversationsWithDetails = await Promise.all(
    conversations.map(async (c) => {
      const { data: buyer } = await supabase
        .from('profiles')
        .select('name, verified')
        .eq('id', c.buyer_id)
        .single();

      const { data: lastMessage } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        id: c.id,
        buyerName: buyer?.name || 'Unknown',
        lastMessage: sanitizeMessagePreview(lastMessage?.content || ''),
        lastMessageTime: new Date(c.last_message_at),
        unreadCount: c.unread_count_dealer,
        verified: buyer?.verified,
        linkedListing: c.listings ? {
          year: c.listings.year,
          make: c.listings.make,
          model: c.listings.model,
        } : undefined,
      };
    })
  );
  return conversationsWithDetails;
}

/**
 * Sanitize message preview for display
 */
function sanitizeMessagePreview(content: string | null): string {
  if (!content) return 'No message';

  // Strip HTML tags
  let sanitized = content.replace(/<[^>]*>/g, '');

  // Truncate to 80 characters
  if (sanitized.length > 80) {
    sanitized = sanitized.substring(0, 77) + '...';
  }

  return sanitized;
}

/**
 * Get all dashboard data in a single call
 * Uses dealershipId for all scoped queries
 */
export async function getDealerDashboardData(dealershipId: string) {
  const [stats, performance, hotListings, needsAttention] = await Promise.allSettled([
    getDashboardStats(dealershipId),
    getTodayPerformance(dealershipId),
    getHotListings(dealershipId),
    getNeedsAttention(dealershipId),
  ]);

  return {
    stats: stats.status === 'fulfilled' ? stats.value : {
      newLeadsToday: 0,
      activeConversations: 0,
      upcomingAppointments: 0,
      activeListings: 0,
    },
    todayPerformance: performance.status === 'fulfilled' ? performance.value : {
      totalViews: 0,
      totalSaves: 0,
      totalMessages: 0,
    },
    hotListings: hotListings.status === 'fulfilled' ? hotListings.value : [],
    needsAttention: needsAttention.status === 'fulfilled' ? needsAttention.value : [],
  };
}
