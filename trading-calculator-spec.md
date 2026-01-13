# Vexl Trading Calculator - Web Application Specification

## Overview

A standalone web-based trading calculator SPA that replicates the functionality of the Vexl mobile app's trade calculator. The application will be hosted at `trading-calculator.vexl.it` and serve as both a useful tool for P2P Bitcoin traders and a marketing funnel for the Vexl mobile app.

## Technology Stack

### Framework & Build
- **Framework**: Next.js 16 (latest)
- **Build**: Standard Next.js standalone build
- **Deployment**: Docker container with Next.js standalone output
- **Location**: `apps/trading-calculator` within the monorepo

### State Management
- **Approach**: Simple React state (useState/useReducer)
- **Persistence**: localStorage for user preferences
- **No global state library** - keep it simple for a standalone tool

### Styling
- **Theme**: Dark mode only (matches Vexl brand identity)
- **Fonts**: Self-hosted TT Satoshi (400, 500, 600, 700) + PP Monument (headings)
- **Colors**: Vexl design system
  - Primary Yellow: `#FCCD6C`
  - Background: `#101010`
  - Grey: `#262626`
  - Green: `#ACD9B7`
  - Red: `#EE675E`
  - Text: `#FFFFFF`

## Core Features

### 1. BTC/Fiat Conversion Calculator

#### Input Fields
- **BTC/SAT Amount Input**
  - Bidirectional: type BTC → auto-calculate fiat
  - Toggle between BTC and SAT units (1 BTC = 100,000,000 SAT)
  - BTC/SAT toggle positioned next to the "BTC Amount" label
  - 8 decimal places for satoshi precision (0.00000001)

- **Fiat Amount Input**
  - Bidirectional: type fiat → auto-calculate BTC
  - Currency selector dropdown
  - Number formatting follows browser locale (thousand separators, decimal)

#### Currency Support
- All currencies supported by the mobile app (15+)
- Default: detected from browser locale
- Saved to localStorage for returning users

### 2. Price Modes

#### Live Price (Default)
- Fetches current BTC price via Next.js API route (proxying to btc-exchange-rate-service)
- Auto-refreshes every 30 seconds
- Shows "Last updated: X seconds/minutes ago" timestamp
- Warning icon + tooltip when price is stale (>60s without update)

#### Frozen Price
- Two ways to set:
  1. **One-click freeze**: Button to capture current live price
  2. **Manual entry**: User enters a specific price value
- Visual indicator (snowflake icon) when frozen price is active
- Persisted to localStorage

#### Custom Price ("Your Price")
- User enters their own BTC price in the selected calculator currency
- Shows percentage difference from live price
- Useful for setting offer prices with specific margins

### 3. Premium/Discount System

#### UI
- Slider with snapping to common values (-10%, -5%, 0%, +5%, +10%, +15%, +20%)
- Free-form text input for custom percentages
- Range: -100% to unlimited positive

#### Calculation Logic
- **Apply to fiat**: `finalFiat = btcAmount × btcPrice × (1 + premium/100)`
- **Reverse from fiat**: `btcAmount = fiatAmount / (btcPrice × (1 + premium/100))`

### 4. URL State & Sharing

#### Live URL Updates
- URL updates in real-time as user changes inputs (500ms debounce)
- Uses URL path/hash for state - enables bookmarking
- Encoded compressed state for shorter, shareable URLs

#### Share Features
- **Copy result button**: Copies calculated amounts to clipboard
- **Share URL**: Generates URL with full encoded state
- When loading a shared URL:
  - Show "Shared calculation" indicator
  - Automatically refresh to current live price
  - Allow user to reset to fresh state

### 5. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `L` | Switch to Live price mode |
| `F` | Freeze current price |
| `S` | Swap BTC/SAT units |
| `Tab` | Navigate between fields |
| `Escape` | Reset calculator |

- Shortcuts shown in tooltips on hover
- Visual hints for discoverability

## UI/UX Design

### Layout
- **Single column stack** on all screen sizes
- Mobile-first responsive design
- Consistent with Vexl mobile app aesthetic

### Header
- **Prominent download banner**: Always visible
- "Get the full Vexl experience" with App Store/Play Store badges
- Links to vexl.it

### Calculator Container
- Dark card (`#262626`) on dark background (`#101010`)
- Rounded corners (12px)
- Consistent padding (20px)

### Input Fields
- Dark input backgrounds
- Yellow highlight on focus (`#FCCD6C`)
- Clear labels with optional unit toggles

### Price Display
- Current BTC price prominently shown
- Price mode indicator (icon + label)
- Last updated timestamp with staleness warning

### Footer
- "Powered by Vexl" branding
- Secondary links to vexl.it

## SEO & Marketing

### Focus Keywords
- "P2P Bitcoin trading calculator"
- "Bitcoin trade calculator"
- "BTC premium calculator"
- "Peer-to-peer crypto calculator"

### Structured Data (JSON-LD)
- Calculator schema
- BreadcrumbList
- Organization (Vexl)
- WebApplication type

### Meta Tags
- Dynamic title including current calculation context
- Open Graph tags for social sharing
- Twitter Card support

