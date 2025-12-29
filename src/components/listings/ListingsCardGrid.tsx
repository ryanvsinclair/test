'use client';

import { Vehicle } from '@/types';
import { VehicleCard } from '@/components/cards/vehicle-card';

interface ListingsCardGridProps {
  vehicles: Vehicle[];
  showSaveButton?: boolean;
  onHide?: (vehicleId: string) => void;
}

export function ListingsCardGrid({ vehicles, showSaveButton = true, onHide }: ListingsCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vehicles.map((vehicle) => (
        <VehicleCard 
          key={vehicle.id} 
          vehicle={vehicle}
          showSaveButton={showSaveButton}
          onHide={onHide}
        />
      ))}
    </div>
  );
}
