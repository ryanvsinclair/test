# Carly Dealer Portal v1

## Overview

The Dealer Portal is a clean, modern interface for dealerships to manage their vehicle listings and interact with Carly buyers. Built from scratch with Apple × Tesla aesthetic principles.

## Architecture

```
src/app/(dealer)/
├── layout.tsx          # Dealer-specific layout with sidebar navigation
├── dealer/
│   ├── page.tsx        # Dashboard home
│   ├── listings/
│   │   └── page.tsx    # Listings manager
│   ├── messages/
│   │   └── page.tsx    # Buyer conversations
│   ├── test-drives/
│   │   └── page.tsx    # Test drive scheduling
│   ├── reputation/
│   │   └── page.tsx    # Trust & ratings
│   ├── insights/
│   │   └── page.tsx    # Light analytics
│   └── settings/
│       └── page.tsx    # Profile & preferences
```

## Core Features

### 1. Dashboard (`/dealer`)
- New Carly leads today
- Active conversations count
- Upcoming test drives
- Listing performance snapshot (views, saves, messages)
- Hot listings section
- Quick action buttons

### 2. Listings Manager (`/dealer/listings`)
- Create/edit/pause/mark sold
- VIN auto-decode
- Photo upload
- Price & availability
- Tags (New Arrival, Carly Certified, Special)

### 3. Messages (`/dealer/messages`)
- Real-time buyer chat
- Carly-origin leads only
- Buyer profile preview
- Test drive scheduling from chat
- Quick reply templates

### 4. Test Drives (`/dealer/test-drives`)
- Calendar view
- Confirm/reschedule/decline
- Buyer + vehicle context
- Filter by status (pending/confirmed/completed)

### 5. Reputation (`/dealer/reputation`)
- Carly rating display
- Recent reviews
- Verification status
- Carly Certified eligibility
- Trust improvement tips

### 6. Insights (`/dealer/insights`)
- Top performing listings
- Price vs market indicators
- Buyer demand signals
- Missed opportunity flags
- No heavy analytics or charts

### 7. Settings (`/dealer/settings`)
- Dealership info
- Team members (coming soon)
- Notification preferences
- Account settings

## Design Principles

### Visual
- 80% white/soft grey backgrounds
- Neutral darks for text
- Minimal accent usage (blue, purple)
- Generous white space (80-120px vertical)
- Soft shadows, no glow effects
- Cards with subtle borders

### Typography
- Space Grotesk for headings (light/bold weights)
- Inter for body text
- 2-3x size jumps for hierarchy
- Clean, spacious, confident

### Interaction
- Purposeful motion (200-300ms)
- Subtle hover states
- No busy animations
- Fast, dependable feel

## Technical Details

### Routing
- Route group: `(dealer)`
- Protected by auth middleware
- Separate from buyer portal `(buyer)`
- Separate from old seller portal `(seller)` - DEPRECATED

### State Management
- React hooks for local state
- Auth context for user data
- API layer structure ready for backend

### Components
- ShadCN UI components
- Lucide React icons
- Tailwind CSS styling

## Migration Notes

### Old Seller Portal (DEPRECATED)
The previous implementation in `src/app/(seller)/seller/*` is DEPRECATED and should not be used. All references have been updated to point to the new dealer portal.

**Changes:**
- `/seller` → `/dealer`
- `SellerNav` → Dealer sidebar navigation
- Mock data to be replaced with real API calls

## Future Extensibility

The portal is built for easy extension:

### Planned Features
- Team member management
- Advanced scheduling
- Export lead data
- Bulk listing operations
- Mobile responsive views

### Not in Scope
- Accounting/payroll
- Full CRM replacement
- Desking/F&I
- OEM reporting
- Floorplan management

## API Integration Points

Ready for backend integration:

```typescript
// Listings
- GET /dealer/listings
- POST /dealer/listings
- PUT /dealer/listings/:id
- DELETE /dealer/listings/:id

// Messages
- GET /dealer/conversations
- POST /dealer/conversations/:id/messages
- GET /dealer/conversations/:id

// Test Drives
- GET /dealer/test-drives
- PUT /dealer/test-drives/:id/confirm
- PUT /dealer/test-drives/:id/decline

// Analytics
- GET /dealer/stats
- GET /dealer/insights
```

## Success Criteria

✅ Clean, modern interface  
✅ 5-minute time-to-value  
✅ Carly-origin leads only  
✅ No feature bloat  
✅ Fast load times  
✅ Scalable architecture  
✅ Complete separation from buyer portal  

## Development

```bash
# Run dev server
npm run dev

# Access dealer portal
http://localhost:3000/dealer

# Auth flow
/auth/dealer → Sign in → /dealer
```
