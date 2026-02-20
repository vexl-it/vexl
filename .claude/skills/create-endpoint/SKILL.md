---
name: create-endpoint
description: Creates a minimal API endpoint skeleton for Vexl backend services. Use when scaffolding new REST endpoints including contracts, specification, handler stub, and HTTP server wiring. Does NOT create database services, utilities, or any other supporting code.
---

<objective>
Scaffold a minimal API endpoint skeleton for a Vexl backend service. Creates ONLY:
1. Contract definition (request/response schemas, errors) in `packages/rest-api/src/services/{service}/contracts.ts`
2. Endpoint specification in `packages/rest-api/src/services/{service}/specification.ts`
3. Client API function export in `packages/rest-api/src/services/{service}/index.ts`
4. Empty handler stub in `apps/{service}-service/src/routes/{group}/{endpointName}.ts`
5. HTTP server wiring in `apps/{service}-service/src/httpServer.ts`

**IMPORTANT: Do NOT create:**
- Database services or queries
- Utility functions
- Helper modules
- Any other supporting code
- Tests

The handler should contain only the minimal skeleton with a TODO comment.
</objective>

<available_services>
Backend services (apps/ directory with -service suffix):
- btc-exchange-rate-service
- chat-service
- contact-service
- content-service
- feedback-service
- location-service
- metrics-service
- notification-service
- offer-service
- user-service

REST API packages (packages/rest-api/src/services/):
- btcExchangeRate
- chat
- contact
- content
- feedback
- location
- metrics
- notification
- offer
- user
</available_services>

<required_info>
Before creating the endpoint, gather the following information. Use AskUserQuestion if any are missing:

**Required (must ask if not provided or not obvious):**
1. **Endpoint name** - camelCase name (e.g., `getClubContacts`, `createUser`)
2. **URL path** - REST path (e.g., `/api/v1/users/me`)
3. **Target service** - Which service this endpoint belongs to
4. **HTTP method** - GET, POST, PUT, DELETE (ask if not explicitly stated or obvious from description)
5. **Max expected daily calls** - Integer for rate limiting annotation (ALWAYS ask, no default)
6. **Headers & Security** - ALWAYS ask, one of:
   - `CommonAndSecurityHeaders` + `ServerSecurityMiddleware` (authenticated, validates user signature)
   - `CommonHeaders` only (public endpoint, but with common headers for tracking)
   - None (fully public, no headers required)

**Optional (can infer or ask if needed):**
7. **API group** - Which group in specification.ts (infer from URL or ask)
8. **Request schema** - URL params (GET) or payload (POST/PUT/DELETE)
9. **Response schema** - Success response structure
10. **Errors** - Custom error types if any
</required_info>

<process>
## Step 1: Gather Information

Check what information was provided. Use AskUserQuestion for missing critical info:
- Endpoint name, URL, and target service are required
- **HTTP method is required** - ask if not explicitly stated or obvious from description (do not assume POST)
- **Headers & Security is required** - always ask if not explicitly provided (do not assume a default)
- **MaxExpectedDailyCall is required** - always ask if not explicitly provided (do not assume a default)

## Step 2: Read Existing Patterns

Read the target service files to understand existing patterns:
```
packages/rest-api/src/services/{service}/contracts.ts
packages/rest-api/src/services/{service}/specification.ts
packages/rest-api/src/services/{service}/index.ts
apps/{service}-service/src/httpServer.ts
apps/{service}-service/src/routes/{group}/ (one example handler)
```

## Step 3: Create Contract Definitions

Add to `packages/rest-api/src/services/{service}/contracts.ts`:

```typescript
// Request schema (if needed)
export const {EndpointName}Request = Schema.Struct({
  // fields...
})
export type {EndpointName}Request = typeof {EndpointName}Request.Type

// Response schema
export const {EndpointName}Response = Schema.Struct({
  // fields...
})
export type {EndpointName}Response = typeof {EndpointName}Response.Type

// Custom errors (if any)
export class {ErrorName}Error extends Schema.TaggedError<{ErrorName}Error>(
  '{ErrorName}Error'
)('{ErrorName}Error', {
  status: Schema.optionalWith(Schema.Literal({statusCode}), {default: () => {statusCode}}),
}) {}
```

## Step 4: Create Endpoint Specification

Add to `packages/rest-api/src/services/{service}/specification.ts`:

```typescript
export const {EndpointName}Endpoint = HttpApiEndpoint.{method}(
  '{endpointName}',
  '{urlPath}'
)
  // Add headers based on user's choice:
  // .setHeaders(CommonAndSecurityHeaders).middleware(ServerSecurityMiddleware)  // authenticated
  // .setHeaders(CommonHeaders)  // public with tracking
  // (no headers)  // fully public
  .setPayload({EndpointName}Request)     // for POST/PUT/DELETE
  // OR .setUrlParams({EndpointName}Request)  // for GET
  .addSuccess({EndpointName}Response)
  .addError({ErrorName}Error, {status: {statusCode}})  // if custom errors
  .annotate(MaxExpectedDailyCall, {maxDailyCalls})
```

