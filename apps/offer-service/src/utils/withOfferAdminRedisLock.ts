import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'

export const withOfferAdminActionRedisLock = <A, E, R>(
  publicKey: PublicKeyPemBase64
): ReturnType<typeof withRedisLock<A, E, R>> =>
  withRedisLock(`offerAdminAction:${publicKey}`, 500)
