/**
 * AUDIT ENDPOINT: Deep inspection of dealer_applications table
 * Run this to diagnose why count/visibility differs from Supabase dashboard
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const report: any = {
    timestamp: new Date().toISOString(),
    scenarios: {},
  };

  try {
    // ============================================================
    // SCENARIO 1: Verify Supabase Project Connection
    // ============================================================
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    report.scenarios.scenario1_environment = {
      description: 'Verify correct Supabase project and credentials',
      supabaseUrl,
      projectRef: supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'UNKNOWN',
      hasServiceKey: !!serviceKey,
      serviceKeyPrefix: serviceKey?.substring(0, 20) + '...',
      verdict: supabaseUrl && serviceKey ? '✅ PASS' : '❌ FAIL',
    };

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(report, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // ============================================================
    // SCENARIO 3 & 4: Verify Schema and Table Existence
    // ============================================================
    const { data: allTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name, table_type')
      .eq('table_name', 'dealer_applications');

    report.scenarios.scenario3_4_schema = {
      description: 'Check for duplicate tables or wrong schema',
      tables: allTables || [],
      error: tablesError?.message || null,
      verdict: allTables?.length === 1 && allTables[0].table_schema === 'public' ? '✅ PASS' : '⚠️ INSPECT',
    };

    // ============================================================
    // SCENARIO 2: Count rows with different methods
    // ============================================================
    
    // Method 1: Standard select
    const { data: rows1, error: error1 } = await supabase
      .from('dealer_applications')
      .select('*')
      .order('created_at', { ascending: false });

    // Method 2: Count header
    const { count: count2 } = await supabase
      .from('dealer_applications')
      .select('id', { count: 'exact', head: true });

    // Method 3: Select with count
    const { data: rows3, count: count3 } = await supabase
      .from('dealer_applications')
      .select('*', { count: 'exact' });

    report.scenarios.scenario2_count_methods = {
      description: 'Compare different counting methods',
      method1_select_all: { count: rows1?.length || 0, error: error1?.message || null },
      method2_head_count: { count: count2 },
      method3_select_with_count: { count: count3 },
      rowsReturned: rows1?.length || 0,
      verdict: 
        rows1?.length === count2 && rows1?.length === count3 
          ? '✅ PASS - All methods agree' 
          : '❌ FAIL - Methods disagree',
    };

    // ============================================================
    // SCENARIO 5: Check for Views/Triggers
    // ============================================================
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'dealer_applications');

    report.scenarios.scenario5_triggers_views = {
      description: 'Check for triggers or views that modify visibility',
      isView: allTables?.[0]?.table_type !== 'BASE TABLE',
      triggers: triggers || [],
      verdict: triggers?.length === 0 && allTables?.[0]?.table_type === 'BASE TABLE' ? '✅ PASS' : '⚠️ INSPECT',
    };

    // ============================================================
    // SCENARIO 6 & 7: RLS Policies Check
    // ============================================================
    const { data: rlsEnabled } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'dealer_applications')
      .eq('schemaname', 'public')
      .single();

    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'dealer_applications');

    report.scenarios.scenario6_7_rls = {
      description: 'RLS should not affect service role, but verify',
      rlsEnabled: rlsEnabled?.rowsecurity || false,
      policiesCount: policies?.length || 0,
      policies: policies || [],
      verdict: '✅ PASS - Service role bypasses RLS',
    };

    // ============================================================
    // SCENARIO 8 & 10: Row-level inspection
    // ============================================================
    const rowDetails = rows1?.map((row: any) => ({
      id: row.id,
      email: row.email,
      dealership_name: row.dealership_name,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })) || [];

    const emails = rows1?.map((r: any) => r.email) || [];
    const uniqueEmails = [...new Set(emails)];

    report.scenarios.scenario8_10_data_inspection = {
      description: 'Inspect actual rows returned',
      totalRows: rows1?.length || 0,
      uniqueEmails: uniqueEmails.length,
      hasDuplicates: emails.length !== uniqueEmails.length,
      rows: rowDetails,
      verdict: emails.length === uniqueEmails.length ? '✅ PASS - No duplicates' : '⚠️ WARN - Duplicates found',
    };

    // ============================================================
    // SCENARIO 9: Check for failed inserts in logs (manual check needed)
    // ============================================================
    report.scenarios.scenario9_failed_inserts = {
      description: 'Check Supabase logs for failed inserts (manual verification required)',
      instruction: 'Go to Supabase Dashboard → Logs → Filter by "INSERT INTO dealer_applications"',
      verdict: '⏸️ MANUAL CHECK REQUIRED',
    };

    // ============================================================
    // FINAL VERDICT
    // ============================================================
    report.summary = {
      expectedRows: 2,
      actualRows: rows1?.length || 0,
      discrepancy: 2 - (rows1?.length || 0),
      likelyRootCause: determineLikelyRootCause(report),
    };

    return NextResponse.json(report, { status: 200 });

  } catch (err: any) {
    report.fatalError = {
      message: err.message,
      stack: err.stack,
    };
    return NextResponse.json(report, { status: 500 });
  }
}

function determineLikelyRootCause(report: any): string {
  const actualRows = report.scenarios.scenario8_10_data_inspection?.totalRows || 0;
  
  if (actualRows === 0) {
    return '❌ NO ROWS FOUND - Wrong project, wrong environment, or table is empty';
  }
  
  if (actualRows === 1) {
    return '❌ ONLY 1 ROW FOUND - Second application was never inserted, or was inserted to different project/environment';
  }
  
  if (actualRows === 2) {
    return '✅ 2 ROWS FOUND - Issue is in frontend filtering or mapping logic';
  }
  
  if (actualRows > 2) {
    return '⚠️ MORE THAN 2 ROWS FOUND - Review data integrity';
  }
  
  return '⚠️ UNKNOWN';
}
