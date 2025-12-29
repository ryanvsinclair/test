import { ClientIntelligence, ClientTasteProfile } from '@/types/client-intelligence';

// Mock data - replace with actual API calls
const mockTasteProfiles: Record<string, ClientTasteProfile> = {
  'buyer-1': {
    userId: 'buyer-1',
    budget: {
      min: 45000,
      max: 65000,
      confidence: 'high',
    },
    preferences: {
      bodyTypes: ['SUV', 'Crossover'],
      fuelTypes: ['Electric', 'Hybrid'],
      transmissions: ['Automatic'],
      brands: ['Tesla', 'Audi', 'BMW'],
      features: ['Autopilot', 'Panoramic Roof', 'Premium Audio'],
    },
    behavioral: {
      vehiclesLiked: 12,
      vehiclesViewed: 47,
      listingsMessaged: 5,
      avgViewDuration: 180,
      revisitRate: 0.34,
    },
    implicitSignals: {
      priceSensitivity: 'medium',
      brandAffinity: 'luxury',
      newVsUsedBias: 'mixed',
      urgency: 'high',
    },
    tags: [
      { label: 'Electric SUV', confidence: 0.92 },
      { label: 'Under $60k', confidence: 0.88 },
      { label: 'Low Mileage', confidence: 0.75 },
      { label: 'West Coast', confidence: 0.85 },
      { label: 'Tech Features', confidence: 0.81 },
    ],
    summary: 'Prefers electric SUVs under $60k with low mileage. Responds quickly to financing offers. High intent buyer actively comparing similar models.',
    lastUpdated: new Date().toISOString(),
  },
  'buyer-2': {
    userId: 'buyer-2',
    budget: {
      min: 25000,
      max: 35000,
      confidence: 'medium',
    },
    preferences: {
      bodyTypes: ['Sedan', 'Coupe'],
      fuelTypes: ['Gas'],
      transmissions: ['Manual', 'Automatic'],
      brands: ['Honda', 'Toyota', 'Mazda'],
      features: ['Backup Camera', 'Bluetooth', 'Cruise Control'],
    },
    behavioral: {
      vehiclesLiked: 8,
      vehiclesViewed: 23,
      listingsMessaged: 3,
      avgViewDuration: 120,
      revisitRate: 0.22,
    },
    implicitSignals: {
      priceSensitivity: 'high',
      brandAffinity: 'value',
      newVsUsedBias: 'used',
      urgency: 'low',
    },
    tags: [
      { label: 'Reliable Sedans', confidence: 0.87 },
      { label: 'Under $30k', confidence: 0.93 },
      { label: 'Value-focused', confidence: 0.78 },
      { label: 'First-time buyer', confidence: 0.65 },
    ],
    summary: 'Value-focused buyer looking for reliable used sedans. Price-sensitive, prefers Japanese brands. Takes time to research before committing.',
    lastUpdated: new Date().toISOString(),
  },
  'buyer-3': {
    userId: 'buyer-3',
    budget: {
      min: 70000,
      max: 95000,
      confidence: 'high',
    },
    preferences: {
      bodyTypes: ['Sports Car', 'Luxury Sedan'],
      fuelTypes: ['Gas'],
      transmissions: ['Automatic', 'Manual'],
      brands: ['Porsche', 'Mercedes-Benz', 'BMW'],
      features: ['Performance Package', 'Premium Interior', 'Sport Suspension'],
    },
    behavioral: {
      vehiclesLiked: 6,
      vehiclesViewed: 15,
      listingsMessaged: 4,
      avgViewDuration: 240,
      revisitRate: 0.45,
    },
    implicitSignals: {
      priceSensitivity: 'low',
      brandAffinity: 'luxury',
      newVsUsedBias: 'new',
      urgency: 'medium',
    },
    tags: [
      { label: 'Performance Luxury', confidence: 0.95 },
      { label: 'Premium Budget', confidence: 0.91 },
      { label: 'Brand Specific', confidence: 0.88 },
      { label: 'Cash Ready', confidence: 0.72 },
    ],
    summary: 'High-budget buyer seeking performance luxury vehicles. Strong brand preference for German marques. Cash ready, minimal price sensitivity.',
    lastUpdated: new Date().toISOString(),
  },
};

export async function getClientIntelligence(userId: string, conversationId: string): Promise<ClientIntelligence> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const tasteProfile = mockTasteProfiles[userId] || mockTasteProfiles['buyer-1'];

  const intelligence: ClientIntelligence = {
    userId,
    userName: `Client ${userId.split('-')[1]}`,
    location: 'Los Angeles, CA',
    accountAge: '3 months',
    verified: Math.random() > 0.3,
    carlyIntentLevel: tasteProfile.implicitSignals.urgency === 'high' ? 'high' : tasteProfile.implicitSignals.urgency === 'medium' ? 'medium' : 'low',
    lastActive: 'Just now',
    tasteProfile,
    activeContext: {
      currentListingId: 'listing-abc-123',
      currentListing: {
        year: 2023,
        make: 'Tesla',
        model: 'Model 3',
        price: 52000,
      },
      appointmentStatus: 'none',
      financingInterest: {
        detected: true,
        confidence: 0.78,
      },
      tradeInMentioned: false,
    },
    suggestedActions: generateSuggestedActions(tasteProfile),
  };

  return intelligence;
}

function generateSuggestedActions(profile: ClientTasteProfile) {
  const actions = [];

  // Similar inventory
  if (profile.preferences.bodyTypes.length > 0) {
    actions.push({
      type: 'similar_inventory' as const,
      label: 'Suggest Similar Vehicles',
      description: `Show ${profile.preferences.bodyTypes[0]} options in their budget`,
    });
  }

  // Financing
  if (profile.implicitSignals.priceSensitivity === 'medium' || profile.implicitSignals.priceSensitivity === 'high') {
    actions.push({
      type: 'financing' as const,
      label: 'Offer Financing Options',
      description: 'Provide pre-qualified financing rates',
    });
  }

  // Appointment
  if (profile.implicitSignals.urgency === 'high') {
    actions.push({
      type: 'appointment' as const,
      label: 'Propose Test Drive',
      description: 'Available slots this week',
    });
  }

  // Follow-up
  actions.push({
    type: 'followup' as const,
    label: 'Send Follow-up',
    description: 'Personalized message template',
  });

  return actions;
}

// Cache management
const intelligenceCache = new Map<string, { data: ClientIntelligence; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedClientIntelligence(userId: string, conversationId: string): Promise<ClientIntelligence> {
  const cached = intelligenceCache.get(userId);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await getClientIntelligence(userId, conversationId);
  intelligenceCache.set(userId, { data, timestamp: Date.now() });
  
  return data;
}
