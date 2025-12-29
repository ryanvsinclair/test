# 📘 Carly Design System & UI Canon

**Document Purpose:** Canonical reference for visual, interaction, and structural design patterns across all Carly surfaces.

**Last Updated:** December 2024  
**Status:** SOURCE OF TRUTH

---

## SECTION A — BRAND & VISUAL IDENTITY

### Brand Personality

**Core Identity:**
- Premium automotive-tech platform
- Apple × Tesla restraint philosophy
- Trust-forward (finance + vehicles)
- Clarity over complexity
- Decision system, not listing aggregator

**Tone Characteristics:**
- Calm, not hyped
- Confident, not aggressive
- Explanatory, not prescriptive
- Empathetic to uncertainty
- Professional without being corporate

**Visual Restraint Level:**
- Minimal ornamentation
- Purposeful gradients only
- Subtle motion (no flash)
- High readability contrast
- Space over density

### Logo Usage

**Logo Construction:**
- 32×32px rounded square (`rounded-lg`)
- Gradient background: `from-blue-600 to-purple-600` (light) / `from-blue-500 to-purple-500` (dark)
- White centered "C" (text-sm font-bold)
- Accompanied by "Carly" wordmark (font-light, text-xl md:text-2xl)

**Placement:**
- Fixed top-left in navigation
- Always links to role-specific home route
- 8px gap between logo and wordmark
- Hover: `scale-105` transition (200ms)

**Spacing Rules:**
- Minimum 16px clearance on all sides
- Never placed on busy backgrounds
- Always on solid or gradient backgrounds with sufficient contrast

**Background Compatibility:**
- Works on: white, soft grey, near-black, gradient backgrounds
- Does NOT work on: full saturation colors, images without overlay

### Logo Do / Do Not

**DO:**
- Use on navigation bars
- Link to home route
- Apply subtle hover scale effect
- Maintain 2:1 aspect ratio with text

**DO NOT:**
- Stretch or distort proportions
- Place on accent colors
- Use without sufficient contrast
- Add effects beyond documented hover state

---

## SECTION B — COLOR SYSTEM

### Primary Colors

**Light Mode Foundation:**
```
Background:     hsl(0, 0%, 99%)     /* Near-white */
Foreground:     hsl(0, 0%, 15%)     /* Deep neutral */
Card:           hsl(0, 0%, 98%)     /* Soft surface */
Primary:        hsl(0, 0%, 20%)     /* Neutral dark */
```

**Dark Mode Foundation:**
```
Background:     hsl(222, 47%, 7%)   /* Near-black blue undertone #0B0F14 */
Foreground:     hsl(210, 20%, 98%)  /* Bright off-white */
Card:           hsl(217, 33%, 11%)  /* Lifted dark surface #121826 */
Primary:        hsl(210, 20%, 98%)  /* High contrast */
```

### Secondary Colors

**Light Mode:**
```
Secondary:      hsl(0, 0%, 96%)     /* Soft grey surface */
Muted:          hsl(0, 0%, 95%)     /* Subtle backgrounds */
Muted Text:     hsl(0, 0%, 50%)     /* Readable grey text */
```

**Dark Mode:**
```
Secondary:      hsl(217, 33%, 15%)  /* Brighter than cards */
Muted:          hsl(217, 33%, 18%)  /* Readable secondary */
Muted Text:     hsl(215, 16%, 70%)  /* Soft neutral gray */
```

### Accent Colors

**Gradient System (Icy Blue → Soft Purple):**
```
Accent Primary:     hsl(200, 70%, 65%)   /* Icy blue (light) */
                    hsl(199, 89%, 48%)   /* Vibrant blue (dark) #0EA5E9 */

Accent Secondary:   hsl(270, 50%, 70%)   /* Soft purple (light) */
                    hsl(270, 60%, 65%)   /* Soft purple (dark) */

Accent Soft:        hsl(220, 60%, 75%)   /* Mid-gradient (light) */
                    hsl(200, 80%, 55%)   /* Status tags (dark) */

Accent Glow:        hsl(230, 55%, 80%)   /* Very light blend (light) */
                    hsl(199, 89%, 55%)   /* Hover glow (dark) */
```

### Gradient Definitions

**Global Background Gradient:**
```css
/* Light Mode */
--gradient-from: hsl(220, 60%, 98%)
--gradient-to:   hsl(270, 40%, 96%)
Direction: to bottom right

/* Dark Mode */
--gradient-from: hsl(222, 47%, 6%)
--gradient-to:   hsl(260, 40%, 8%)
Direction: to bottom right
```

