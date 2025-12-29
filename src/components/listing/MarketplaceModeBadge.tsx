/**
 * Road Readiness State Badge Component
 * Displays visual badge on all listing views
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Wrench, Hammer, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  RoadReadinessState, 
  ROAD_READINESS_STATES,
  labelForState 
} from '@/lib/marketplace/roadReadinessStates';

interface RoadReadinessBadgeProps {
  state: RoadReadinessState;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function RoadReadinessBadge({ 
  state, 
  size = 'md',
  showIcon = true 
}: RoadReadinessBadgeProps) {
  const config = getStateConfig(state);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };
  
  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  };
  
  return (
    <Badge 
      className={cn(
        'inline-flex items-center font-medium',
        sizeClasses[size],
        config.className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </Badge>
  );
}

// Backward compatibility
export function MarketplaceModeBadge(props: any) {
  const stateMap: Record<string, RoadReadinessState> = {
    'road-ready': ROAD_READINESS_STATES.CARLY_VERIFIED,
    'near-road-ready': ROAD_READINESS_STATES.THE_HUB,
    'builders-market': ROAD_READINESS_STATES.BUILDERS_MARKET
  };
  
  const state = stateMap[props.mode] || props.mode || ROAD_READINESS_STATES.CARLY_VERIFIED;
  return <RoadReadinessBadge state={state} size={props.size} showIcon={props.showIcon} />;
}

/**
 * Get state configuration for badge display
 */
function getStateConfig(state: RoadReadinessState) {
  switch (state) {
    case ROAD_READINESS_STATES.CARLY_VERIFIED:
      return {
        label: labelForState(ROAD_READINESS_STATES.CARLY_VERIFIED),
        icon: CheckCircle,
        className: 'bg-green-500 text-white border-green-600 hover:bg-green-600'
      };
    case ROAD_READINESS_STATES.NEW_INVENTORY:
      return {
        label: labelForState(ROAD_READINESS_STATES.NEW_INVENTORY),
        icon: Sparkles,
        className: 'bg-slate-500 text-white border-slate-600 hover:bg-slate-600'
      };
    case ROAD_READINESS_STATES.THE_HUB:
      return {
        label: labelForState(ROAD_READINESS_STATES.THE_HUB),
        icon: Wrench,
        className: 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
      };
    case ROAD_READINESS_STATES.BUILDERS_MARKET:
      return {
        label: labelForState(ROAD_READINESS_STATES.BUILDERS_MARKET),
        icon: Hammer,
        className: 'bg-purple-500 text-white border-purple-600 hover:bg-purple-600'
      };
    default:
      return {
        label: 'Unknown',
        icon: CheckCircle,
        className: 'bg-gray-500 text-white'
      };
  }
}
