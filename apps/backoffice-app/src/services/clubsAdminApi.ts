import {FetchHttpClient, HttpApiClient} from '@effect/platform'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {Effect} from 'effect'

// Derive the typed client from the ContactApiSpecification
// Base URL points to the Next.js API proxy route
// The FetchHttpClient.layer is provided here so the returned Effect is ready to run
// Admin token is passed via urlParams in each API call
export const makeClubsAdminClient = (baseUrl = '/api/proxy') =>
  HttpApiClient.make(ContactApiSpecification, {
    baseUrl,
  }).pipe(
    Effect.map((client) => client.ClubsAdmin),
    Effect.provide(FetchHttpClient.layer)
  )

// Helper to run an Effect and convert to Promise for React components
export const runEffect = <A, E>(effect: Effect.Effect<A, E>): Promise<A> =>
  Effect.runPromise(effect)