**Application:**
- Applied to body via `.carly-gradient-bg` class
- `background-attachment: fixed` (stays in place on scroll)
- `min-height: 100vh` (full viewport coverage)

**CTA Gradient (Buttons):**
```css
background: linear-gradient(135deg, 
  hsl(var(--accent-primary)), 
  hsl(var(--accent-secondary))
)
```

**Text Gradient (Headlines):**
```css
background: linear-gradient(to right, 
  hsl(200, 70%, 65%), 
  hsl(270, 50%, 70%)
)
background-clip: text
color: transparent
```

**Dark Mode Enhancement:**
- Add `dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]` to gradient text for glow

### Border & Divider Colors

**Light Mode:**
```
Border:         hsl(0, 0%, 92%)     /* Subtle separation */
Input Border:   hsl(0, 0%, 94%)     /* Form inputs */
```

**Dark Mode:**
```
Border:         hsl(217, 33%, 22%)  /* Clear visible borders */
Input Border:   hsl(217, 33%, 15%)  /* Form inputs */
```

### When to Use Gradients

**USE gradients for:**
- Global page background (always)
- Hero headlines (h1 primary statements)
- CTA buttons (primary actions)
- Logo background
- Special highlights (when signaling importance)

**DO NOT use gradients for:**
- Body text
- Navigation items
- Form inputs
- Card backgrounds (use solid card color)
- Secondary buttons
- Data tables

### When NOT to Use Accent Colors

**Avoid accents for:**
- Long-form body text (use foreground/muted-foreground)
- Disabled states (use opacity instead)
- Neutral metadata (dates, counts, labels)
- System messages (errors = destructive color)
- Card backgrounds (too strong)

---

## SECTION C — TYPOGRAPHY

### Font Families

**Primary Font System:**
```
Font Sans:      Inter, system-ui, sans-serif
Font Display:   Space Grotesk, system-ui, sans-serif
```

**Usage:**
- `font-sans`: Body text, navigation, UI components (default)
- `font-display`: Hero headlines, special emphasis (rarely used)

### Font Hierarchy

**Hero (Landing Pages):**
```
Class:     text-5xl md:text-6xl lg:text-7xl
Weight:    font-light
Tracking:  tracking-tight
Leading:   leading-[1.1]
Usage:     Primary landing headline only
```

**H1 (Page Titles):**
```
Class:     text-3xl sm:text-4xl md:text-5xl
Weight:    font-light
Tracking:  tracking-tight
Leading:   leading-tight
Usage:     Main page header
```

**H2 (Section Headers):**
```
Class:     text-3xl md:text-4xl
Weight:    font-light
Tracking:  tracking-tight
Usage:     Major section breaks
```

**H3 (Subsection Headers):**
```
Class:     text-xl md:text-2xl
Weight:    font-medium / font-semibold
Tracking:  tracking-tight
Usage:     Card headers, subsections
```

**H4-H6 (Component Headers):**
```
Class:     text-base / text-sm
Weight:    font-medium
Tracking:  normal
Usage:     Inline headers, table headers, labels
```

**Body Text:**
```
Class:     text-sm / text-base
Weight:    font-normal
Leading:   leading-relaxed (1.75)
Color:     text-foreground
Usage:     Paragraph content, descriptions
```

**Muted Text:**
```
Class:     text-sm / text-xs
Weight:    font-normal
Color:     text-muted-foreground
Usage:     Secondary info, metadata, hints
```

**Metadata:**
```
Class:     text-xs
Weight:    font-medium
Tracking:  tracking-wide / tracking-widest
Transform: uppercase (for labels)
Color:     text-muted-foreground
Usage:     Timestamps, status labels, categories
```

### Line Height Rules

- **Headlines:** `leading-tight` (1.25) or `leading-[1.1]` (1.1)
- **Body text:** `leading-relaxed` (1.75)
- **UI text:** `leading-none` (1) or default (1.5)
- **Dense lists:** `leading-normal` (1.5)

### Letter Spacing (Tracking)

- **Headlines:** `tracking-tight` (-0.025em)
- **Body:** normal (no class needed)
- **Labels/Metadata:** `tracking-wide` (0.025em) or `tracking-widest` (0.1em)
- **Buttons:** normal

### Weight Usage

**font-light (300):**
- Hero headlines
- Large titles (h1, h2)
- Brand wordmark "Carly"
- Relaxed, premium feel

**font-normal (400):**
- Body text
- Descriptions
- Default UI text

