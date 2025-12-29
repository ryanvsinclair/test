import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentTimeline } from '@/lib/appointments/state-machine';
// Mock data removed - connect to real database

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Connect to real database
    const timeline = await getAppointmentTimeline(params.id);

    return NextResponse.json(timeline);
  } catch (error: any) {
    // If appointment not found, return 404 instead of 500
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
