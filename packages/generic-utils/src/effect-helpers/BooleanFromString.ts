import {ParseResult, Schema} from '@effect/schema'
import {Effect} from 'effect'

export const BooleanfromString = Schema.transformOrFail(
  Schema.String,
  Schema.Boolean,
  {
    decode: (b) => {
      if (b !== 'true' && b !== 'false') {
        return Effect.fail(
          new ParseResult.Unexpected(b, 'Unable to convert to boolean')
        )
      }
      return Effect.succeed(b === 'true')
    },
    encode: (s) => Effect.succeed(s ? 'true' : 'false'),
  }
)