**font-medium (500):**
- Navigation items
- Button text
- Card titles (h3)
- Emphasized UI elements

**font-semibold (600):**
- Table headers
- Form labels (when emphasis needed)
- Card titles (alternate to medium)

**font-bold (700):**
- Logo "C" only
- Rarely used elsewhere

---

## SECTION D — LAYOUT & SPACING SYSTEM

### Page Max-Width Rules

**Primary Container:**
```
Class: max-w-7xl mx-auto
Width: 1280px max
Usage: Main content wrapper (90% of pages)
```

**Medium Container:**
```
Class: max-w-5xl mx-auto
Width: 1024px max
Usage: Marketing content, long-form text
```

**Narrow Container:**
```
Class: max-w-3xl / max-w-4xl mx-auto
Width: 768px / 896px max
Usage: Forms, centered content, reading flow
```

**Full Width:**
```
No max-width class
Usage: Hero sections, full-bleed imagery
```

### Section Padding

**Desktop Vertical Padding:**
```
Hero/First Section:    pt-32 pb-16 / pt-32 pb-24
Standard Section:      py-16 / py-24 / py-32
Compact Section:       py-8 / py-12
Footer:                py-16
```

**Mobile Vertical Padding:**
```
Reduce by ~50% using responsive classes
Example: py-16 → py-8 sm:py-16
```

**Horizontal Padding:**
```
Desktop:    px-6 / px-8
Mobile:     px-4 sm:px-6
Container:  px-4 sm:px-6 (inside max-w wrapper)
```

### Vertical Rhythm

**Component Spacing (within sections):**
```
Tight:      space-y-2  (8px)
Default:    space-y-4  (16px)
Relaxed:    space-y-6  (24px)
Airy:       space-y-8  (32px)
Generous:   space-y-12 (48px)
Section:    space-y-16 (64px)
Major:      space-y-32 (128px)
```

**Rule of Thumb:**
- Within cards: space-y-4
- Between related elements: space-y-6
- Between subsections: space-y-8 / space-y-12
- Between major sections: space-y-16 / space-y-32

### Card Spacing

**Card Padding:**
```
Default:    p-6
Compact:    p-4
Generous:   p-8
```

**Card Gaps (Grid/List):**
```
Tight:      gap-4
Default:    gap-6
Spacious:   gap-8
```

**Grid Patterns:**
```
2-column:   grid-cols-1 md:grid-cols-2 gap-6
3-column:   grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6
4-column:   grid-cols-2 md:grid-cols-4 gap-4
```

### Mobile-First Constraints

**Breakpoints:**
```
sm:  640px   (tablet portrait)
md:  768px   (tablet landscape)
lg:  1024px  (desktop)
xl:  1280px  (large desktop)
2xl: 1536px  (extra large)
```

**Mobile Behavior:**
- Stack grids to single column below `md:`
- Reduce font sizes by 1-2 steps
- Reduce padding by ~50%
- Hide non-essential navigation items
- Hamburger menu below `md:` or `lg:`

**Touch Targets:**
- Minimum 44×44px (h-11 w-11 or larger)
- Buttons: h-10 (40px) minimum, h-12 (48px) preferred

---

## SECTION E — NAVIGATION SYSTEM

### Logged-Out Navbar

**Structure:**
```
Component:  LoggedOutNav.tsx
Position:   fixed top-0 left-0 right-0 z-50
Height:     h-16 (64px)
Container:  max-w-7xl mx-auto px-4 sm:px-6
```

**Background:**
```
bg-background/80 backdrop-blur-md border-b border-border
```

**Content Layout:**
```
[CarlyLogo] ----------------------------- [Nav Items] [Theme Toggle] [Sign In]
```

**Desktop Nav Items (md:flex):**
- Browse (ghost button)
- Meet Carly (ghost button)
- Theme toggle (ghost icon button)
- Sign In (primary button)

**Mobile Behavior:**
- Show hamburger menu (md:hidden)
- Slide-down dropdown menu
- Full-width buttons in dropdown

### Logged-In Buyer Navbar

**Structure:**
```
Component:  BuyerNav.tsx
Position:   fixed top-0 z-50
Container:  max-w-7xl mx-auto px-4 sm:px-6 h-16
```

**Desktop Nav Items (lg:flex):**
- Browse (with Home icon)
- Garage (with Heart icon)
- Appointments (with Calendar icon)
- Messages (with MessageSquare icon)
- Profile (with User icon)
- Meet Carly (text only)
- Theme toggle
- Logout

