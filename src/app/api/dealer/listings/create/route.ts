import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/dealer/listings/create
 * 
 * Create a new listing (draft state)
 * 
 * Security:
 * - Must be authenticated
 * - Must be a dealer
 * - Must have dealership_id
 * - Dealership must be active + enabled
 * - All listings scoped to dealership_id
 * 
 * Request Body:
 * - vin: string (optional but recommended)
 * - year: number (required)
 * - make: string (required)
 * - model: string (required)
 * - trim: string (optional)
 * - price: number (required)
 * - mileage: number (required)
 * - condition: string (optional)
 * - description: string (optional)
 * - features: string[] (optional)
 * - images: string[] (optional)
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get profile with dealership_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, dealership_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 });
    }
    
    if (profile.role !== 'dealer') {
      return NextResponse.json({ error: 'Forbidden: Dealer access required' }, { status: 403 });
    }
    
    if (!profile.dealership_id) {
      return NextResponse.json({ error: 'Forbidden: No dealership linked' }, { status: 403 });
    }
    
    // Verify dealership is active and enabled
    const { data: dealership } = await supabase
      .from('dealerships')
      .select('lifecycle_status, operational_status')
      .eq('id', profile.dealership_id)
      .single();
    
    if (!dealership || dealership.lifecycle_status !== 'active' || dealership.operational_status !== 'enabled') {
      return NextResponse.json({ 
        error: 'Dealership not active', 
        lifecycle_status: dealership?.lifecycle_status,
        operational_status: dealership?.operational_status
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      vin, year, make, model, trim, price, mileage, condition, 
      description, features, images, bodyStyle, transmission, 
      fuelType, exteriorColor, interiorColor 
    } = body;

    // Validate required fields
    if (!year || !make || !model || !price || mileage === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: year, make, model, price, mileage' 
      }, { status: 400 });
    }

    // Create listing in draft state
    const { data: listing, error: createError } = await supabase
      .from('listings')
      .insert({
        dealership_id: profile.dealership_id,
        vin: vin || null,
        year: parseInt(year),
        make,
        model,
        trim: trim || null,
        price: parseFloat(price),
        mileage: parseInt(mileage),
        mileage_unit: 'km',
        condition: condition || null,
        body_style: bodyStyle || null,
        transmission: transmission || null,
        fuel_type: fuelType || null,
        exterior_color: exteriorColor || null,
        interior_color: interiorColor || null,
        description: description || null,
        features: features || [],
        images: images || [],
        primary_image_url: images?.[0] || null,
        status: 'draft',
        marketplace_mode: null,
        road_readiness_state: null,
        market_lane: null,
        view_count: 0,
        inquiry_count: 0,
        running: null,
        inspection_uploaded: false,
        disclosure_acknowledged: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('[LISTINGS CREATE] Error creating listing:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      listing 
    }, { status: 201 });
  } catch (error) {
    console.error('[LISTINGS CREATE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
