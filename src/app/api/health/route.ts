/**
 * Health check endpoint for AWS ALB/ECS
 * Returns 200 if app + database are healthy, 500 otherwise
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, boolean> = {
    app: true,
    database: false,
  };

  try {
    // Check database connectivity
    checks.database = await db.healthCheck();

    // If any check fails, return 500
    const allHealthy = Object.values(checks).every(check => check);

    if (!allHealthy) {
      logger.warn('Health check failed', { checks });
      return NextResponse.json(
        {
          status: 'unhealthy',
          checks,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // All checks passed
    return NextResponse.json(
      {
        status: 'healthy',
        checks,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Health check error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        status: 'error',
        checks,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
