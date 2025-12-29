// Dealer Portal Types

export interface DealerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  logo?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  rating: number;
  reviewCount: number;
  verifiedDealer: boolean;
}

export interface Listing {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  photos: string[];
  status: 'active' | 'paused' | 'sold';
  tags: ('new-arrival' | 'special' | 'carly-certified')[];
  createdAt: Date;
  views: number;
  saves: number;
  messages: number;
  priceSignal: 'below' | 'at' | 'above';
}

export interface Lead {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  verified: boolean;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  intentSignals: ('ready-this-week' | 'trade-in' | 'financing-needed' | 'cash-buyer')[];
  linkedListingId?: string;
  linkedListing?: {
    id: string;
    year: number;
    make: string;
    model: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'buyer' | 'dealer';
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface TestDrive {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  listingId: string;
  listing?: {
    year: number;
    make: string;
    model: string;
    trim: string;
  };
  datetime: Date;
  status: 'requested' | 'confirmed' | 'declined' | 'rescheduled' | 'completed' | 'assigned';
  notes?: string;
  assignedTo?: string; // Salesperson ID
  assignedSalesperson?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'salesperson' | 'manager';
}

export interface Review {
  id: string;
  source: 'google' | 'facebook' | 'carly';
  rating: number;
  text: string;
  author: string;
  authorAvatar?: string;
  isLocalGuide: boolean;
  reviewCount?: number;
  photoCount?: number;
  date: Date;
  link: string;
}

export interface InsightMetric {
  listingId: string;
  listing: {
    year: number;
    make: string;
    model: string;
    price: number;
  };
  views: number;
  saves: number;
  messages: number;
  conversionScore: number;
  priceSignal: 'below' | 'at' | 'above';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'sales' | 'admin';
  avatar?: string;
  active: boolean;
  status?: 'active' | 'invited';
  invitedAt?: Date;
  invitedBy?: string;
}
