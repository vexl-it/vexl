import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  type OfferAdminId,
  type OfferType,
  type PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Array, Effect, pipe} from 'effect'
import {type NonEmptyArray} from 'effect/Array'
import {PRIVATE_PARTS_BATCH_SIZE} from '../privatePartsUploadBatchSize'

export const sendOfferToNetworkBatchPrivateParts = ({
  offerApi,
  offerData,
}: {
  offerApi: OfferApi
  offerData: {
    offerType: OfferType
    ownerPrivatePayload: ServerPrivatePart
    payloadPublic: PublicPayloadEncrypted
    offerPrivateList: NonEmptyArray<ServerPrivatePart>
    countryPrefix: CountryPrefix
    adminId: OfferAdminId
  }
}): ReturnType<OfferApi['createNewOffer']> =>
  Effect.gen(function* (_) {
    const privatePartsBatches = Array.chunksOf(
      offerData.offerPrivateList,
      PRIVATE_PARTS_BATCH_SIZE
    )

    const [firstBatch, ...restOfBatches] = privatePartsBatches

    const createRequest = yield* _(
      offerApi.createNewOffer({
        body: {
          offerPrivateList: [offerData.ownerPrivatePayload, ...firstBatch],
          countryPrefix: offerData.countryPrefix,
          payloadPublic: offerData.payloadPublic,
          offerType: offerData.offerType,
          adminId: offerData.adminId,
        },
      })
    )

    yield* _(
      pipe(
        restOfBatches ?? [],
        Array.map((privateParts) =>
          offerApi.createPrivatePart({
            body: {
              offerPrivateList: privateParts,
              adminId: offerData.adminId,
            },
          })
        ),
        Effect.all,
        Effect.tapError(() =>
          offerApi
            .deleteOffer({query: {adminIds: [offerData.adminId]}})
            .pipe(
              Effect.ignore,
              Effect.zipLeft(
                Effect.log(
                  'Error while creating offer. Cleaning up any already created private parts.'
                )
              )
            )
        )
      )
    )

    return createRequest
  })
