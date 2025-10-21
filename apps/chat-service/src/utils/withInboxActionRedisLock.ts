import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {
  type withRedisLock,
  withRedisLockFromEffect,
} from '@vexl-next/server-utils/src/RedisService'
import {Array, Effect, pipe} from 'effect'

export const withInboxActionRedisLock = <A, E, R, R2>(
  ...publicKeys: Array<
    Effect.Effect<PublicKeyPemBase64, never, R2> | PublicKeyPemBase64
  >
): ReturnType<typeof withRedisLock<A, E, R | R2>> =>
  withRedisLockFromEffect(
    pipe(
      publicKeys,
      Array.map((one) => (Effect.isEffect(one) ? one : Effect.succeed(one))),
      Effect.all,
      Effect.map(Array.map((key) => `inboxAction:${key}`))
    ),
    '10 seconds'
  )

export const withInboxActionFromSecurityRedisLock = <A, E, R>(): ReturnType<
  typeof withRedisLock<A, E, R | CurrentSecurity>
> =>
  withInboxActionRedisLock(
    CurrentSecurity.pipe(Effect.map((s) => s['public-key']))
  )
