import { NextRequest, NextResponse } from 'next/server';
import { getAsIsVehicles, getAsIsVehicleById } from '@/lib/api/as-is-vehicles';

/**
 * GET /api/as-is-vehicles
 * Fetch AS-IS / Project vehicles with filters
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const filters = {
    runningStatus: searchParams.get('runningStatus') as any,
    priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
    priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
    make: searchParams.get('make') || undefined,
    year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
    location: searchParams.get('location') || undefined,
    sortBy: searchParams.get('sortBy') as any || 'newest',
  };
  
  // Check for single vehicle request
  const listingId = searchParams.get('listingId');
  if (listingId) {
    try {
      const vehicle = await getAsIsVehicleById(listingId);
      
      if (!vehicle) {
        return NextResponse.json(
          { error: 'Vehicle not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ vehicle });
    } catch (error: unknown) {
      console.error('[AS-IS API] Error fetching vehicle:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vehicle' },
        { status: 500 }
      );
    }
  }
  
  // Fetch all AS-IS vehicles with filters
  try {
    const vehicles = await getAsIsVehicles(filters);
    return NextResponse.json({ vehicles });
  } catch (error: unknown) {
    console.error('[AS-IS API] Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AS-IS vehicles' },
      { status: 500 }
    );
  }
}
