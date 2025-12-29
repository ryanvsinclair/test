import {
  DealerBranding,
  VehicleImageValidation,
  ImageValidationResult,
  ImageValidationFlag,
} from '@/types/dealer-branding';

/**
 * IMAGE VALIDATION SERVICE
 * 
 * Detects promotional content, banners, and non-vehicle images in listings.
 * In production: Replace with ML/CV service (AWS Rekognition, custom model)
 */

// Mock validation logic (replace with actual ML/CV in production)
export const imageValidationService = {
  /**
   * Validate all images for a vehicle listing
   */
  validateVehicleImages: async (
    vehicleId: string,
    imageUrls: string[]
  ): Promise<ImageValidationResult> => {
    const validations = await Promise.all(
      imageUrls.map(url => imageValidationService.validateImage(url))
    );

    const primaryImages = validations
      .filter(v => v.isValid && !v.excludeFromCarousel)
      .map(v => v.imageUrl);

    const excludedImages = validations
      .filter(v => v.excludeFromCarousel)
      .map(v => v.imageUrl);

    return {
      vehicleId,
      images: validations,
      primaryImages,
      excludedImages,
      validationSummary: {
        total: validations.length,
        valid: primaryImages.length,
        flagged: excludedImages.length,
      },
    };
  },

  /**
   * Validate a single image
   * 
   * In production: Call AWS Rekognition or custom ML model
   * Check for: text overlays, QR codes, pricing graphics, promotional banners
   */
  validateImage: async (imageUrl: string): Promise<VehicleImageValidation> => {
    // Mock validation logic
    // In production: Use AWS Rekognition Custom Labels or similar
    
    const flags: ImageValidationFlag[] = [];
    let confidence = 1.0;

    // Heuristic checks (replace with ML in production)
    const filename = imageUrl.toLowerCase();
    
    // Check for common promotional image patterns
    if (
      filename.includes('promo') ||
      filename.includes('banner') ||
      filename.includes('deal') ||
      filename.includes('financing')
    ) {
      flags.push('promotional_banner');
      confidence = 0.85;
    }

    if (filename.includes('qr') || filename.includes('scan')) {
      flags.push('qr_code');
      confidence = 0.9;
    }

    if (
      filename.includes('price') ||
      filename.includes('finance') ||
      filename.includes('payment')
    ) {
      flags.push('financing_text');
      confidence = 0.8;
    }

    if (
      filename.includes('contact') ||
      filename.includes('call') ||
      filename.includes('visit')
    ) {
      flags.push('contact_info');
      confidence = 0.8;
    }

    // Image is flagged if confidence is below threshold
    const excludeFromCarousel = flags.length > 0 && confidence > 0.7;

    return {
      imageUrl,
      isValid: flags.length === 0,
      flags,
      confidence,
      excludeFromCarousel,
    };
  },

  /**
   * Get human-readable reasons for image rejection
   */
  getRejectionReasons: (flags: ImageValidationFlag[]): string[] => {
    const reasonMap: Record<ImageValidationFlag, string> = {
      promotional_banner: 'Image contains promotional banner or advertisement',
      qr_code: 'Image contains QR code',
      financing_text: 'Image contains financing or pricing text',
      pricing_graphic: 'Image contains pricing graphics',
      contact_info: 'Image contains contact information',
      dealership_promo: 'Image contains dealership promotional content',
      non_vehicle_content: 'Image does not focus on the vehicle',
      text_overlay: 'Image contains excessive text overlay',
      watermark_excessive: 'Image contains excessive watermarks',
    };

    return flags.map(flag => reasonMap[flag]);
  },
};

/**
 * DEALER BRANDING SERVICE
 * 
 * Manages dealer banner uploads, validation, and approval
 */

// Mock dealer branding store (replace with DB in production)
const dealerBrandingStore: Record<string, DealerBranding> = {
  'dealer-1': {
    dealerId: 'dealer-1',
    bannerImage: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=800&h=150&q=80&fit=crop',
    logoImage: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&q=80&fit=crop',
    brandColor: '#1E40AF',
    bannerSpecs: {
      aspectRatio: '16:3',
      maxHeight: 10,
      transparency: true,
    },
    approved: true,
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export const dealerBrandingService = {
  /**
   * Get dealer branding
   */
  getDealerBranding: async (dealerId: string): Promise<DealerBranding | null> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
    return dealerBrandingStore[dealerId] || null;
  },

  /**
   * Upload dealer banner
   */
  uploadDealerBanner: async (
    dealerId: string,
    bannerImage: string,
    logoImage?: string,
    brandColor?: string
  ): Promise<DealerBranding> => {
    // Validate banner specs
    const validation = await dealerBrandingService.validateBanner(bannerImage);

    if (!validation.isValid) {
      throw new Error(`Banner validation failed: ${validation.rejectionReason}`);
    }

    const branding: DealerBranding = {
      dealerId,
      bannerImage,
      logoImage,
      brandColor,
      bannerSpecs: {
        aspectRatio: '16:3',
        maxHeight: 10,
        transparency: validation.hasTransparency,
      },
      approved: false, // Requires admin approval
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dealerBrandingStore[dealerId] = branding;

    return branding;
  },

  /**
   * Validate banner image
   */
  validateBanner: async (
    bannerUrl: string
  ): Promise<{
    isValid: boolean;
    rejectionReason?: string;
    hasTransparency: boolean;
  }> => {
    // Mock validation (in production: check actual image specs)
    
    // Check file type
    if (!bannerUrl.match(/\.(svg|png)$/i)) {
      return {
        isValid: false,
        rejectionReason: 'Banner must be SVG or PNG format',
        hasTransparency: false,
      };
    }

    // In production: Check aspect ratio, dimensions, content
    // - Use image processing library
    // - Check for QR codes
    // - Check for excessive text
    // - Verify transparency

    return {
      isValid: true,
      hasTransparency: true,
    };
  },

  /**
   * Approve dealer banner (admin action)
   */
  approveBanner: async (dealerId: string): Promise<void> => {
    const branding = dealerBrandingStore[dealerId];
    if (branding) {
      branding.approved = true;
      branding.updatedAt = new Date().toISOString();
    }
  },

  /**
   * Reject dealer banner (admin action)
   */
  rejectBanner: async (dealerId: string, reason: string): Promise<void> => {
    const branding = dealerBrandingStore[dealerId];
    if (branding) {
      branding.approved = false;
      branding.rejectionReason = reason;
      branding.updatedAt = new Date().toISOString();
    }
  },

  /**
   * Get default Carly dealer badge
   */
  getDefaultBadge: (): { type: 'default'; label: string } => {
    return {
      type: 'default',
      label: 'Verified Dealer',
    };
  },
};