**Active State:**
```
bg-accent/10 text-accent
(vs inactive: text-muted-foreground)
```

**Icon Sizing:**
```
Icon: w-4 h-4
Padding: px-3 xl:px-4 py-2
Border radius: rounded-lg
```

### Logged-In Dealer Navbar

**Structure:**
```
Component:  DealerSidebar.tsx (vertical sidebar, not top nav)
Position:   fixed left-0 top-0 h-screen
Width:      16rem (256px)
```

**Background:**
```
bg-background border-r border-border
```

**Layout:**
- Logo at top
- Navigation items (vertical stack)
- Theme toggle at bottom
- Logout at bottom

**Active State:**
- Same as buyer nav (accent highlighting)

### Admin Navbar

**Structure:**
```
Component:  AdminNav.tsx
Position:   fixed top-0 z-50
Container:  container mx-auto px-6 h-16
```

**Content:**
- Logo left
- Dashboard / Applications / Dealers / Listings / Users (center)
- Logout (right)

### Nav Behavior on Scroll

**Current Implementation:**
- Fixed position (always visible)
- No hide/show on scroll
- No opacity changes
- Backdrop blur maintained

**Recommended (not yet implemented):**
- Keep fixed
- Optional: reduce padding on scroll for more content space

### Mobile Navigation Behavior

**Hamburger Menu:**
```
Icon: Menu (when closed) / X (when open)
Size: w-5 h-5
Button: w-10 h-10 rounded-lg
Display: md:hidden (show below 768px)
```

**Dropdown Pattern:**
```
Position: Absolute below nav bar
Background: bg-background/95 backdrop-blur-md
Border: border-t border-border
Padding: px-4 py-4
Items: Full-width buttons (w-full justify-start)
```

**Animation:**
- Slide down on open
- Fade out on close
- Close on item click

### Dark/Light Toggle Placement

**Logged-Out:**
- Desktop: Between "Meet Carly" and "Sign In"
- Mobile: In dropdown menu

**Logged-In Buyer:**
- Desktop: After all nav items, before logout
- Mobile: In dropdown menu

**Logged-In Dealer:**
- Bottom of sidebar, above logout

**Icon Pattern:**
```
Light mode shows: Moon icon (w-4 h-4)
Dark mode shows: Sun icon (w-4 h-4)
Button: ghost variant, w-10 h-10, rounded-lg
Hover: text-foreground, bg-muted/50
```

---

## SECTION F — FOOTER SYSTEM

### Footer Layout

**Component:**
```
CarlyFooter.tsx
```

**Structure:**
```
Position:   mt-auto (pushes to bottom)
Background: bg-gradient-to-b from-neutral-900 to-neutral-950 
            dark:from-neutral-950 dark:to-black
Container:  max-w-7xl mx-auto px-8 py-16
```

**Grid Layout:**
```
grid grid-cols-2 md:grid-cols-4 gap-12
```

**Columns (4 groups):**
1. **Product:** Meet Carly, How Carly Works, Carly Verified
2. **Navigate:** Browse, Saved Vehicles, Messages, Appointments, Luxury (hides for dealer view)
3. **Support:** Help Center, Ask Carly, Accessibility
4. **Trust & Safety:** Privacy Policy, Terms of Use, Trust & Safety, Data & Transparency

### Content Grouping

**Section Headers:**
```
Class: text-xs uppercase tracking-widest text-neutral-500 mb-4
```

**Link Styling:**
```
Class: block text-sm hover:text-neutral-100 transition-colors duration-200
Color: text-neutral-400 (default)
```

**Closing Statement:**
```
Border: border-t border-neutral-800 pt-8 mb-8
Text: "Carly helps you choose well — not rush."
Style: text-center text-sm text-neutral-500 italic
```

**Legal Row:**
```
Layout: flex flex-col sm:flex-row items-center justify-center gap-4
Text: text-xs text-neutral-600
Content: © Year Vynance Technologies Inc. • Legal • Cookies
```

### Visual Separation from Body

- Clear gradient background (dark → darker)
- Top margin: `mt-auto` ensures it sticks to bottom
- Distinct color scheme (always dark, even in light mode)
- Text color: neutral-400 / neutral-500 (muted)

### Legal / Brand Placement

- Legal footer row: horizontally centered
- Brand statement: centered above legal row
- Separator: `border-t border-neutral-800`
- Spacing: 32px between statement and legal row

### Behavior in Dark vs Light Mode

**Light Mode:**
- Footer remains dark (from-neutral-900 to-neutral-950)
- Creates strong visual anchor

