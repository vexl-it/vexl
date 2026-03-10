---
name: create-endpoint
description: Creates a minimal API endpoint skeleton for Vexl backend services. Use when scaffolding new REST endpoints including contracts, specification, handler stub, and HTTP server wiring. Does not create database services, utilities, tests, or other supporting code.
---

# Create Endpoint

## Objective

Scaffold a minimal API endpoint skeleton for a Vexl backend service. Create only:

1. Contract definition in `packages/rest-api/src/services/{service}/contracts.ts`
2. Endpoint specification in `packages/rest-api/src/services/{service}/specification.ts`
3. Client API function export in `packages/rest-api/src/services/{service}/index.ts`
4. Empty handler stub in `apps/{service}-service/src/routes/{group}/{endpointName}.ts`
5. HTTP server wiring in `apps/{service}-service/src/httpServer.ts`

Do not create:

- Database services or queries
- Utility functions
- Helper modules
- Any other supporting code
- Tests

Keep the handler minimal. Include only the skeleton and TODO comments.

## Available Services

Backend services:

- `btc-exchange-rate-service`
- `chat-service`
- `contact-service`
- `content-service`
- `feedback-service`
- `location-service`
- `metrics-service`
- `notification-service`
- `offer-service`
- `user-service`

REST API service directories:

- `btcExchangeRate`
- `chat`
- `contact`
- `content`
- `feedback`
- `location`
- `metrics`
- `notification`
- `offer`
- `user`

## Required Input

Gather the following before creating the endpoint. If required information is missing or not obvious, ask the user directly before scaffolding.

| Field | Requirement | Notes |
|-----------|-------------|-------------|
| Endpoint name | Required | CamelCase name such as `getClubContacts` or `createUser` |
| URL path | Required | REST path such as `/api/v1/users/me` |
| Target service | Required | Which service owns the endpoint |
| HTTP method | Required | `GET`, `POST`, `PUT`, or `DELETE` |
| Max expected daily calls | Required | Integer for `MaxExpectedDailyCall`; always ask if missing |
| Headers and security | Required | One of the options in the next section; always ask if missing |
| API group | Optional | Infer from URL when clear; otherwise ask |
| Request schema | Optional | URL params for `GET`, payload for other methods |
| Response schema | Optional | Success response shape |
| Errors | Optional | Custom error types, if any |

### Headers And Security Options

Ask the user to choose one when it is not explicitly provided:

1. `CommonAndSecurityHeaders` plus `ServerSecurityMiddleware`
   Use for authenticated endpoints that validate the user signature.
2. `CommonHeaders` only
   Use for public endpoints that still require common tracking headers.
3. None
   Use for fully public endpoints with no headers required.

## Workflow

### Step 1: Gather Information

Check what the user already provided. Ask for anything critical that is missing:

- Endpoint name, URL path, and target service are required.
- HTTP method is required. Do not assume `POST`.
- Headers and security choice is required. Do not assume a default.
- `MaxExpectedDailyCall` is required. Do not assume a default.

### Step 2: Read Existing Patterns

Read these files in the target service before making changes:

```text
packages/rest-api/src/services/{service}/contracts.ts
packages/rest-api/src/services/{service}/specification.ts
packages/rest-api/src/services/{service}/index.ts
apps/{service}-service/src/httpServer.ts
apps/{service}-service/src/routes/{group}/
```

Use one existing handler in the same route group as the style reference.

### Step 3: Create Contract Definitions

Add the request, response, and custom errors to `packages/rest-api/src/services/{service}/contracts.ts`.

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

### Step 4: Create Endpoint Specification

Add the endpoint to `packages/rest-api/src/services/{service}/specification.ts`.

```typescript
export const {EndpointName}Endpoint = HttpApiEndpoint.{method}(
  '{endpointName}',
  '{urlPath}'
)
  // Add headers based on the user's choice:
  // .setHeaders(CommonAndSecurityHeaders).middleware(ServerSecurityMiddleware)
  // .setHeaders(CommonHeaders)
  // no headers
  .setPayload({EndpointName}Request)     // for POST/PUT/DELETE
  // OR .setUrlParams({EndpointName}Request)  // for GET
  .addSuccess({EndpointName}Response)
  .addError({ErrorName}Error, {status: {statusCode}})  // if custom errors
  .annotate(MaxExpectedDailyCall, {maxDailyCalls})
```

