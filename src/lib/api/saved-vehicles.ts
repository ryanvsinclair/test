import { SavedVehicle } from '@/types';
// Mock data removed - connect to real database

// In-memory storage for saved vehicles (replace with backend later)
const savedVehiclesStore = new Map<string, SavedVehicle[]>();

export const savedVehiclesAPI = {
  // Get all saved vehicles for a buyer
  getSavedVehicles: async (userId: string): Promise<SavedVehicle[]> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    
    // TODO: Connect to real database
    return savedVehiclesStore.get(userId) || [];
  },

  // Check if a vehicle is saved by a buyer
  isSaved: async (userId: string, vehicleId: string): Promise<boolean> => {
    const saved = savedVehiclesStore.get(userId) || [];
    return saved.some(s => s.vehicleId === vehicleId);
  },

  // Save a vehicle
  saveVehicle: async (userId: string, vehicleId: string): Promise<SavedVehicle> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const userSaved = savedVehiclesStore.get(userId) || [];
    
    // Check if already saved
    if (userSaved.some(s => s.vehicleId === vehicleId)) {
      throw new Error('Vehicle already saved');
    }

    const savedVehicle: SavedVehicle = {
      userId,
      vehicleId,
      savedAt: new Date().toISOString(),
    };

    savedVehiclesStore.set(userId, [...userSaved, savedVehicle]);
    return savedVehicle;
  },

  // Unsave a vehicle
  unsaveVehicle: async (userId: string, vehicleId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const userSaved = savedVehiclesStore.get(userId) || [];
    const filtered = userSaved.filter(s => s.vehicleId !== vehicleId);
    
    savedVehiclesStore.set(userId, filtered);
  },

  // Get saved vehicle IDs for a buyer
  getSavedVehicleIds: async (userId: string): Promise<string[]> => {
    const saved = await savedVehiclesAPI.getSavedVehicles(userId);
    return saved.map(s => s.vehicleId);
  },
};