**Dark Mode:**
- Footer goes even darker (from-neutral-950 to-black)
- Subtle transition from body dark to footer darker

**Consistency:**
- Always dark footer (never light)
- Text always neutral-400/neutral-500/neutral-600
- Hover always neutral-100

---

## SECTION G — COMPONENT PHILOSOPHY

### Buttons

**Default Appearance:**
```
Base: inline-flex items-center justify-center rounded-md
Size (default): h-9 px-4 py-2
Font: text-sm font-medium
Transition: transition-all motion-base motion-smooth
```

**Variants:**

1. **default** (Primary):
   ```
   bg-primary text-primary-foreground shadow
   Hover: bg-primary/90, -translate-y-[1px]
   Active: translate-y-[0.5px]
   ```

2. **outline** (Secondary):
   ```
   border border-input bg-background shadow-sm
   Hover: bg-accent text-accent-foreground, -translate-y-[1px]
   ```

3. **ghost** (Tertiary):
   ```
   No background, no border
   Hover: bg-accent text-accent-foreground
   ```

4. **destructive** (Danger):
   ```
   bg-destructive text-destructive-foreground
   Hover: bg-destructive/90, -translate-y-[1px]
   ```

5. **link** (Text link):
   ```
   text-primary underline-offset-4
   Hover: underline
   ```

**Sizes:**
```
sm:  h-8 rounded-md px-3 text-xs
default: h-9 px-4 py-2
lg:  h-10 rounded-md px-8
icon: h-9 w-9
```

**Hover Behavior:**
- Subtle lift (-1px Y translation)
- Background opacity change (90%)
- Duration: 150ms (motion-base)
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

**Active State:**
- Slight depress (0.5px Y translation)
- No opacity change
- Instant response

**Disabled State:**
```
disabled:pointer-events-none disabled:opacity-50
```

**Custom Patterns:**
```
.btn-lift class: for explicit lift behavior
.primary-glow: for dark mode CTA glow effect (not on all buttons)
```

### Inputs

**Default Appearance:**
```
Class: flex h-9 w-full rounded-md border border-input 
       bg-background px-3 py-1 text-sm shadow-sm
Transition: transition-all motion-base
```

**Focus State:**
```
focus-visible:outline-none 
focus-visible:ring-1 focus-visible:ring-blue-500 
focus-visible:border-blue-500
```

**Placeholder:**
```
placeholder:text-muted-foreground
```

**Disabled State:**
```
disabled:cursor-not-allowed disabled:opacity-50
```

**File Input:**
```
file:border-0 file:bg-transparent file:text-sm file:font-medium
```

**Usage Pattern:**
- Always pair with label (for accessibility)
- Use muted helper text below if needed
- Validation errors: border-destructive + text-destructive message

### Cards

**Default Appearance:**
```
Class: rounded-xl border bg-card text-card-foreground shadow
Transition: transition-all motion-base
```

**Card Sections:**
```
CardHeader: flex flex-col space-y-1.5 p-6
CardTitle: font-semibold leading-none tracking-tight
CardDescription: text-sm text-muted-foreground
CardContent: p-6 pt-0
CardFooter: flex items-center p-6 pt-0
```

**Hover Behavior (when interactive):**
```
.card-lift class:
  transition-all motion-base motion-smooth
  hover: -translate-y-[2px] shadow-lg
```

**Dark Mode Enhancement:**
```
dark .card-lift:hover:
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 
              0 0 0 1px rgba(199, 210, 254, 0.1)
```

**Usage:**
- Default corner radius: `rounded-xl` (12px)
- Border always present (for depth)
- Shadow: subtle by default, increases on hover (if interactive)

### Filters

**Pattern:**
```
Component: VehicleFiltersSheet.tsx
Trigger: Button with Filter icon
Sheet: Slides from right (sm:max-w-sm)
```

**Filter Structure:**
```
- Sheet header with title + close
- Scrollable filter groups
- Each filter group: label + control (select/input/checkbox)
- Footer: Reset + Apply buttons
```

**Apply Pattern:**
```
Primary button: "Apply Filters"
Secondary button: "Reset"
Auto-close on apply
```

### Modals (Dialogs)

**Default Appearance:**
```
Overlay: bg-background/80 backdrop-blur-sm
Content: fixed center, max-w-lg, rounded-lg, p-6
Shadow: shadow-lg
Border: border (for depth)
```