### CTA Strategy
- Prominent, always-visible header banner
- App store badges with direct download links
- "Trade P2P with Vexl" messaging

## Technical Implementation

### API Integration

```typescript
// Next.js API route: /api/btc-price
// Proxies to btc-exchange-rate-service to avoid CORS

GET /api/btc-price?currency=EUR
Response: { price: 45000.50, timestamp: "2024-01-15T10:30:00Z" }
```

### Error Handling
- On API failure: Show cached price with warning
- Display "Price may be outdated" message
- Continue allowing calculations with stale price
- Retry mechanism with exponential backoff

### localStorage Schema

```typescript
interface SavedState {
  currency: string;           // Last selected currency
  priceMode: 'live' | 'frozen' | 'custom';
  frozenPrice?: number;
  customPrice?: number;
  premium: number;            // Premium/discount percentage
  btcOrSat: 'BTC' | 'SAT';
  dismissedBanner?: boolean;  // Not used - banner always visible
}
```

## Accessibility

### Target: Basic Accessibility
- Full keyboard navigation
- Reasonable color contrast (dark theme optimized)
- Screen reader compatible labels
- Focus indicators on all interactive elements
- ARIA labels for icon-only buttons

## Internationalization

### Initial Release: English Only
- Prepared for future i18n (no hardcoded strings)
- Number formatting based on browser locale
- Currency symbols from Intl API

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- No IE11 or legacy browser support

## Deployment

### Docker Configuration
- Standard Next.js standalone build
- Node 20 base image
- Multi-stage build for optimization
- Output: `next start` on port 3000

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BTC_EXCHANGE_RATE_API_URL` | URL to btc-exchange-rate-service | Yes |

### CI/CD
- Dedicated GitHub Actions workflow: `build-trading-calculator.yaml`
- Triggered on PR and manual dispatch
- Builds and pushes Docker image to registry

## Development Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "lint": "eslint . --ext .ts,.tsx",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

## Testing

### Initial Release
- No automated tests
- Manual testing for core functionality

### Future Consideration
- Unit tests for calculation logic
- E2E tests with Playwright

## Documentation Requirements

After implementation:
1. Create `apps/trading-calculator/README.md` with setup and development instructions
2. Create `apps/trading-calculator/CLAUDE.md` with project-specific AI context
3. Track progress in `apps/trading-calculator/progress_track.md`

## File Structure

```
apps/trading-calculator/
├── .env.example
├── Dockerfile
├── README.md
├── CLAUDE.md
├── progress_track.md
├── next.config.js
├── package.json
├── tsconfig.json
├── public/
│   ├── fonts/
│   │   ├── TTSatoshi-Regular.woff2
│   │   ├── TTSatoshi-Medium.woff2
│   │   ├── TTSatoshi-SemiBold.woff2
│   │   ├── TTSatoshi-Bold.woff2
│   │   └── PPMonument-Regular.woff2
│   ├── favicon.ico
│   └── og-image.png
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       └── btc-price/
│   │           └── route.ts
│   ├── components/
│   │   ├── Calculator/
│   │   │   ├── index.tsx
│   │   │   ├── BtcAmountInput.tsx
│   │   │   ├── FiatAmountInput.tsx
│   │   │   ├── PriceDisplay.tsx
│   │   │   ├── PremiumSlider.tsx
│   │   │   ├── PriceModeSelector.tsx
│   │   │   └── CurrencySelect.tsx
│   │   ├── Header/
│   │   │   ├── index.tsx
│   │   │   └── DownloadBanner.tsx
│   │   ├── Footer/
│   │   │   └── index.tsx
│   │   ├── ShareButton.tsx
│   │   ├── CopyButton.tsx
│   │   └── KeyboardShortcuts.tsx
│   ├── hooks/
│   │   ├── useCalculator.ts
│   │   ├── useBtcPrice.ts
│   │   ├── useLocalStorage.ts
│   │   └── useKeyboardShortcuts.ts
│   ├── lib/
│   │   ├── calculations.ts
│   │   ├── currencies.ts
│   │   ├── formatters.ts
│   │   └── urlState.ts
│   └── types/
│       └── index.ts
└── .github/
    └── workflows/
        └── build-trading-calculator.yaml
```

## Summary of Key Decisions

| Decision | Choice |
|----------|--------|
| Framework | Next.js 16 |
| State Management | React useState/useReducer |
| Price Source | Vexl API (proxied via Next.js) |
| Currencies | All supported (15+) |
| Price Modes | Live, Frozen, Custom |
| Theme | Dark mode only |
| Fonts | Self-hosted TT Satoshi + PP Monument |
| BTC/SAT Toggle | Yes, next to label |
| Premium UI | Slider with snapping |
| Sharing | Encoded URL + copy button |
| Auto-refresh | Every 30 seconds |
| Error Handling | Show cached price + warning |
| Analytics | None |
| Persistence | localStorage for all settings |
| i18n | English only (initially) |
| Testing | None (initially) |
| Docker | Standard Next.js standalone |
| CI/CD | Dedicated workflow |
| Accessibility | Basic keyboard + screen reader |
| Download CTA | Always visible header banner |
