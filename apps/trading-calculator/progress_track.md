# Trading Calculator - Progress Tracking

## Implementation Status

### Completed

- [x] Project setup (Next.js 16, TypeScript, monorepo integration)
- [x] Design system (colors, fonts, CSS variables)
- [x] Core calculator state management (`useCalculator` hook)
- [x] BTC price fetching with API route proxy
- [x] BTC/Fiat input components with bidirectional calculation
- [x] BTC/SAT unit toggle
- [x] Currency selector with 20+ currencies
- [x] Premium/discount slider with snapping presets
- [x] Price mode selector (Live, Frozen, Custom)
- [x] Price display with staleness indicator
- [x] URL state encoding/decoding for sharing
- [x] Copy result and share URL buttons
- [x] Keyboard shortcuts (L, F, S, Esc)
- [x] Header with download banner
- [x] Footer with shortcuts and links
- [x] SEO meta tags and structured data
- [x] Dockerfile for deployment
- [x] CI/CD GitHub Actions workflow
- [x] Documentation (README, CLAUDE.md)

### Pending

- [ ] Copy fonts to `public/fonts/` directory (TT Satoshi, PP Monument)
- [ ] Add favicon and og-image assets
- [ ] Test with actual BTC exchange rate API
- [ ] Browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing
- [ ] Performance optimization if needed

## Notes

### Font Files Required

The following font files need to be added to `public/fonts/`:

- TTSatoshi-Regular.woff2
- TTSatoshi-Medium.woff2
- TTSatoshi-SemiBold.woff2
- TTSatoshi-Bold.woff2
- PPMonument-Regular.woff2

### Environment Configuration

For local development, create `.env.local`:

```
BTC_EXCHANGE_RATE_API_URL=https://api.vexl.it
```

### Known Limitations

1. No automated tests (intentional for fast shipping)
2. English only (i18n prepared but not implemented)
3. No analytics tracking (privacy-first approach)

## Changelog

### 2024-XX-XX - Initial Implementation

- Created full trading calculator SPA
- Implemented all core features from spec
- Set up Docker and CI/CD
