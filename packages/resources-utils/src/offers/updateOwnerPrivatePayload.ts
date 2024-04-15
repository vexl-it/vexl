import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type NoContentResponse} from '@vexl-next/rest-api/src/NoContentResponse.brand'
import {type OfferPrivateApi} from '@vexl-next/rest-api/src/services/offer'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {constructAndEncryptPrivatePayloadForOwner} from './constructPrivatePayloadForOwner'
import {type PrivatePartEncryptionError} from './utils/encryptPrivatePart'

export default function updateOwnerPrivatePayoad({
  api,
  ownerCredentials,
  symmetricKey,
  adminId,
  intendedConnectionLevel,
}: {
  api: OfferPrivateApi
  ownerCredentials: PrivateKeyHolder
  symmetricKey: SymmetricKey
  adminId: OfferAdminId
  intendedConnectionLevel: IntendedConnectionLevel
}): TE.TaskEither<
  | PrivatePartEncryptionError
  | ExtractLeftTE<ReturnType<OfferPrivateApi['createPrivatePart']>>,
  NoContentResponse
> {
  return pipe(
    constructAndEncryptPrivatePayloadForOwner({
      ownerCredentials,
      symmetricKey,
      adminId,
      intendedConnectionLevel,
    }),
    TE.chainW((payload) =>
      api.createPrivatePart({
        adminId,
        offerPrivateList: [payload],
      })
    )
  )
}
