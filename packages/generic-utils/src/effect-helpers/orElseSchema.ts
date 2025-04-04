import {Schema} from 'effect'
import {type LiteralValue} from 'effect/SchemaAST'

export const orElseSchema =
  <L extends LiteralValue>(literal: L) =>
  <A, I, R>(self: Schema.Schema<A, I, R>) =>
    Schema.Union(
      self,
      Schema.transform(Schema.Unknown, Schema.Literal(literal), {
        decode: () => literal,
        encode: (literal) => literal,
      })
    )

export const nullFallbackSchema = orElseSchema(null)
