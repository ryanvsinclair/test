'use client';

import { UserVehicle } from '@/types';
import { Wrench, Cpu, Star, ChevronRight, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OwnershipModulesProps {
  vehicle: UserVehicle;
}

export function OwnershipModules({ vehicle }: OwnershipModulesProps) {
  const reminderCount = vehicle.maintenanceReminders?.length || 0;
  const buildCount = vehicle.savedBuilds?.length || 0;

  // Note: Appraisal display temporarily disabled
  // This placeholder will be replaced by live market appraisal once 
  // Canadian Black Book / US equivalent integration is enabled

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-border">
      {/* Vehicle Appraisal - Coming Soon */}
      <AppraisalCard />

      {/* Maintenance Reminders */}
      <ModuleCard
        icon={<Wrench className="w-4 h-4" />}
        title="Maintenance Reminders"
        subtitle="Keep track of oil changes, inspections, and repairs"
        count={reminderCount}
        countLabel={reminderCount === 1 ? 'reminder' : 'reminders'}
        onClick={() => {
          // Future: Open maintenance reminders view
          console.log('[GARAGE] Open maintenance reminders for vehicle:', vehicle.id);
        }}
      />

      {/* Nexus - Coming Soon */}
      <ModuleCard
        icon={<Cpu className="w-4 h-4" />}
        title="Nexus"
        subtitle="Vehicle intelligence & verified history"
        badge="Coming Soon"
        description="Track real-world usage, maintenance data, and verified vehicle history inside Carly"
        isComingSoon
      />

      {/* Your Saved Builds - Coming Soon */}
      <ModuleCard
        icon={<Star className="w-4 h-4" />}
        title="Your Saved Builds"
        subtitle="Custom configurations and dream cars you've saved"
        badge="Coming Soon"
        description="Save custom configurations and dream builds to revisit later."
        isComingSoon
      />
    </div>
  );
}

interface AppraisalCardProps {}

function AppraisalCard({}: AppraisalCardProps) {
  return (
    <div className="w-full text-left p-4 rounded-lg border border-border bg-card/50 cursor-default opacity-90">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50">
            <div className="text-muted-foreground">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-medium text-foreground">Market Estimate</h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent uppercase tracking-wide">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Real-time market valuation for your vehicle</p>
            
            <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">
              Live market valuation based on verified Canadian and U.S. data sources. Available in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description?: string;
  badge?: string;
  count?: number;
  countLabel?: string;
  isComingSoon?: boolean;
  onClick?: () => void;
}

function ModuleCard({
  icon,
  title,
  subtitle,
  description,
  badge,
  count,
  countLabel,
  isComingSoon,
  onClick,
}: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isComingSoon}
      className={cn(
        "w-full text-left p-4 rounded-lg border border-border bg-card/50 transition-all duration-200",
        !isComingSoon && "hover:border-accent/50 hover:bg-card cursor-pointer",
        isComingSoon && "cursor-default opacity-90"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
            isComingSoon ? "bg-muted/50" : "bg-accent/10"
          )}>
            <div className={cn(
              isComingSoon ? "text-muted-foreground" : "text-accent"
            )}>
              {icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-medium text-foreground">{title}</h4>
              {badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent uppercase tracking-wide">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            
            {description && (
              <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">
                {description}
              </p>
            )}

            {/* Count Display */}
            {count !== undefined && !isComingSoon && (
              <p className="text-xs text-muted-foreground mt-2">
                {count === 0 ? (
                  <span className="text-muted-foreground/60">No {countLabel} yet</span>
                ) : (
                  <span className="font-medium">{count} {countLabel}</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Arrow */}
        {!isComingSoon && (
          <ChevronRight className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}
