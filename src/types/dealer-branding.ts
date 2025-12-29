export interface DealerBranding {
  dealerId: string;
  bannerImage?: string; // URL to uploaded banner (SVG/PNG)
  logoImage?: string; // URL to dealer logo
  brandColor?: string; // Hex color code
  bannerSpecs: {
    aspectRatio: string; // e.g., "16:3"
    maxHeight: number; // percentage of listing image height
    transparency: boolean;
  };
  approved: boolean; // Admin approval status
  rejectionReason?: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface VehicleImageValidation {
  imageUrl: string;
  isValid: boolean;
  flags: ImageValidationFlag[];
  confidence: number; // 0-1
  excludeFromCarousel: boolean;
}

export type ImageValidationFlag =
  | 'promotional_banner'
  | 'qr_code'
  | 'financing_text'
  | 'pricing_graphic'
  | 'contact_info'
  | 'dealership_promo'
  | 'non_vehicle_content'
  | 'text_overlay'
  | 'watermark_excessive';

export interface ImageValidationResult {
  vehicleId: string;
  images: VehicleImageValidation[];
  primaryImages: string[]; // Valid images for main carousel
  excludedImages: string[]; // Flagged promotional images
  validationSummary: {
    total: number;
    valid: number;
    flagged: number;
  };
}

export interface BannerOverlayConfig {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  padding: {
    x: number;
    y: number;
  };
  maxWidth: string; // e.g., "200px" or "20%"
  opacity: number; // 0-1
  fadeOnHover: boolean;
  clickable: boolean;
}
