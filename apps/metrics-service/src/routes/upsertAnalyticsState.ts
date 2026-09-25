import {HttpApiBuilder} from '@effect/platform/index'
import {analyticsStateMaxAgeDays} from '@vexl-next/analytics-definitions/src/core'
import {
  decodeAnalyticsPayload,
  findAnalyticsDefinition,
} from '@vexl-next/analytics-definitions/src/registry'
import {InvalidAnalyticsStateError} from '@vexl-next/rest-api/src/services/metrics/contracts'
import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect/index'
import {analyticsWindowConfig} from '../configs'
import {MetricsDbService} from '../db/MetricsDbService'
import {
  checkAnalyticsStateDays,
  countryPrefixColumnOf,
  releaseLineOf,
  todayDay,
} from '../utils/analyticsStateRules'

export const upsertAnalyticsState = HttpApiBuilder.handler(
  MetricsApiSpecification,
  'root',
  'upsertAnalyticsState',
  ({headers, payload}) => {
    const reject = (
      reason: string
    ): Effect.Effect<never, InvalidAnalyticsStateError> =>
      Effect.logWarning('Rejected analytics state', {
        name: payload.name,
        reason,
      }).pipe(
        Effect.zipRight(new InvalidAnalyticsStateError({message: reason}))
      )

    return Effect.gen(function* (_) {
      const definition = yield* _(findAnalyticsDefinition(payload.name))
      const state = yield* _(
        decodeAnalyticsPayload(
          payload.name,
          payload.schemaVersion,
          payload.payload
        )
      )

      const today = yield* _(todayDay)
      const window = yield* _(analyticsWindowConfig)
      yield* _(
        checkAnalyticsStateDays({
          startDay: payload.startDay,
          updatedDay: payload.updatedDay,
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
          id: payload.id,
          kind: payload.kind,
          name: payload.name,
          schemaVersion: payload.schemaVersion,
          revision: payload.revision,
          startDay: payload.startDay,
          updatedDay: payload.updatedDay,
          payload: state,
          appPlatform: Option.getOrElse(
            headers.clientPlatformOrNone,
            () => 'unknown'
          ),
          appMajorVersion: releaseLineOf(headers.clientSemverOrNone),
          countryPrefix: countryPrefixColumnOf(
            definition.storeCountry,
            headers.prefixOrNone
          ),
        })
      )

      return {}
    }).pipe(
      Effect.catchTags({
        UnknownAnalyticsDefinitionError: (e) => reject(e._tag),
        AnalyticsSchemaVersionMismatchError: (e) => reject(e._tag),
        ParseError: (e) => reject(e._tag),
        AnalyticsStateConflictError: (e) => reject(e._tag),
        AnalyticsDayRuleError: (e) => reject(e.rule),
      }),
      makeEndpointEffect
    )
  }
)
