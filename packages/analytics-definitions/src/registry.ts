import {Effect, Option, Record, Schema, type ParseResult} from 'effect'
import {
  analyticsDefinitions,
  type RegisteredAnalyticsDefinition,
} from './definitions'

export {analyticsDefinitions, type RegisteredAnalyticsDefinition}

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
  Record.get(analyticsDefinitions, name).pipe(
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
  object,
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
    return yield* Schema.decodeUnknown(definition.payloadSchema, {
      onExcessProperty: 'error',
    })(payload)
  })
