import {type SqlError} from '@effect/sql/SqlError'
import {Option, Schema} from 'effect'

const PgErrorCause = Schema.Struct({
  code: Schema.String,
  constraint: Schema.String,
})

export const isUniqueViolation = (
  error: SqlError,
  constraint: string
): boolean =>
  Schema.decodeUnknownOption(PgErrorCause)(error.cause).pipe(
    Option.exists(
      (cause) => cause.code === '23505' && cause.constraint === constraint
    )
  )
