import {type AnalyticsStateUpsert} from '@vexl-next/analytics-definitions/src/core'
import {encapsulateRequest} from '@vexl-next/cryptography/src/operations/ohttp'
import {
  encodeRelayedAnalyticsState,
  OHTTP_REQUEST_CONTENT_TYPE,
} from '@vexl-next/rest-api/src/services/metrics/contracts'
import {Effect, Option, Random, Schema} from 'effect'
import {atom} from 'jotai'
import {platform, sessionCountryPrefixAtom} from '../../api'
import {version} from '../environment'
import {analyticsRelayAtom} from './relayConfig'

export class AnalyticsUploadError extends Schema.TaggedError<AnalyticsUploadError>(
  'AnalyticsUploadError'
)('AnalyticsUploadError', {
  status: Schema.optional(Schema.Number),
  cause: Schema.optional(Schema.Unknown),
}) {}

/** The gateway will never accept this state: drop it. Anything else is retried. */
export const isRejectedByGateway = (error: AnalyticsUploadError): boolean =>
  error.status === 400 || error.status === 413

export type UploadAnalyticsState = (
  state: AnalyticsStateUpsert
) => Effect.Effect<void, AnalyticsUploadError>

/**
 * Sends the state encrypted to the gateway through a random analytics relay,
 * so Vexl never sees the client IP. None when no relay is configured.
 */
export const uploadAnalyticsStateAtom = atom(
  (get): Option.Option<UploadAnalyticsState> => {
    const client = {
      platform,
      semver: version,
      prefix: get(sessionCountryPrefixAtom),
    }

    return Option.map(
      get(analyticsRelayAtom),
      (relay) => (state) =>
        Effect.gen(function* (_) {
          const request = yield* _(
            encapsulateRequest({
              keyConfig: relay.gatewayKeyConfig,
              plaintext: encodeRelayedAnalyticsState({client, state}),
            }),
            Effect.mapError((cause) => new AnalyticsUploadError({cause}))
          )
          const relayUrl = yield* _(Random.choice(relay.relayUrls))
          const response = yield* _(
            Effect.tryPromise({
              try: async () =>
                await fetch(relayUrl, {
                  method: 'POST',
                  headers: {'content-type': OHTTP_REQUEST_CONTENT_TYPE},
                  body: request,
                }),
              catch: (cause) => new AnalyticsUploadError({cause}),
            })
          )
          if (!response.ok)
            return yield* _(new AnalyticsUploadError({status: response.status}))
        })
    )
  }
)
