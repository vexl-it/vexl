# Vexl Trading Calculator

A standalone web-based Bitcoin trading calculator built with Next.js 16. Calculate BTC/fiat conversions with live prices, premium/discount adjustments, and multiple currencies.

## Features

- **Bidirectional conversion**: Enter BTC or fiat amount, get instant calculation
- **Live BTC prices**: Auto-refreshes every 30 seconds from Vexl's exchange rate API
- **Multiple price modes**: Live, Frozen (snapshot), or Custom price
- **Premium/Discount**: Apply percentage-based fee adjustments with slider
- **BTC/SAT toggle**: Switch between Bitcoin and Satoshi units
- **20+ currencies**: Support for major fiat currencies worldwide
- **Shareable URLs**: Share calculations with encoded state in URL
- **Keyboard shortcuts**: L (live), F (freeze), S (swap BTC/SAT), Esc (reset)
- **Dark mode**: Matches Vexl app's design language
- **SEO optimized**: Structured data and meta tags for search visibility

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn 3.x (workspace)

### Development

```bash
# From the monorepo root
yarn install

# Navigate to the app
cd apps/trading-calculator

# Start development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the calculator.

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# BTC Exchange Rate Service URL
BTC_EXCHANGE_RATE_API_URL=https://api.vexl.it
```

### Scripts

```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn typecheck    # Run TypeScript type checking
yarn lint         # Run ESLint
yarn format       # Check Prettier formatting
yarn format:fix   # Fix Prettier formatting
```

## Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **State**: React useState/useReducer (no external state library)
- **Styling**: CSS Modules with CSS Variables
- **Fonts**: TT Satoshi + PP Monument (self-hosted)

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/btc-price/     # BTC price proxy API route
│   ├── layout.tsx         # Root layout with SEO
│   ├── page.tsx           # Main calculator page
│   └── globals.css        # Global styles & design tokens
├── components/
│   ├── Calculator/        # Main calculator components
│   │   ├── BtcAmountInput.tsx
│   │   ├── FiatAmountInput.tsx
│   │   ├── PriceDisplay.tsx
│   │   ├── PremiumSlider.tsx
│   │   ├── PriceModeSelector.tsx
│   │   └── ShareButton.tsx
│   ├── Header/            # App header with download banner
│   └── Footer/            # Footer with shortcuts & links
├── hooks/
│   ├── useCalculator.ts   # Main calculator state hook
│   ├── useBtcPrice.ts     # BTC price fetching hook
│   ├── useLocalStorage.ts # Persistence hook
│   └── useKeyboardShortcuts.ts
├── lib/
│   ├── calculations.ts    # BTC/fiat conversion math
│   ├── formatters.ts      # Number/currency formatting
│   └── urlState.ts        # URL encoding/decoding
└── types/
    └── index.ts           # TypeScript type definitions
```

### Key Design Decisions

1. **Simple state management**: Using React's built-in state instead of Jotai/Zustand for simpler mental model in a standalone tool.

2. **API proxy**: BTC prices are fetched through a Next.js API route to avoid CORS issues with the exchange rate service.

3. **URL state encoding**: Calculator state is base64-encoded in the URL for shorter, shareable links.

4. **CSS Modules**: Component-scoped styles with shared CSS variables for the design system.

## Deployment

### Docker

Build and run with Docker:

```bash
docker build -t trading-calculator .
docker run -p 3000:3000 -e BTC_EXCHANGE_RATE_API_URL=https://api.vexl.it trading-calculator
```

### Production

The app uses Next.js standalone output for optimized container size. The CI/CD pipeline automatically builds and pushes Docker images on merge to main.

## License

This project is part of the Vexl ecosystem. See the root LICENSE file for details.
