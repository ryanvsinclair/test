import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/marketplace/filters
 * 
 * Get available filter options for marketplace
 * 
 * Returns:
 * - Available makes
 * - Available models (filtered by make if provided)
 * - Price range
 * - Year range
 * - Marketplace modes
 * 
 * Security:
 * - Public endpoint (no auth required)
 * - Uses public_listings view
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const make = searchParams.get('make');
    
    const supabase = createClient();
    
    // Get unique makes
    const { data: makes } = await supabase
      .from('public_listings')
      .select('make')
      .order('make');
    
    const uniqueMakes = [...new Set(makes?.map(m => m.make).filter(Boolean))].sort();
    
    // Get unique models (filtered by make if provided)
    let modelsQuery = supabase
      .from('public_listings')
      .select('model')
      .order('model');
    
    if (make) {
      modelsQuery = modelsQuery.ilike('make', make);
    }
    
    const { data: models } = await modelsQuery;
    const uniqueModels = [...new Set(models?.map(m => m.model).filter(Boolean))].sort();
    
    // Get price range
    const { data: priceData } = await supabase
      .from('public_listings')
      .select('price')
      .order('price', { ascending: true });
    
    const prices = priceData?.map(p => p.price).filter(Boolean) || [];
    const priceRange = {
      min: prices[0] || 0,
      max: prices[prices.length - 1] || 0,
    };
    
    // Get year range
    const { data: yearData } = await supabase
      .from('public_listings')
      .select('year')
      .order('year', { ascending: true });
    
    const years = yearData?.map(y => y.year).filter(Boolean) || [];
    const yearRange = {
      min: years[0] || new Date().getFullYear() - 20,
      max: years[years.length - 1] || new Date().getFullYear(),
    };
    
    // Get marketplace modes
    const { data: modesData } = await supabase
      .from('public_listings')
      .select('marketplace_mode');
    
    const uniqueModes = [...new Set(modesData?.map(m => m.marketplace_mode).filter(Boolean))];
    
    return NextResponse.json({
      makes: uniqueMakes,
      models: uniqueModels,
      priceRange,
      yearRange,
      marketplaceModes: uniqueModes,
    });
  } catch (error) {
    console.error('[MARKETPLACE FILTERS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
