import { NextRequest, NextResponse } from 'next/server';
import { appointmentsDb } from '@/lib/appointments/db';
import { initializeAppointmentSteps } from '@/lib/appointments/state-machine';
import type { AppointmentType } from '@/types/appointments';
// Mock data removed - connect to real database

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      listing_id,
      buyer_id,
      seller_id,
      seller_type,
      staff_id,
      appointment_type,
      proposed_datetime,
      location,
    } = body;

    if (
      !listing_id ||
      !buyer_id ||
      !seller_id ||
      !seller_type ||
      !appointment_type ||
      !proposed_datetime ||
      !location
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create appointment
    const appointment = await appointmentsDb.createAppointment({
      listing_id,
      buyer_id,
      seller_id,
      seller_type,
      staff_id,
      appointment_type: appointment_type as AppointmentType,
      proposed_datetime: new Date(proposed_datetime),
      location,
      status: 'pending_confirmation',
      current_step: 'created',
      metadata: {},
    });

    // Initialize steps
    const steps = await initializeAppointmentSteps(appointment.id);

    return NextResponse.json({
      success: true,
      appointment,
      steps,
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyer_id = searchParams.get('buyer_id');
    const seller_id = searchParams.get('seller_id');
    const staff_id = searchParams.get('staff_id');

    let appointments;

    if (buyer_id) {
      // TODO: Connect to real database
      appointments = await appointmentsDb.getAppointmentsByBuyer(buyer_id);
    } else if (seller_id) {
      appointments = await appointmentsDb.getAppointmentsBySeller(seller_id);
    } else if (staff_id) {
      appointments = await appointmentsDb.getAppointmentsByStaff(staff_id);
    } else {
      return NextResponse.json(
        { error: 'buyer_id, seller_id, or staff_id required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
