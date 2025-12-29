/**
 * 🚨 BANNED FOR PRODUCTION: pg Pool Database Client
 * 
 * This file uses node-postgres (pg) which BYPASSES Supabase RLS policies.
 * 
 * STATUS: DISABLED FOR USER-FACING FEATURES
 * 
 * All user-facing queries MUST use:
 * - src/lib/supabase/server.ts (RLS enforced)
 * - src/lib/supabase/admin.ts (admin operations only)
 * 
 * This file kept ONLY for:
 * - Health checks
 * - Internal tooling (if needed)
 * 
 * HARD GUARDRAIL: Throws error if used in request context
 */

import { Pool, QueryResult } from 'pg';
import { logger } from '@/lib/logger';

// Runtime check: throw if used from request context
function ensureNotInRequestContext() {
  // Check if we're in a Next.js request context
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    const stack = new Error().stack || '';
    
    // If called from /app/api or route handler, throw
    if (stack.includes('/app/api/') || stack.includes('route.ts') || stack.includes('route.js')) {
      throw new Error(
        '🚨 SECURITY VIOLATION: pg Pool cannot be used in API routes. ' +
        'Use Supabase client from src/lib/supabase/server.ts instead. ' +
        'This bypasses RLS and is banned for production.'
      );
    }
  }
}

// Validate required environment variables
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn(
    '[DB CLIENT] DATABASE_URL not configured. ' +
    'This is expected if using Supabase exclusively.'
  );
}

// Create connection pool (or null if DATABASE_URL not set)
// Note: In Supabase-only deployments, this will be null
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false, // Required for AWS RDS
  } : undefined,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}) : null;

// Log connection errors
if (pool) {
  pool.on('error', (err) => {
    logger.error('Unexpected database error', {
      error: err.message,
      stack: err.stack,
    });
  });
}

/**
 * Database query interface
 * 
 * ⚠️ WARNING: All queries via this client BYPASS RLS
 * Use src/lib/supabase/server.ts instead for user-facing features
 * 
 * HARD GUARDRAIL: Throws error in production if called from API routes
 */
export const db = {
  /**
   * Execute a parameterized query
   * 
   * ⚠️ BYPASSES RLS - Use only for:
   * - Health checks
   * - Internal tooling
   * 
   * THROWS in production if called from request context
   */
  async query(text: string, params?: any[]): Promise<QueryResult> {
    ensureNotInRequestContext();
    
    if (!pool) {
      const error = 'Database query attempted without DATABASE_URL configured';
      if (process.env.NODE_ENV === 'production') {
        throw new Error(error);
      }
      logger.warn(error);
      return { rows: [], rowCount: 0 } as QueryResult;
    }

    const start = Date.now();
    
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        logger.warn('Slow query detected', {
          query: text.substring(0, 100),
          duration_ms: duration,
          rows: result.rowCount,
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Database query error', {
        query: text.substring(0, 100),
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },

  /**
   * Get a client from the pool for transactions
   * 
   * ⚠️ BYPASSES RLS
   * THROWS in production if called from request context
   */
  async getClient() {
    ensureNotInRequestContext();
    
    if (!pool) {
      throw new Error('Database not configured');
    }
    return pool.connect();
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!pool) {
      return false;
    }
    try {
      const result = await pool.query('SELECT 1');
      return result.rows.length === 1;
    } catch (error) {
      return false;
    }
  },

  /**
   * Close all connections (for graceful shutdown)
   */
  async close() {
    if (pool) {
      await pool.end();
    }
  },
};

