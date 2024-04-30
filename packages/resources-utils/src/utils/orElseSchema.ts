import {Schema, type AST} from '@effect/schema'

export const orElseSchema =
  <L extends AST.LiteralValue>(literal: L) =>
  <A, I, R>(self: Schema.Schema<A, I, R>) =>
    Schema.Union(
      self,
      Schema.transform(Schema.Unknown, Schema.Literal(literal), {
        decode: () => literal,
        encode: (literal) => literal,
      })
    )
