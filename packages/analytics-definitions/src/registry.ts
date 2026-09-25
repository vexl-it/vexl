import {Effect, Option, Record, Schema, type ParseResult} from 'effect'
import {marketplaceWeeklyAggregation} from './definitions/marketplaceWeekly'
import {onboardingJourney} from './definitions/onboarding'
import {registrationCohortJourney} from './definitions/registrationCohort'

export const analyticsDefinitions = {
  onboarding: onboardingJourney,
  registrationCohort: registrationCohortJourney,
  marketplaceWeekly: marketplaceWeeklyAggregation,
}

export type AnalyticsDefinitionName = keyof typeof analyticsDefinitions
export type RegisteredAnalyticsDefinition =
  (typeof analyticsDefinitions)[AnalyticsDefinitionName]
export type AnalyticsPayload =
  RegisteredAnalyticsDefinition['payloadSchema']['Type']

const definitionsByName: Record<string, RegisteredAnalyticsDefinition> =
  analyticsDefinitions

export class UnknownAnalyticsDefinitionError extends Schema.TaggedError<UnknownAnalyticsDefinitionError>(
  'UnknownAnalyticsDefinitionError'
)('UnknownAnalyticsDefinitionError', {
  name: Schema.String,
}) {}

export class AnalyticsSchemaVersionMismatchError extends Schema.TaggedError<AnalyticsSchemaVersionMismatchError>(
  'AnalyticsSchemaVersionMismatchError'
)('AnalyticsSchemaVersionMismatchError', {
  name: Schema.String,
  expectedVersion: Schema.Number,
  receivedVersion: Schema.Number,
}) {}

export const findAnalyticsDefinition = (
  name: string
): Effect.Effect<
  RegisteredAnalyticsDefinition,
  UnknownAnalyticsDefinitionError
> =>
  Record.get(definitionsByName, name).pipe(
    Option.match({
      onNone: () => new UnknownAnalyticsDefinitionError({name}),
      onSome: Effect.succeed,
    })
  )

export const decodeAnalyticsPayload = (
  name: string,
  schemaVersion: number,
  payload: unknown
): Effect.Effect<
  AnalyticsPayload,
  | UnknownAnalyticsDefinitionError
  | AnalyticsSchemaVersionMismatchError
  | ParseResult.ParseError
> =>
  Effect.gen(function* () {
    const definition = yield* findAnalyticsDefinition(name)
    if (definition.schemaVersion !== schemaVersion)
      return yield* new AnalyticsSchemaVersionMismatchError({
        name,
        expectedVersion: definition.schemaVersion,
        receivedVersion: schemaVersion,
      })
    return yield* Schema.decodeUnknown(
      Schema.asSchema(definition.payloadSchema),
      {onExcessProperty: 'error'}
    )(payload)
  })
