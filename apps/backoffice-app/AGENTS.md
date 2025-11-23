# AGENTS

Purpose: Backoffice web application for managing Vexl clubs. Provides admin interface for club creation, editing, invite link generation, and image uploads.

Stack: Next.js 15 + React 19 + TypeScript + Tailwind CSS v4 + Effect (HttpClient) + Node.js (production)

Commands:

- `yarn workspace @vexl-next/backoffice-app dev` - Start development server (port 3000)
- `yarn workspace @vexl-next/backoffice-app build` - Build production bundle (standalone output)
- `yarn workspace @vexl-next/backoffice-app start` - Start production server locally
- `yarn workspace @vexl-next/backoffice-app typecheck` - Run TypeScript type checking
- `yarn workspace @vexl-next/backoffice-app lint` - Lint code with ESLint (Next.js config)
- `yarn workspace @vexl-next/backoffice-app format:fix` - Format code with Prettier

Conventions:

- **Authentication**: Admin token stored in localStorage, passed explicitly in query params for each API call
- **API Proxy**: All backend requests proxied through `/api/proxy/*` route - passes through query params including adminToken
- **API Client**: Effect HttpClient with typed schemas from `@vexl-next/rest-api`, base URL points to proxy endpoint
- **Routing**: Next.js App Router with file-based routing in `app/` directory
- **Styling**: Tailwind CSS v4 with @tailwindcss/postcss plugin, utilities-first approach
- **Form Validation**: Effect Schema from domain/rest-api packages
- **TypeScript**: Never use `as` keyword; always validate with `Schema.decodeUnknown` when accepting external data

Structure:

```
app/
├── layout.tsx              # Root layout with metadata
├── page.tsx                # Root redirect (login check)
├── globals.css             # Tailwind v4 @import directive
├── login/
│   └── page.tsx            # Admin token input page
├── clubs/
│   ├── layout.tsx          # Clubs section layout with nav
│   ├── page.tsx            # Clubs list
│   ├── create/
│   │   └── page.tsx        # Create club form
│   ├── [uuid]/
│   │   └── edit/
│   │       └── page.tsx    # Edit club form
│   ├── generate-link/
│   │   └── page.tsx        # Generate invite link
│   └── upload-image/
│       └── page.tsx        # Upload club image (S3)
└── api/
    └── proxy/
        └── [...path]/
            └── route.ts    # Proxy to backend (passes through query params)

src/
├── services/
│   ├── adminTokenService.ts # localStorage management for admin token
│   └── clubsAdminApi.ts    # Effect HTTP client (points to proxy)
└── hooks/
    └── useRunEffect.ts     # Run Effect in React components
```

API Endpoints (ClubsAdminApiGroup - proxied):

- `POST /api/v1/clubs/admin` - Create new club
- `PUT /api/v1/clubs/admin` - Modify existing club
- `GET /api/v1/clubs/admin` - List all clubs
- `PUT /api/v1/clubs/admin/generate-admin-link` - Generate invite link
- `POST /api/v1/clubs/admin/request-image-upload` - Request S3 presigned URL for image upload

API Proxy Pattern:

Client → `/api/proxy/v1/clubs/admin` → Next.js API Route → `${API_INTERNAL_URL}/api/v1/clubs/admin?adminToken=${token}` → Backend

Benefits:

- Eliminates CORS issues
- Hides backend URL from client
- Simplifies authentication with client-side token management
- Enables server-side request logging
- Allows future middleware (rate limiting, caching)

Deployment:

- **Docker**: Multi-stage build with Node.js alpine (standalone output)
- **GitHub Actions**: `.github/workflows/build-backoffice-app.yaml`
- **Registries**: GitHub Container Registry + AWS ECR
- **Port**: 3000 (Node.js server, not nginx)
- **Build Output**: `.next/standalone` (minimal production bundle)

Environment Variables:

- `API_INTERNAL_URL` - Backend contact service URL (server-side only, default: `http://contact-service:3003`)
- `NODE_ENV` - Set to `production` in Docker

Notes for agents:

- Admin token stored in localStorage and passed via query params (urlParams: {adminToken}) for each API call
- All pages are client components (`'use client'`) due to Effect hooks and localStorage usage
- Use `useRouter()` from `next/navigation` for routing
- Image uploads are two-step: request presigned URL, then PUT to S3
- Effect client configured with `/api/proxy` as base URL
- No direct backend calls from client - always use proxy
- When adding new endpoints, update proxy route if needed
- Standalone output means no `node_modules` in production image
- Use `@/` path alias for imports (configured in tsconfig.json)

Security:

- Admin tokens stored in localStorage (accessible to JavaScript)
- Tokens passed explicitly via query params to backend
- No token expiry (stored until cleared by logout)
- No CORS issues (same-origin requests to proxy)
- Backend URL hidden from client
- XSS protection required - ensure no untrusted content injection

Migration Notes:

- Migrated from Vite + React SPA to Next.js 15 App Router
- Upgraded to Tailwind CSS v4 (uses @import 'tailwindcss' syntax and @tailwindcss/postcss plugin)
- Added API proxy layer for enhanced security
- Uses localStorage for admin token storage (client-side)
- Converted state-based routing to file-based routing
- Token passed explicitly in API calls via query params
- Removed httpOnly cookie authentication in favor of simpler localStorage approach
