import { NextRequest, NextResponse } from 'next/server';
import { createVehicleListing, requestReclassification } from '@/lib/api/market-lanes';

/**
 * POST /api/listings/create
 * Create new vehicle listing with automatic market lane classification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listing, sellerId } = body;
    
    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID required' },
        { status: 400 }
      );
    }
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing data required' },
        { status: 400 }
      );
    }
    
    const result = await createVehicleListing(listing, sellerId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        listingId: result.listingId,
        marketLane: result.marketLane
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('[Listings API] Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