**Animation:**
```
Open:  fade-in-0 + zoom-in-[0.98], duration 240ms
Close: fade-out-0 + zoom-out-[0.98], duration 180ms
Easing: cubic-bezier(0.22,1,0.36,1) (open), ease-out (close)
```

**Close Button:**
```
Position: absolute right-4 top-4
Icon: X (Cross2Icon, h-4 w-4)
Opacity: 70% default, 100% hover
Ring on focus
```

**Structure:**
```
DialogHeader: flex flex-col space-y-1.5 text-center sm:text-left
DialogTitle: text-lg font-semibold
DialogDescription: text-sm text-muted-foreground
DialogFooter: flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2
```

### Sheets (Side Panels)

**Default Appearance:**
```
Overlay: Same as Dialog
Panel: Fixed edge, full height, p-6
Width: w-3/4 sm:max-w-sm
Border: border-l (right sheet) / border-r (left sheet)
```

**Sides:**
- `right` (default): slides from right
- `left`: slides from left
- `top`: slides from top
- `bottom`: slides from bottom

**Animation:**
```
Open: slide-in-from-[side], duration 500ms
Close: slide-out-to-[side], duration 300ms
```

**Usage:**
- Filters: right sheet
- Navigation: left sheet (mobile)
- Notifications: right sheet
- Forms: right sheet

### Lists

**Pattern: Card Grid (most common):**
```
Container: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
Card: Vehicle card with image, title, price, metadata
```

**Pattern: Table List:**
```
Component: Table + TableHeader + TableBody + TableRow + TableCell
Styling: Minimal borders, zebra striping (optional)
Empty state: "No results found" centered in tbody
```

**Pattern: Vertical List:**
```
Container: space-y-4 / space-y-6
Item: Card or border-b separated div
```

**Empty States:**
```
Structure: Centered icon + heading + description + CTA
Icon: w-16 h-16, bg-accent-glow, rounded-2xl
Text: h2 font-light, p muted-foreground
```

---

## SECTION H — MOTION & TRANSITIONS

### Transition Durations

**Defined Variables:**
```css
--motion-fast:  120ms   /* Micro-interactions */
--motion-base:  150ms   /* Default transitions */
--motion-slow:  180ms   /* Deliberate transitions */
--motion-delay: 150ms   /* Stagger delay */
```

**Usage:**
```
Fast:   Hover states, button presses
Base:   Page elements, cards, modals
Slow:   Large panels, sheets, page transitions
```

### Easing Philosophy

**Primary Easing:**
```css
cubic-bezier(0.4, 0, 0.2, 1)  /* Smooth, natural */
```

**Applied via:**
```
.motion-smooth class
```

**Specialized Easings:**
```
Dialog open:  cubic-bezier(0.22, 1, 0.36, 1)  /* Snappy entry */
Dialog close: ease-out                         /* Quick exit */
Sheet:        ease-in-out                      /* Balanced slide */
```

### Where Motion is Allowed

**Permitted:**
- Button hover/active states (lift/depress)
- Card hover (lift + shadow)
- Navigation item hover (background fade)
- Modal/sheet open/close
- Dropdown expansion
- Page element fade-in
- Icon rotation (limited cases)
- Theme toggle icon swap

**Utility Classes:**
```
.btn-lift: Button lift on hover
.card-lift: Card lift on hover
.nav-slide: Nav item X-translation on hover
.fade-in: Opacity 0→1
.fade-in-up: Opacity + Y translation
```

### Where Motion is Forbidden

**NO motion for:**
- Scrolling page background
- Data loading states (use static skeleton)
- Tables (no row animation)
- Form validation errors (instant display)
- Static text content
- Images (no Ken Burns, no zoom)
- Layout shifts (content reflow)

### Page Transitions

**Current Pattern:**
- No route transition animations
- Instant navigation (Next.js default)
- Loading states handled per-component

**On Initial Load:**
```css
.animate-in class (Tailwind)
fade-in slide-in-from-bottom-3 duration-700
```

**Stagger Pattern:**
```css
animation-delay: ${idx * 100}ms
```

### Hover Micro-Interactions

**Button:**
```
hover: -translate-y-[1px] (lift)
active: translate-y-[0.5px] (depress)
```

**Card (when interactive):**
```
hover: -translate-y-[2px] shadow-lg
```

**Nav Item:**
```
hover: translate-x-[2px] (right slide)
```

**Link:**
```
hover: underline (text links)
       bg-muted/50 (button-style links)
```

**Icon Button:**
```
hover: scale-105 bg-muted/50
```

### Loading State Philosophy

