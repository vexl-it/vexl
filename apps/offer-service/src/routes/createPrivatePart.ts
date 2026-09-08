import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  DuplicatedPublicKeyError,
  type ServerPrivatePart,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {hashAdminId} from '../utils/hashAdminId'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

const isWithoutDuplicates = (
  privateList: readonly ServerPrivatePart[]
): boolean => {
  const deduped = Array.dedupeWith<readonly ServerPrivatePart[]>(
    (a, b) => a.userPublicKey === b.userPublicKey
  )(privateList)

  return Array.length(deduped) === Array.length(privateList)
}

export const createPrivatePart = makeHttpApiHandler(
  OfferApiSpecification,
  'root',
  'createPrivatePart',
  (req) =>
    Effect.gen(function* () {
      const offerDbService = yield* OfferDbService

      if (!isWithoutDuplicates(req.payload.offerPrivateList)) {
        return yield* Effect.fail(new DuplicatedPublicKeyError({status: 400}))
      }

      const adminIdHashed = yield* hashAdminId(req.payload.adminId)

      const offer =
        yield* offerDbService.queryPublicPartByAdminId(adminIdHashed)
      if (Option.isNone(offer)) {
        return yield* Effect.fail(new NotFoundError())
      }

      const existingPrivateParts =
        yield* offerDbService.queryAllPrivateRecordsByPublicRecordId(
          offer.value.id
        )

      const privatePartsToRemove = Array.intersectionWith<{
        userPublicKey: PublicKeyPemBase64 | PublicKeyV2
      }>((a, b) => a.userPublicKey === b.userPublicKey)(
        existingPrivateParts,
        req.payload.offerPrivateList
      )

      yield* Effect.forEach(
        privatePartsToRemove,
        ({userPublicKey}) =>
          offerDbService.deletePrivatePart({
            forPublicKey: userPublicKey,
            offerId: offer.value.id,
          }),
        {}
      )

      yield* Effect.forEach(
        req.payload.offerPrivateList,
        (privatePart) =>
          offerDbService.insertOfferPrivatePart({
            ...privatePart,
            offerId: offer.value.id,
          }),
        {}
      )
      return {}
    }).pipe(
      withDbTransaction,
      withOfferAdminActionRedisLock(req.payload.adminId),
      makeEndpointEffect
    )
)