Then add to the appropriate HttpApiGroup:
```typescript
const {GroupName}ApiGroup = HttpApiGroup.make('{GroupName}')
  .add({EndpointName}Endpoint)
  // ...other endpoints
```

## Step 5: Create Client API Function (Optional)

Add to `packages/rest-api/src/services/{service}/index.ts`:

```typescript
{endpointName}: (body: {EndpointName}Request) =>
  client.{GroupName}.{endpointName}({
    payload: body,
    headers: commonAndSecurityHeaders,
  }),
```

## Step 6: Create Handler Stub (Minimal)

Create `apps/{service}-service/src/routes/{group}/{endpointName}.ts`:

```typescript
import {HttpApiBuilder} from '@effect/platform/index'
import {{ServiceName}ApiSpecification} from '@vexl-next/rest-api/src/services/{service}/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'

export const {endpointName} = HttpApiBuilder.handler(
  {ServiceName}ApiSpecification,
  '{GroupName}',
  '{endpointName}',
  (_req) =>
    Effect.gen(function* (_) {
      // TODO: Implement endpoint logic

      return {
        // TODO: Return response matching {EndpointName}Response schema
      }
    }).pipe(makeEndpointEffect)
)
```

**IMPORTANT:** Keep the handler minimal. Do NOT add:
- Database service imports or usage
- Utility imports
- Any implementation logic
- Just the bare skeleton with TODO comments

## Step 7: Wire Up in HTTP Server

Update `apps/{service}-service/src/httpServer.ts`:

1. Add import:
```typescript
import {{endpointName}} from './routes/{group}/{endpointName}'
```

2. Add to the appropriate group handler:
```typescript
const {GroupName}ApiGroupLive = HttpApiBuilder.group(
  {ServiceName}ApiSpecification,
  '{GroupName}',
  (h) =>
    h
      .handle('{endpointName}', {endpointName})
      // ...other handlers
)
```

## Step 8: Run Format Fix

Run format fix on modified files:
```bash
yarn turbo:format:fix
```

## Step 9: Report Modified Files

List all modified files with relative paths from repo root.
</process>

<patterns>
## Contract Patterns

**Simple success response:**
```typescript
export const MyEndpointResponse = Schema.Struct({
  success: Schema.Boolean,
})
```

**No content response (204):**
```typescript
import {NoContentResponse} from '../../NoContentResponse.brand'
// In endpoint: .addSuccess(NoContentResponse, {status: 201})
```

**Paginated response:**
```typescript
import {createPageResponse, PageRequestMeta} from '../../Pagination.brand'
export const MyEndpointResponse = createPageResponse(ItemSchema)
```

**Optional fields:**
```typescript
Schema.optionalWith(SomeType, {as: 'Option'})
// or with default:
Schema.optionalWith(Schema.Boolean, {default: () => false})
```

## Endpoint Specification Patterns

**Headers & Security options (ask user which one):**
```typescript
// Option 1: Authenticated (validates user signature)
.setHeaders(CommonAndSecurityHeaders)
.middleware(ServerSecurityMiddleware)

// Option 2: Public with tracking headers
.setHeaders(CommonHeaders)

// Option 3: Fully public (no headers)
// (don't add any setHeaders or middleware)
```

**With challenge validation (for sensitive operations):**
```typescript
// Request includes RequestBaseWithChallenge fields
.addError(InvalidChallengeError, {status: 401})
```

**Different HTTP methods:**
- `HttpApiEndpoint.get()` - use `.setUrlParams()`
- `HttpApiEndpoint.post()` - use `.setPayload()`
- `HttpApiEndpoint.put()` - use `.setPayload()`
- `HttpApiEndpoint.del()` - use `.setPayload()` or no body

## Handler Stub Pattern

**Minimal authenticated handler:**
```typescript
export const myEndpoint = HttpApiBuilder.handler(
  MyApiSpecification,
  'GroupName',
  'myEndpoint',
  (_req) =>
    Effect.gen(function* (_) {
      // TODO: Implement endpoint logic
      return {}
    }).pipe(makeEndpointEffect)
)
```

Note: Database access, transactions, redis locks, and other implementation details should be added later when implementing the actual logic - NOT by this skill.
</patterns>

<success_criteria>
Endpoint skeleton is complete when:
- [ ] Contract request/response schemas added to contracts.ts
- [ ] Endpoint definition added to specification.ts with correct annotations
- [ ] Endpoint added to appropriate HttpApiGroup in specification.ts
- [ ] Client function added to index.ts (if applicable)
- [ ] Minimal handler stub created with TODO comments
- [ ] Handler registered in httpServer.ts
- [ ] Format fix ran (`yarn turbo:format:fix`)
- [ ] All modified files listed with relative paths

**CRITICAL CONSTRAINTS:**
- Do NOT implement any business logic
- Do NOT create database services, queries, or migrations
- Do NOT create utility functions or helpers
- Do NOT create tests
- Do NOT run typecheck or lint (only format fix)
- Create ONLY the endpoint skeleton files listed above
</success_criteria>