**NO spinner abuse:**
- Avoid spinning loaders when possible
- Use skeleton screens for content loading
- Use disabled button states during submission
- Use static "Loading..." text for quick operations

**Acceptable Loaders:**
- Page-level initial load (unavoidable)
- Large data fetch (3+ seconds)
- File upload progress

**Skeleton Pattern:**
```css
.skeleton-shimmer: Linear gradient shimmer effect
Background: Light grey → slightly darker → light grey
Animation: 2s linear infinite
```

---

## SECTION I — DARK / LIGHT MODE RULES

### Parity Guarantees

**Both modes must have:**
- Equal readability (contrast ratios)
- Same layout and spacing
- Same component behavior
- Same interaction feedback
- Same hierarchy visibility

**NOT required to be identical:**
- Exact color values (can differ for contrast)
- Shadow intensity (darker shadows in dark mode)
- Border visibility (may be stronger in dark mode)

### Contrast Requirements

**Light Mode:**
- Body text: 15% foreground on 99% background (sufficient contrast)
- Muted text: 50% foreground (minimum 4.5:1 for small text)

**Dark Mode:**
- Body text: 98% foreground on 7% background (high contrast)
- Muted text: 70% foreground (readable without strain)

**Links/Accents:**
- Must pass WCAG AA (4.5:1 for small text, 3:1 for large)
- Accent colors adjusted per mode for visibility

### Accent Behavior Across Modes

**Light Mode Accents:**
- Softer, lower saturation (70%, 50%)
- Background tints: accent/10, accent/20
- Hover: subtle darkening

**Dark Mode Accents:**
- Higher saturation, brighter (89%, 60%)
- Background tints: accent/10 (still works)
- Hover: glow effect added

**Gradient Text:**
- Light: blue-500 to purple-500
- Dark: Same, but with glow shadow applied

### Gradients in Dark vs Light

**Background Gradient:**
- Light: Very subtle (98% → 96%)
- Dark: Slightly stronger (6% → 8%)
- Both: Same direction (to bottom right)

**CTA Gradients:**
- Both modes: Same hue, different lightness
- Dark mode: May add glow shadow on hover

### Accessibility Constraints

**Focus Rings:**
- Always visible on keyboard focus
- Color: blue-500 (light) / blue-500 (dark) — high contrast in both
- Width: 1px ring (ring-1)

**Interactive Elements:**
- Minimum 44×44px touch target (mobile)
- Hover state must be visually distinct
- Disabled state must be obvious (50% opacity)

**Text Contrast:**
- All body text: AAA standard (7:1 or better where possible)
- UI text: AA standard minimum (4.5:1)
- Decorative text: No requirement (but avoid pure grey on grey)

---

## SECTION J — "COMING SOON" / MARKETING PAGE RULES

### Visual Native to Carly

**Must Use:**
- Same navigation component (LoggedOutNav)
- Same footer component (CarlyFooter)
- Same global gradient background (.carly-gradient-bg)
- Same color variables (hsl(var(--accent-primary)), etc.)
- Same typography scale (text-5xl font-light, etc.)
- Same spacing system (py-32, space-y-16, etc.)

**Must NOT Use:**
- Different font families
- Different color schemes
- Popup/overlay gimmicks
- Countdown timers (unless core to product)
- "Sign up for waitlist" if product is live

### Same Nav and Footer

**Navigation:**
- Use LoggedOutNav component exactly as-is
- Same Browse / Meet Carly links
- Same Sign In button (or disable if not yet live)

**Footer:**
- Use CarlyFooter component exactly as-is
- Update footer links to point to live pages or "#" placeholders

### Restrained Copy

**Tone:**
- Honest about what's available now
- Clear about timeline if feature is upcoming
- No hype language ("revolutionary", "game-changing")
- No false urgency ("Limited time!", "Act now!")

**Examples:**
```
✅ "This feature is launching in Q1 2025"
❌ "Coming soon! Don't miss out!"

✅ "We're building this based on dealer feedback"
❌ "Revolutionary technology you've never seen before"

✅ "Sign up to be notified when it's ready"
❌ "Join the waitlist before it's too late!"
```

### Avoid Gimmicks

**Forbidden:**
- Animated countdown clocks
- Fake "spots remaining" counters
- Auto-playing video backgrounds
- Parallax scroll effects (not in brand)
- Confetti/celebration animations
- Pop-ups on page load

**Allowed:**
- Simple hero section with headline
- Feature explanation cards
- Static mockup images (not animated)
- Email capture form (simple input + button)
- FAQ accordion (if helpful)

