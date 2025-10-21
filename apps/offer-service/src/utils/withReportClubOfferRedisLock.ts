import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {
  type withRedisLock,
  withRedisLockFromEffect,
} from '@vexl-next/server-utils/src/RedisService'
import {Effect} from 'effect/index'

export const withReportClubOfferRedisLock = <A, E, R, R2>({
  publicKeyE,
  offerId,
}: {
  publicKeyE: Effect.Effect<PublicKeyPemBase64, never, R2> | PublicKeyPemBase64
  offerId: OfferId
}): ReturnType<typeof withRedisLock<A, E, R | R2>> =>
  withRedisLockFromEffect(
    (Effect.isEffect(publicKeyE)
      ? publicKeyE
      : Effect.succeed(publicKeyE)
    ).pipe(Effect.map((publicKey) => `reportClubOffer:${publicKey}${offerId}`)),
    5000
  )
