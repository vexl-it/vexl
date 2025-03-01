import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type NoContentResponse} from '@vexl-next/rest-api/src/NoContentResponse.brand'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Effect, pipe} from 'effect'
import {constructAndEncryptPrivatePayloadForOwner} from './constructPrivatePayloadForOwner'
import {type PrivatePartEncryptionError} from './utils/encryptPrivatePart'

export default function updateOwnerPrivatePayload({
  api,
  ownerCredentials,
  symmetricKey,
  adminId,
  intendedConnectionLevel,
}: {
  api: OfferApi
  ownerCredentials: PrivateKeyHolder
  symmetricKey: SymmetricKey
  adminId: OfferAdminId
  intendedConnectionLevel: IntendedConnectionLevel
}): Effect.Effect<
  NoContentResponse,
  | PrivatePartEncryptionError
  | Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
> {
  return pipe(
    constructAndEncryptPrivatePayloadForOwner({
      ownerCredentials,
      symmetricKey,
      adminId,
      intendedConnectionLevel,
    }),
    Effect.flatMap((payload) =>
      api.createPrivatePart({
        body: {
          adminId,
          offerPrivateList: [payload],
        },
      })
    )
  )
}
