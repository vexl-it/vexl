import {Effect, Number, Option, Schema, SchemaGetter, SchemaIssue} from 'effect'

export const NumberFromString = Schema.String.pipe(
  Schema.decodeTo(Schema.Number, {
    decode: SchemaGetter.transformOrFail((value) =>
      Number.parse(value).pipe(
        Option.match({
          onNone: () =>
            Effect.fail(
              new SchemaIssue.InvalidValue({expected: 'a numeric string'})
            ),
          onSome: Effect.succeed,
        })
      )
    ),
    encode: SchemaGetter.String(),
  })
)
