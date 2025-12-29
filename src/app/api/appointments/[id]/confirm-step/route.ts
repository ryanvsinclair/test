import { NextRequest, NextResponse } from 'next/server';
import { confirmStep } from '@/lib/appointments/state-machine';
import { syncAppointmentToReputation } from '@/lib/appointments/reputation-integration';
// Mock data removed - connect to real database
import type { StepType, ConfirmationActor } from '@/types/appointments';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { step_type, actor, actor_id } = body;

    if (!step_type || !actor || !actor_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Connect to real database for appointment confirmations

    const result = await confirmStep(
      params.id,
      step_type as StepType,
      actor as ConfirmationActor,
      actor_id
    );

    // Sync to reputation system if step completed
    if (result.step.status === 'completed') {
      await syncAppointmentToReputation(params.id, step_type);
    }

    return NextResponse.json({
      success: true,
      step: result.step,
      event: result.event,
      signals: result.signals,
    });
  } catch (error: any) {
    console.error('Error confirming step:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
