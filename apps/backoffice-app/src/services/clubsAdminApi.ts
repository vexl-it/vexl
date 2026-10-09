import {FetchHttpClient, HttpApiClient} from '@effect/platform'
import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {Effect} from 'effect'

export const makeClubsAdminClient = () =>
  HttpApiClient.make(ContactInternalApiSpecification, {
    baseUrl: '/api/proxy/contact-internal',
  }).pipe(
    Effect.map((client) => client.ClubsAdmin),
    Effect.provide(FetchHttpClient.layer)
  )

// Helper to run an Effect and convert to Promise for React components
export const runEffect = <A, E>(effect: Effect.Effect<A, E>): Promise<A> =>
  Effect.runPromise(effect)