Then add the endpoint to the appropriate `HttpApiGroup`.

```typescript
const {GroupName}ApiGroup = HttpApiGroup.make('{GroupName}')
  .add({EndpointName}Endpoint)
  // ...other endpoints
```

### Step 5: Create Client API Function

Add the client export to `packages/rest-api/src/services/{service}/index.ts` when the service exposes client functions.

```typescript
{endpointName}: (body: {EndpointName}Request) =>
  client.{GroupName}.{endpointName}({
    payload: body,
    headers: commonAndSecurityHeaders,
  }),
```

### Step 6: Create Handler Stub

Create `apps/{service}-service/src/routes/{group}/{endpointName}.ts`.

```typescript
import {HttpApiBuilder} from '@effect/platform/index'
import {ServiceNameApiSpecification} from '@vexl-next/rest-api/src/services/{service}/specification'
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

Keep the handler minimal. Do not add:

- Database service imports or usage
- Utility imports
- Implementation logic

### Step 7: Wire Up The HTTP Server

Update `apps/{service}-service/src/httpServer.ts`.

Add the import:

```typescript
import {endpointName} from './routes/{group}/{endpointName}'
```

Add the handler to the appropriate group:

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

### Step 8: Run Format Fix

Run:

```bash
yarn turbo:format:fix
```

### Step 9: Report Modified Files

List all modified files with paths relative to the repo root.

## Patterns

### Contract Patterns

Simple success response:

```typescript
export const MyEndpointResponse = Schema.Struct({
  success: Schema.Boolean,
})
```

No-content response:

```typescript
import {NoContentResponse} from '../../NoContentResponse.brand'
// In endpoint: .addSuccess(NoContentResponse, {status: 201})
```

Paginated response:

```typescript
import {createPageResponse, PageRequestMeta} from '../../Pagination.brand'
export const MyEndpointResponse = createPageResponse(ItemSchema)
```

Optional fields:

```typescript
Schema.optionalWith(SomeType, {as: 'Option'})
// or with default:
Schema.optionalWith(Schema.Boolean, {default: () => false})
```

### Endpoint Specification Patterns

Headers and security options:

```typescript
// Option 1: Authenticated
.setHeaders(CommonAndSecurityHeaders)
.middleware(ServerSecurityMiddleware)

// Option 2: Public with tracking headers
.setHeaders(CommonHeaders)

// Option 3: Fully public
// no setHeaders or middleware
```

Challenge validation for sensitive operations:

```typescript
// Request includes RequestBaseWithChallenge fields
.addError(InvalidChallengeError, {status: 401})
```

HTTP methods:

- `HttpApiEndpoint.get()` uses `.setUrlParams()`
- `HttpApiEndpoint.post()` uses `.setPayload()`
- `HttpApiEndpoint.put()` uses `.setPayload()`
- `HttpApiEndpoint.del()` uses `.setPayload()` or no body

### Handler Stub Pattern

Minimal authenticated handler:

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

Add database access, transactions, redis locks, and other implementation details later when implementing real logic, not while scaffolding.

## Success Criteria

The endpoint skeleton is complete when all of the following are true:

- Contract request and response schemas were added to `contracts.ts`
- Endpoint definition was added to `specification.ts` with the correct annotations
- Endpoint was added to the appropriate `HttpApiGroup`
- Client function was added to `index.ts` when applicable
- Minimal handler stub was created with TODO comments
- Handler was registered in `httpServer.ts`
- `yarn turbo:format:fix` ran
- All modified files were listed with relative paths

Critical constraints:

- Do not implement business logic
- Do not create database services, queries, or migrations
- Do not create utility functions or helpers
- Do not create tests
- Do not run typecheck or lint as part of using this skill; run only format fix
- Create only the endpoint skeleton files listed in this skill
