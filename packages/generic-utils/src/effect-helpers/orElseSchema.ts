import {Schema, SchemaTransformation} from 'effect'
import {type LiteralValue} from 'effect/SchemaAST'

const withFallback =
  <S extends Schema.Constraint>(fallback: S, value: S['Encoded']) =>
  <A, I, RD, RE>(self: Schema.Codec<A, I, RD, RE>) =>
    Schema.Union([
      self,
      Schema.Unknown.pipe(
        Schema.decodeTo(
          fallback,
          SchemaTransformation.transform<S['Encoded'], unknown>({
            decode: () => value,
            encode: (encoded) => encoded,
          })
        )
      ),
    ])

export const orElseSchema = <L extends LiteralValue>(
  literal: L
): ReturnType<typeof withFallback<Schema.Literal<L>>> =>
  withFallback(Schema.Literal(literal), literal)

export const nullFallbackSchema = withFallback(Schema.Null, null)
