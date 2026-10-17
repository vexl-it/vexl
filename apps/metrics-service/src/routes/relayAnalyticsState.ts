import {HttpApiBuilder} from '@effect/platform/index'
import {analyticsStateMaxAgeDays} from '@vexl-next/analytics-definitions/src/core'
import {
  decodeAnalyticsPayload,
  findAnalyticsDefinition,
} from '@vexl-next/analytics-definitions/src/registry'
import {decapsulateRequest} from '@vexl-next/cryptography/src/operations/ohttp'
import {OhttpGatewaySecret} from '@vexl-next/cryptography/src/operations/ohttp.brand'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  AnalyticsGatewayKeyUnavailableError,
  InvalidAnalyticsStateError,
  RELAY_TOKEN_HEADER,
  RelayedAnalyticsState,
  UnknownAnalyticsRelayError,
} from '@vexl-next/rest-api/src/services/metrics/contracts'
import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {
  Array,
  type ConfigError,
  Effect,
  Option,
  Redacted,
  Schema,
} from 'effect/index'
import {timingSafeEqual} from 'node:crypto'
import {
  analyticsOhttpGatewaySecretsConfig,
  analyticsRelayTokensConfig,
  analyticsWindowConfig,
} from '../configs'
import {MetricsDbService} from '../db/MetricsDbService'
import {
  checkAnalyticsStateDays,
  countryPrefixColumnOf,
  releaseLineOf,
  todayDay,
} from '../utils/analyticsStateRules'

const sameToken = (expected: string, actual: string): boolean => {
  const a = Buffer.from(expected)
  const b = Buffer.from(actual)
  return a.length === b.length && timingSafeEqual(a, b)
}

const requireKnownRelay = (
  token: string | undefined
): Effect.Effect<void, UnknownAnalyticsRelayError | ConfigError.ConfigError> =>
  Effect.gen(function* (_) {
    const tokens = yield* _(analyticsRelayTokensConfig)
    if (
      token === undefined ||
      !Array.some(tokens, (known) => sameToken(Redacted.value(known), token))
    )
      return yield* _(new UnknownAnalyticsRelayError())
  })

const openRelayedState = (
  request: Uint8Array
): Effect.Effect<
  RelayedAnalyticsState,
  | AnalyticsGatewayKeyUnavailableError
  | InvalidAnalyticsStateError
  | UnexpectedServerError
  | ConfigError.ConfigError
> =>
  Effect.gen(function* (_) {
    const gatewaySecrets = yield* _(
      analyticsOhttpGatewaySecretsConfig,
      Effect.map(
        Array.map((secret) => OhttpGatewaySecret.make(Redacted.value(secret)))
      )
    )
    const plaintext = yield* _(decapsulateRequest({gatewaySecrets, request}))
    return yield* _(
      Schema.decodeUnknown(Schema.parseJson(RelayedAnalyticsState))(
        new TextDecoder().decode(plaintext)
      )
    )
  }).pipe(
    Effect.catchTags({
      OhttpUnknownKeyError: ({keyId}) =>
        Effect.logWarning('Analytics request for unknown gateway key', {
          keyId,
        }).pipe(Effect.zipRight(new AnalyticsGatewayKeyUnavailableError())),
      OhttpDecapsulationError: (e) =>
        Effect.logWarning('Rejected analytics request', {
          reason: e._tag,
        }).pipe(
          Effect.zipRight(new InvalidAnalyticsStateError({message: e._tag}))
        ),
      ParseError: (e) =>
        Effect.logWarning('Rejected analytics request', {
          reason: e._tag,
        }).pipe(
          Effect.zipRight(new InvalidAnalyticsStateError({message: e._tag}))
        ),
      OhttpInvalidKeyError: (cause) =>
        new UnexpectedServerError({message: 'Bad gateway secrets', cause}),
    })
  )

const storeAnalyticsState = ({
  client,
  state,
}: RelayedAnalyticsState): Effect.Effect<
  void,
  InvalidAnalyticsStateError | UnexpectedServerError | ConfigError.ConfigError,
  MetricsDbService
> => {
  const reject = (
    reason: string
  ): Effect.Effect<never, InvalidAnalyticsStateError> =>
    Effect.logWarning('Rejected analytics state', {
      name: state.name,
      reason,
    }).pipe(Effect.zipRight(new InvalidAnalyticsStateError({message: reason})))

  return Effect.gen(function* (_) {
    const definition = yield* _(findAnalyticsDefinition(state.name))
    const payload = yield* _(
      decodeAnalyticsPayload(state.name, state.schemaVersion, state.payload)
    )

    const today = yield* _(todayDay)
    const window = yield* _(analyticsWindowConfig)
    yield* _(
      checkAnalyticsStateDays({
        startDay: state.startDay,
        updatedDay: state.updatedDay,
        today,
        maxAgeDays: analyticsStateMaxAgeDays(definition, window),
        updatedDayPrecision:
          definition.kind === 'journey'
            ? definition.updatedDayPrecision
            : 'day',
      })
    )

    const metricsDb = yield* _(MetricsDbService)
    yield* _(
      metricsDb.upsertAnalyticsState({
        id: state.id,
        kind: state.kind,
        name: state.name,
        schemaVersion: state.schemaVersion,
        revision: state.revision,
        startDay: state.startDay,
        updatedDay: state.updatedDay,
        payload,
        appPlatform: client.platform,
        appMajorVersion: releaseLineOf(Option.some(client.semver)),
        countryPrefix: countryPrefixColumnOf(
          definition.storeCountry,
          client.prefix
        ),
      })
    )
  }).pipe(
    Effect.catchTags({
      UnknownAnalyticsDefinitionError: (e) => reject(e._tag),
      AnalyticsSchemaVersionMismatchError: (e) => reject(e._tag),
      ParseError: (e) => reject(e._tag),
      AnalyticsStateConflictError: (e) => reject(e._tag),
      AnalyticsDayRuleError: (e) => reject(e.rule),
    })
  )
}

export const relayAnalyticsState = HttpApiBuilder.handler(
  MetricsApiSpecification,
  'root',
  'relayAnalyticsState',
  ({headers, payload}) =>
    requireKnownRelay(headers[RELAY_TOKEN_HEADER]).pipe(
      Effect.zipRight(openRelayedState(payload)),
      Effect.flatMap(storeAnalyticsState),
      Effect.as({}),
      makeEndpointEffect
    )
)
