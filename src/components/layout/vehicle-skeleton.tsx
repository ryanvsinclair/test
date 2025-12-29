import { Skeleton } from '@/components/ui/skeleton';

export function VehicleSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border">
      {/* Image Skeleton */}
      <Skeleton className="aspect-[4/3] w-full" />
      
      {/* Content Skeleton */}
      <div className="p-5 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
        
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        <div className="pt-2 border-t border-border">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function VehicleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <VehicleSkeleton key={i} />
      ))}
    </div>
  );
}
