# Carfax Document Attachment System

## Overview

This system allows dealers to attach Carfax reports to vehicle listings as **display-only documents**.

**CRITICAL RULES:**
- Carfax documents are **NEVER parsed or extracted**
- Carfax data **NEVER auto-populates listing attributes**
- All vehicle attributes remain **dealer-declared**
- Carfax is displayed as "View Carfax" link only

---

## Architecture

### Storage
- **PDFs:** Stored in AWS S3
- **URLs:** Stored as string references in database
- **Structure:** `dealers/{dealerId}/carfax/{uuid}.pdf`

### Database Schema

```typescript
// listing table (add columns)
carfaxS3Key?: string      // S3 path to PDF
carfaxUrl?: string        // Public Carfax URL
```

### Matching Logic

Carfax documents are matched to listings by:
1. **Stock Number** (priority)
2. **VIN** (fallback)

---

## Upload Methods

### 1. Single Upload
- Upload one Carfax PDF or provide public URL
- Specify stock number or VIN
- Immediate matching and association

### 2. Bulk ZIP Upload
- Upload ZIP archive of Carfax PDFs
- Filenames must contain stock number or VIN
- Supported patterns:
  - `STK-10234.pdf`
  - `STK-10234_carfax.pdf`
  - `1HGCM82633A004352.pdf`
  - `carfax_STK-10234.pdf`

### 3. Bulk CSV Upload
- CSV with columns: `stock_number`, `vin`, `carfax_url`
- Links public Carfax URLs to listings
- Example:
  ```csv
  stock_number,vin,carfax_url
  STK-10234,1HGCM82633A004352,https://www.carfax.com/...
  ```

---

## API Endpoints

### Single Upload
```
POST /api/dealer/carfax/upload?dealerId={id}

FormData:
- file: PDF file
- url: Public Carfax URL (alternative to file)
- stockNumber: Stock number for matching
- vin: VIN for matching
```

### Bulk Upload
```
POST /api/dealer/carfax/bulk-upload?dealerId={id}&type={zip|csv}

FormData:
- file: ZIP or CSV file
```

---

## Display

Carfax documents appear as:
- **Icon button** in listings table (if attached)
- **"View Carfax" link** on vehicle detail pages
- Opens PDF in new tab or redirects to public URL

**Never shown:**
- Extracted data
- Summaries
- Auto-derived attributes

---

## Unmatched Documents

Documents that don't match any listing:
- Flagged as "unmatched" in upload results
- Stored in review queue
- Dealer can manually assign to listings

---

## AWS Deployment

### S3 Configuration
- Bucket: `carly-carfax` (or similar)
- IAM permissions for upload/read
- Signed URLs for secure PDF access
- Lifecycle policies for old reports

### Background Processing
- ZIP extraction via Lambda
- Async matching job
- Status tracking
- Partial success support

---

## Security

### Access Control
- Carfax documents visible only to:
  - Listing owner (dealer)
  - Authenticated buyers viewing the listing
- S3 pre-signed URLs expire after 1 hour

### Data Integrity
- **NO parsing of Carfax data**
- **NO extraction of accident history, ownership, etc.**
- **NO auto-updates to listing attributes**

---

## Code Comments

All Carfax-related code includes comments like:

```typescript
/**
 * CRITICAL: Carfax is a document attachment ONLY
 * - Never parsed or extracted
 * - Never used to auto-populate listing attributes
 * - Displayed as "View Carfax" link only
 */
```

---

## Future Considerations

### Paid Carfax Integration
If integrating with Carfax API (paid):
- Use separate service
- Keep document attachment system unchanged
- API data stored separately from documents
- Clear distinction in UI

### Alternative Report Providers
- AutoCheck
- NMVTIS
- Similar document-only approach

---

## Testing

### Test Cases
1. Upload single PDF with stock number
2. Upload single PDF with VIN
3. Bulk upload ZIP with mixed naming
4. CSV with public URLs
5. Unmatched documents handling
6. Listing display with/without Carfax

### Edge Cases
- Duplicate uploads (same listing)
- Missing stock number/VIN
- Invalid PDF files
- Broken URLs
- S3 upload failures

---

## Monitoring

Track:
- Upload success rate
- Match rate (matched vs unmatched)
- S3 storage usage
- Access patterns (how often Carfax is viewed)

**DO NOT track:**
- Carfax content
- Extracted data
- Auto-derived attributes
