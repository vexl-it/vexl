import {type ConfigError, Effect, Schema} from 'effect'
import {type NextRequest} from 'next/server'
import {createHash, timingSafeEqual} from 'node:crypto'
import {adminTokenHashConfig} from './config'

export class MissingAdminTokenError extends Schema.TaggedError<MissingAdminTokenError>(
  'MissingAdminTokenError'
)('MissingAdminTokenError', {
  message: Schema.String,
}) {}

export class InvalidAdminTokenError extends Schema.TaggedError<InvalidAdminTokenError>(
  'InvalidAdminTokenError'
)('InvalidAdminTokenError', {
  message: Schema.String,
}) {}

const hashSha256 = (value: string): string =>
  createHash('sha256').update(value).digest('base64')

const timingSafeStringEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) return false

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export const validateAdminToken = (
  adminToken: string | null
): Effect.Effect<
  boolean,
  MissingAdminTokenError | InvalidAdminTokenError | ConfigError.ConfigError
> =>
  Effect.gen(function* (_) {
    if (!adminToken) {
      return yield* _(
        Effect.fail(
          new MissingAdminTokenError({message: 'Missing admin token'})
        )
      )
    }

    const correctHash = yield* _(adminTokenHashConfig)
    const computedHash = hashSha256(adminToken)

    if (!timingSafeStringEqual(correctHash, computedHash)) {
      return yield* _(
        Effect.fail(
          new InvalidAdminTokenError({message: 'Invalid admin token'})
        )
      )
    }

    return true
  })

export const validateAdminRequest = (
  request: NextRequest
): Effect.Effect<
  boolean,
  MissingAdminTokenError | InvalidAdminTokenError | ConfigError.ConfigError
> => validateAdminToken(request.headers.get('x-admin-token'))