### Preserve Premium Feel

**Maintain:**
- Generous whitespace (same as rest of site)
- Light/dark mode toggle
- Subtle gradient backgrounds
- Restrained accent use
- Clean typography hierarchy

**Layout Pattern:**
```
1. Hero section: headline + subheading + CTA
2. Explanation section: "What this does" (3-4 cards)
3. Optional: Visual preview (static image)
4. Optional: FAQ section
5. Footer (always)
```

### Signal "Live Product in Progress"

**Copy Strategy:**
- Reference existing features ("Like our marketplace, this...")
- Link to live parts of the product ("Browse cars while you wait")
- Show it's an addition, not a replacement
- Give timeline if possible

**Example Structure:**
```
Headline: "Dealer Analytics Dashboard — Launching Q1 2025"

Subheading: "Get insights into buyer engagement, listing performance, 
             and conversation quality — built on the same transparent 
             system powering our marketplace today."

CTA: "Notify me when it launches" (email form)

Below fold: Link to "/dealer/dashboard" (existing feature) with:
            "In the meantime, manage your inventory here"
```

### Marketing Page Checklist

**Before Publishing:**
- [ ] Uses LoggedOutNav component
- [ ] Uses CarlyFooter component
- [ ] Has .carly-gradient-bg on body
- [ ] Uses Carly color variables (no hardcoded colors)
- [ ] Typography matches scale (no custom fonts)
- [ ] Spacing matches rhythm (py-16, py-32, etc.)
- [ ] Light/dark mode both tested
- [ ] No countdown timers or fake urgency
- [ ] Copy is honest about timeline
- [ ] Links to existing product where relevant
- [ ] Email capture form (if needed) is simple and clear
- [ ] No popups or gimmicks
- [ ] Mobile responsive (same breakpoints as main site)

---

## CANONICAL USAGE RULES

### Who This Document Serves

**Intended Audience:**
- Developers (implementing new pages)
- Designers (creating mockups)
- AI agents (building new features)
- Marketing (creating landing pages)
- Product (evaluating consistency)

### When to Reference This Document

**Always consult before:**
- Adding a new page or route
- Creating a marketing landing page
- Building a "Coming Soon" placeholder
- Redesigning an existing component
- Adding a new color or gradient
- Changing typography anywhere
- Modifying navigation/footer

**Required Adherence:**
- All public-facing pages
- All authenticated pages
- All marketing materials
- All email templates (where applicable)
- All external micro-sites

**Allowed Deviation (with documentation):**
- Admin-only tools (can be more utilitarian)
- Internal dashboards (can prioritize density)
- Error pages (can simplify for speed)

### Updates to This Document

**Process:**
- Document changes in git commit
- Update "Last Updated" date at top
- Tag with version if major revision
- Communicate changes to team

**Trigger for Update:**
- New global style pattern added
- Color variable changed
- Component behavior standardized
- New section added (e.g., email templates)

---

## APPENDIX — QUICK REFERENCE

### Most Common Classes

```
/* Layout */
max-w-7xl mx-auto px-6 py-16
space-y-6

/* Typography */
text-3xl font-light tracking-tight
text-sm text-muted-foreground

/* Colors */
bg-card text-card-foreground
text-accent bg-accent/10

/* Interactivity */
rounded-lg transition-all hover:scale-105
hover:-translate-y-[1px]

/* Dark Mode */
dark:bg-neutral-950 dark:text-neutral-100
```

### Gradient Snippets

```jsx
{/* Text Gradient */}
<h1 className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
  Headline
</h1>

{/* Button Gradient */}
<Button style={{ 
  background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))'
}}>
  CTA
</Button>

{/* Background Gradient (via global class) */}
<body className="carly-gradient-bg">
```

### Component Import Paths

```typescript
// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet"

// Brand Components
import { CarlyLogo } from "@/components/branding/CarlyLogo"
import { CarlyFooter } from "@/components/navigation/CarlyFooter"

// Layouts
import LoggedOutNav from "@/components/layouts/LoggedOutNav"
import BuyerNav from "@/components/layouts/BuyerNav"
```

---

## FINAL STATEMENT

This document represents the **canonical design truth** for Carly. Any page, component, or surface that deviates from these patterns without explicit justification is considered out of compliance.

**Guiding Principle:**
Every design decision should preserve Carly's identity as a **calm, trustworthy, premium decision system** — never a chaotic listing site or hype-driven marketplace.

**Consistency > Novelty**

---

**End of Document**
