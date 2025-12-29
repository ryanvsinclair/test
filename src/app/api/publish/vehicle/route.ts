import { NextRequest, NextResponse } from 'next/server';
import { PublishFlowData } from '@/types/publish-flow';
import { RoadReadinessState } from '@/types';
import { assignRoadReadinessState, validatePublishFlowData } from '@/lib/publish/state-assignment';

/**
 * POST /api/publish/vehicle
 * Publish vehicle to marketplace with full flow enforcement
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vehicleId, flowData } = body as {
      vehicleId: string;
      flowData: PublishFlowData;
    };
    
    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }
    
    // Validate flow data completeness
    const validation = validatePublishFlowData(flowData);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Publish flow incomplete',
          validationErrors: validation.errors
        },
        { status: 400 }
      );
    }
    
    // Server-side state assignment (cannot be overridden)
    const assignedState = assignRoadReadinessState(flowData);
    
    // TODO: Get user from auth session
    const userId = 'user-id-from-session';
    
    // TODO: Get IP and user agent from request
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent');
    
    // TODO: Upload inspection file if provided
    // const inspectionFileUrl = flowData.inspectionFile
    //   ? await uploadFile(flowData.inspectionFile, 'inspections')
    //   : undefined;
    
    // TODO: Replace with actual database mutations
    // 1. Insert publish log
    // const { data: publishLog, error: logError } = await supabase
    //   .from('vehicle_publish_logs')
    //   .insert({
    //     vehicle_id: vehicleId,
    //     user_id: userId,
    //     is_running: flowData.isRunning,
    //     is_drivable: flowData.isDrivable,
    //     is_legally_operable: flowData.isLegallyOperable,
    //     inspection_status: flowData.inspectionStatus,
    //     inspection_file_url: inspectionFileUrl,
    //     issue_severity: flowData.issueSeverity,
    //     issue_description: flowData.issueDescription,
    //     assigned_road_readiness_state: assignedState,
    //     acknowledgement_confirmed: flowData.acknowledgementConfirmed,
    //     acknowledgement_timestamp: flowData.acknowledgementTimestamp,
    //     user_ip_address: ipAddress,
    //     user_agent: userAgent
    //   })
    //   .select()
    //   .single();
    
    // 2. Update vehicle listing
    // const { error: updateError } = await supabase
    //   .from('vehicle_listings')
    //   .update({
    //     status: 'published',
    //     road_readiness_state: assignedState,
    //     running: flowData.isRunning,
    //     inspection_uploaded: flowData.inspectionStatus !== 'none',
    //     inspection_file_url: inspectionFileUrl,
    //     issue_severity: flowData.issueSeverity,
    //     published_at: new Date().toISOString()
    //   })
    //   .eq('id', vehicleId);
    
    console.log('[PUBLISH] Vehicle published:', {
      vehicleId,
      assignedState,
      userId,
      ipAddress
    });
    
    return NextResponse.json({
      success: true,
      vehicleId,
      assignedState,
      message: `Vehicle successfully published as ${assignedState.replace('_', ' ')}`
    });
  } catch (error: unknown) {
    console.error('[PUBLISH API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to publish vehicle' },
      { status: 500 }
    );
  }
}
