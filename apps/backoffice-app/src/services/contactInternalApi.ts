import {FetchHttpClient, HttpApiClient} from '@effect/platform'
import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {Effect} from 'effect'

const makeContactInternalClient = () =>
  HttpApiClient.make(ContactInternalApiSpecification, {
    baseUrl: '/api/proxy/contact-internal',
  }).pipe(Effect.provide(FetchHttpClient.layer))

export const makeClubsAdminClient = () =>
  makeContactInternalClient().pipe(Effect.map((client) => client.ClubsAdmin))

export const makeBannedNumbersAdminClient = () =>
  makeContactInternalClient().pipe(
    Effect.map((client) => client.BannedNumbersAdmin)
  )

// Helper to run an Effect and convert to Promise for React components
export const runEffect = <A, E>(effect: Effect.Effect<A, E>): Promise<A> =>
  Effect.runPromise(effect)
