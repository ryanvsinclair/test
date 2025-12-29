/**
 * View mode persistence utilities
 */

import { ViewMode } from '@/components/ui/view-toggle';

const VIEW_MODE_KEY = 'listings_view_mode';

export function getStoredViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'card';
  
  const stored = localStorage.getItem(VIEW_MODE_KEY);
  return stored === 'list' ? 'list' : 'card';
}

export function setStoredViewMode(mode: ViewMode): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(VIEW_MODE_KEY, mode);
}
