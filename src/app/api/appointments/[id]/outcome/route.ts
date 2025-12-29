import { NextRequest, NextResponse } from 'next/server';
import { appointmentsDb } from '@/lib/appointments/db';
import type { OutcomeType, ConfirmationActor } from '@/types/appointments';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { outcome, actor, actor_id } = body;

    if (!outcome || !actor || !actor_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if outcome already declared by this actor
    const existing = await appointmentsDb.getOutcomeDeclaration(
      params.id,
      actor_id
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Outcome already declared' },
        { status: 409 }
      );
    }

    // Create outcome declaration (hidden until both declare)
    const declaration = await appointmentsDb.createOutcomeDeclaration({
      appointment_id: params.id,
      actor: actor as ConfirmationActor,
      actor_id,
      outcome: outcome as OutcomeType,
      submitted_at: new Date(),
    });

    // Check if both parties have declared
    const allDeclarations = await appointmentsDb.getOutcomeDeclarations(
      params.id
    );

    const bothDeclared = allDeclarations.length === 2;

    // If both declared, reveal outcomes
    if (bothDeclared) {
      const revealed = await appointmentsDb.revealOutcomes(params.id);
      return NextResponse.json({
        success: true,
        declaration,
        revealed: true,
        outcomes: revealed,
      });
    }

    return NextResponse.json({
      success: true,
      declaration,
      revealed: false,
      message: 'Waiting for other party to declare outcome',
    });
  } catch (error) {
    console.error('Error declaring outcome:', error);
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
    const outcomes = await appointmentsDb.getOutcomeDeclarations(params.id);

    const revealed = outcomes.length === 2 && outcomes[0].revealed_at;

    return NextResponse.json({
      outcomes: revealed ? outcomes : [],
      revealed,
      count: outcomes.length,
    });
  } catch (error) {
    console.error('Error fetching outcomes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
