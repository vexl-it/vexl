# AGENTS

Purpose: Backoffice web app for managing Vexl clubs (creation, editing, invite links, image uploads).

Stack: Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS v4 + Effect HttpClient.

Conventions:

- All backend requests go through the `/api/proxy/*` Next.js route; never call the backend directly from client code.
- Admin token lives in localStorage (`src/services/adminTokenService.ts`) and is passed via query params (`urlParams: {adminToken}`) on every API call.
- Effect HttpClient base URL points to `/api/proxy`; typed schemas come from `@vexl-next/rest-api`.
- All pages are `'use client'` (Effect hooks + localStorage require it).
- Use `@/` path alias for imports.

Notes for agents:

- Image uploads are two-step: first request a presigned S3 URL, then PUT the file to it.
- `CONTACT_API_INTERNAL_URL` and `CONTENT_API_INTERNAL_URL` env vars (server-side only, local defaults `http://localhost:3002` and `http://localhost:3009`) control where the proxy forwards requests. `API_INTERNAL_URL` remains a legacy fallback for contact-service.
- When adding new backend endpoints, ensure the catch-all proxy route (`app/api/proxy/[...path]/route.ts`) handles them.
