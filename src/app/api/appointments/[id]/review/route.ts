import { NextRequest, NextResponse } from 'next/server';
import { appointmentsDb } from '@/lib/appointments/db';
import type { ConfirmationActor } from '@/types/appointments';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      reviewer_type,
      reviewer_id,
      punctuality_rating,
      professionalism_rating,
      communication_rating,
      accuracy_rating,
      text_comment,
    } = body;

    if (
      !reviewer_type ||
      !reviewer_id ||
      !punctuality_rating ||
      !professionalism_rating ||
      !communication_rating ||
      !accuracy_rating
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existing = await appointmentsDb.getStepReview(
      params.id,
      reviewer_id
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Review already submitted' },
        { status: 409 }
      );
    }

    // Get reviewed step (final step)
    const steps = await appointmentsDb.getAppointmentSteps(params.id);
    const reviewedStep = steps.find((s) => s.step_type === 'reviewed');

    if (!reviewedStep) {
      return NextResponse.json(
        { error: 'Appointment not ready for review' },
        { status: 400 }
      );
    }

    // Create review
    const review = await appointmentsDb.createStepReview({
      appointment_id: params.id,
      appointment_step_id: reviewedStep.id,
      reviewer_type: reviewer_type as ConfirmationActor,
      reviewer_id,
      punctuality_rating,
      professionalism_rating,
      communication_rating,
      accuracy_rating,
      text_comment,
    });

    // Generate professionalism signal
    const avgRating =
      (punctuality_rating +
        professionalism_rating +
        communication_rating +
        accuracy_rating) /
      4;

    const profScore = (avgRating / 5) * 100;

    const target_type = reviewer_type === 'buyer' ? 'seller' : 'buyer';
    const appointment = await appointmentsDb.getAppointment(params.id);

    if (appointment) {
      const target_id =
        target_type === 'buyer'
          ? appointment.buyer_id
          : appointment.seller_id;

      await appointmentsDb.createReputationSignal({
        appointment_id: params.id,
        signal_type: 'professionalism',
        target_type: target_type as 'buyer' | 'seller',
        target_id,
        value: profScore,
        weight: 0.5, // Review-based signals are secondary
        context: {
          ratings: {
            punctuality: punctuality_rating,
            professionalism: professionalism_rating,
            communication: communication_rating,
            accuracy: accuracy_rating,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await appointmentsDb.getStepReviews(params.id);

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
