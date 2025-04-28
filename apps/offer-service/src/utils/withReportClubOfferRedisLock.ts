import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'

export const withReportClubOfferRedisLock = <A, E, R>({
  publicKey,
  offerId,
}: {
  publicKey: PublicKeyPemBase64
  offerId: OfferId
}): ReturnType<typeof withRedisLock<A, E, R>> =>
  withRedisLock(`reportClubOffer:${publicKey}${offerId}`, 5000)
