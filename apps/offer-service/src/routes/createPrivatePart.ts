import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  CreatePrivatePartErrors,
  DuplicatedPublicKeyError,
  type ServerPrivatePart,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {CreatePrivatePartEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option} from 'effect'
import {Handler} from 'effect-http'
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

export const createPrivatePart = Handler.make(
  CreatePrivatePartEndpoint,
  (req, s) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const offerDbService = yield* _(OfferDbService)

        if (!isWithoutDuplicates(req.body.offerPrivateList)) {
          return yield* _(
            Effect.fail(new DuplicatedPublicKeyError({status: 400}))
          )
        }

        const adminIdHashed = yield* _(hashAdminId(req.body.adminId))

        const offer = yield* _(
          offerDbService.queryPublicPartByAdminId(adminIdHashed)
        )
        if (Option.isNone(offer)) {
          return yield* _(Effect.fail(new NotFoundError()))
        }

        const existingPrivateParts = yield* _(
          offerDbService.queryAllPrivateRecordsByPublicRecordId(offer.value.id)
        )

        const privatePartsToRemove = Array.intersectionWith<{
          userPublicKey: PublicKeyPemBase64
        }>((a, b) => a.userPublicKey === b.userPublicKey)(
          existingPrivateParts,
          req.body.offerPrivateList
        )

        yield* _(
          Effect.forEach(
            privatePartsToRemove,
            ({userPublicKey}) =>
              offerDbService.deletePrivatePart({
                forPublicKey: userPublicKey,
                offerId: offer.value.id,
              }),
            {batching: true}
          )
        )

        yield* _(
          Effect.forEach(
            req.body.offerPrivateList,
            (privatePart) =>
              offerDbService.insertOfferPrivatePart({
                ...privatePart,
                offerId: offer.value.id,
              }),
            {batching: true}
          )
        )
        return null
      }).pipe(
        withDbTransaction,
        withOfferAdminActionRedisLock(req.body.adminId)
      ),
      CreatePrivatePartErrors
    )
)
