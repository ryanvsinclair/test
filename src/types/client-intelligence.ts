export interface ClientTasteProfile {
  userId: string;
  budget: {
    min: number;
    max: number;
    confidence: 'low' | 'medium' | 'high';
  };
  preferences: {
    bodyTypes: string[];
    fuelTypes: string[];
    transmissions: string[];
    brands: string[];
    features: string[];
  };
  behavioral: {
    vehiclesLiked: number;
    vehiclesViewed: number;
    listingsMessaged: number;
    avgViewDuration: number;
    revisitRate: number;
  };
  implicitSignals: {
    priceSensitivity: 'low' | 'medium' | 'high';
    brandAffinity: 'luxury' | 'value' | 'mixed';
    newVsUsedBias: 'new' | 'used' | 'mixed';
    urgency: 'low' | 'medium' | 'high';
  };
  tags: Array<{
    label: string;
    confidence: number;
  }>;
  summary: string;
  lastUpdated: string;
}

export interface ClientIntelligence {
  userId: string;
  userName: string;
  location: string;
  accountAge: string;
  verified: boolean;
  carlyIntentLevel: 'low' | 'medium' | 'high';
  lastActive: string;
  tasteProfile: ClientTasteProfile;
  activeContext: {
    currentListingId?: string;
    currentListing?: {
      year: number;
      make: string;
      model: string;
      price: number;
    };
    appointmentStatus: 'none' | 'proposed' | 'confirmed' | 'completed';
    financingInterest: {
      detected: boolean;
      confidence: number;
    };
    tradeInMentioned: boolean;
  };
  suggestedActions: Array<{
    type: 'similar_inventory' | 'financing' | 'appointment' | 'followup';
    label: string;
    description: string;
  }>;
}
