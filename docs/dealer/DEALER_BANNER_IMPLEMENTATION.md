# Dealer Banner Standardization & Image Enforcement

## Overview

This system standardizes dealer branding across vehicle listings and prevents promotional images from being baked into vehicle photos.

## Implementation

### 1. Image Validation System

**File:** `src/lib/api/dealer-branding.ts`

- **`imageValidationService`**: Detects promotional content in uploaded images
- Flags: QR codes, financing text, pricing graphics, contact info, dealer promos
- In production: Replace with AWS Rekognition Custom Labels or ML model
- Returns validation results with confidence scores

**Production Integration:**
```typescript
// Use AWS Rekognition
const rekognition = new AWS.Rekognition();
const result = await rekognition.detectText({ Image: { S3Object: { Bucket, Key } } });
```

### 2. Dealer Banner Management

**Upload & Validation:**
- Dealers upload banner via Settings > Branding tab
- Requirements:
  - Aspect ratio: 16:3 (e.g., 800x150px)
  - Format: SVG or PNG with transparency
  - No QR codes, pricing, or promotional text
  - Max visual height: 10% of listing image

**Approval Workflow:**
- Admin reviews banner before approval
- Rejected banners show clear feedback
- Only approved banners appear on listings

### 3. UI Overlay System

**Component:** `src/components/dealer/DealerBannerOverlay.tsx`

- Applied as UI overlay, NOT baked into photos
- Position: bottom-right (configurable)
- Clickable → dealer profile
- Fade on hover for subtlety
- Fallback: Default "Verified Dealer" badge

**Integration:**
```tsx
// Already integrated into VehicleCard component
{vehicle.dealerId && (
  <DealerBannerOverlay 
    dealerId={vehicle.dealerId} 
    position="bottom-right"
    showDefault={true}
  />
)}
```

### 4. Dealer Settings Interface

**Component:** `src/components/dealer/DealerBrandingSettings.tsx`

- Upload banner image URL
- Upload logo (optional)
- Set brand color
- View approval status
- See rejection reasons
- Preview banner

**Location:** `/dealer/settings` → Branding tab

## Files Created

1. **Types:**
   - `src/types/dealer-branding.ts` - Type definitions

2. **Services:**
   - `src/lib/api/dealer-branding.ts` - Validation & management logic

3. **Components:**
   - `src/components/dealer/DealerBannerOverlay.tsx` - Overlay component
   - `src/components/dealer/DealerBrandingSettings.tsx` - Settings UI

4. **Integrations:**
   - Updated `src/components/cards/vehicle-card.tsx` - Banner overlay
   - Updated `src/app/dealer/settings/page.tsx` - Branding tab

## AWS Production Notes

### Image Validation
Replace mock validation with:
- **AWS Rekognition** for text/QR detection
- **Custom ML model** for promotional content
- **Lambda function** for async validation

### Banner Storage
- Store banners in S3
- Use CloudFront CDN for delivery
- Implement image optimization (WebP, responsive sizes)

### Approval Workflow
- Admin dashboard for banner review
- Email notifications for approval/rejection
- Audit log for changes

## Benefits

✅ Clean, consistent listing aesthetics
✅ Dealer branding preserved without clutter
✅ Prevents spammy/misleading imagery
✅ Premium marketplace experience
✅ Easy to moderate and enforce

## Next Steps

1. **Production Image Validation:**
   - Integrate AWS Rekognition
   - Train custom model for promotional content
   - Add automated flagging system

2. **Admin Tools:**
   - Build banner approval dashboard
   - Add bulk rejection/approval
   - Create moderation guidelines

3. **Analytics:**
   - Track banner click-through rates
   - Monitor validation accuracy
   - Measure dealer engagement
