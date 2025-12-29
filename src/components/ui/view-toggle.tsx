'use client';

import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'card' | 'list';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ viewMode, onViewModeChange, className }: ViewToggleProps) {
  return (
    <div className={cn("inline-flex items-center rounded-lg border border-border bg-background p-1", className)}>
      <button
        onClick={() => onViewModeChange('card')}
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-md transition-colors",
          viewMode === 'card'
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
        title="Card View"
        aria-label="Card View"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-md transition-colors",
          viewMode === 'list'
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
        title="List View"
        aria-label="List View"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
