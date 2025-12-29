import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/marketplace/listings
 * 
 * Public marketplace listings API
 * 
 * Data Source: public_listings materialized view
 * - Pre-filtered for active listings from enabled dealerships
 * - Pre-joined with dealership data
 * - Indexed for performance
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sortBy: 'published_at' | 'price' | 'mileage' | 'year' (default: 'published_at')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * - marketplaceMode: 'carly_verified' | 'the_hub' | 'builders_market'
 * - minPrice: number
 * - maxPrice: number
 * - minYear: number
 * - maxYear: number
 * - make: string
 * - model: string
 * - roadReadinessState: 'carly_verified' | 'the_hub' | 'builders_market'
 * 
 * Security:
 * - Public endpoint (no auth required)
 * - Uses materialized view (already filtered)
 * - No RLS needed (view handles filtering)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'published_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    // Filters
    const marketplaceMode = searchParams.get('marketplaceMode');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const roadReadinessState = searchParams.get('roadReadinessState');
    
    const supabase = createClient();
    
    // Build query on materialized view
    let query = supabase
      .from('public_listings')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (marketplaceMode) {
      query = query.eq('marketplace_mode', marketplaceMode);
    }
    
    if (roadReadinessState) {
      query = query.eq('road_readiness_state', roadReadinessState);
    }
    
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    
    if (minYear) {
      query = query.gte('year', parseInt(minYear));
    }
    
    if (maxYear) {
      query = query.lte('year', parseInt(maxYear));
    }
    
    if (make) {
      query = query.ilike('make', make);
    }
    
    if (model) {
      query = query.ilike('model', model);
    }
    
    // Apply sorting
    const validSortFields = ['published_at', 'price', 'mileage', 'year', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'published_at';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data: listings, error, count } = await query;
    
    if (error) {
      console.error('[MARKETPLACE] Error fetching listings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const totalPages = count ? Math.ceil(count / limit) : 0;
    
    return NextResponse.json({
      listings: listings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('[MARKETPLACE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
