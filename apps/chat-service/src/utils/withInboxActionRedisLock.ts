import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import {Array} from 'effect'

export const withInboxActionRedisLock = <A, E, R>(
  ...publicKeys: PublicKeyPemBase64[]
): ReturnType<typeof withRedisLock<A, E, R>> =>
  withRedisLock(
    Array.map(publicKeys, (key) => `inboxAction:${key}`),
    '10 seconds'
  )
