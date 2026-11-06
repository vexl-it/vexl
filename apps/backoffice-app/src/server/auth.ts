import {type BackofficeRole} from '@/src/services/adminTokenService'
import {type ConfigError, Effect, Schema} from 'effect'
import {type NextRequest} from 'next/server'
import {createHash, timingSafeEqual} from 'node:crypto'
import {adminTokenHashConfig, contentEditorTokenHashConfig} from './config'

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

export const resolveRequestRole = (
  request: NextRequest
): Effect.Effect<
  BackofficeRole,
  MissingAdminTokenError | InvalidAdminTokenError | ConfigError.ConfigError
> =>
  Effect.gen(function* (_) {
    const token = request.headers.get('x-admin-token')
    if (!token) {
      return yield* _(
        Effect.fail(
          new MissingAdminTokenError({message: 'Missing admin token'})
        )
      )
    }

    const computedHash = hashSha256(token)
    if (timingSafeStringEqual(yield* _(adminTokenHashConfig), computedHash)) {
      return 'admin'
    }
    if (
      timingSafeStringEqual(
        yield* _(contentEditorTokenHashConfig),
        computedHash
      )
    ) {
      return 'contentEditor'
    }

    return yield* _(
      Effect.fail(new InvalidAdminTokenError({message: 'Invalid admin token'}))
    )
  })
