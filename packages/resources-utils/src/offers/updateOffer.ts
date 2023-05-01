import {type OfferPrivateApi} from '@vexl-next/rest-api/dist/services/offer'
import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {
  type OfferInfo,
  type OfferPublicPart,
  type PrivatePayloadEncrypted,
  type SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import encryptOfferPublicPayload, {
  type ErrorEncryptingPublicPart,
} from './utils/encryptOfferPublicPayload'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import decryptOffer, {type ErrorDecryptingOffer} from './decryptOffer'
import {
  type ErrorConstructingPrivatePayloads,
  fetchInfoAndGeneratePrivatePayloads,
  type PrivatePartEncryptionError,
} from './utils/offerPrivatePayload'
import {type ContactPrivateApi} from '@vexl-next/rest-api/dist/services/contact'
import generateSymmetricKey, {
  type ErrorGeneratingSymmetricKey,
} from './utils/generateSymmetricKey'
import {type ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {type ApiErrorFetchingContactsForOffer} from './utils/fetchContactsForOffer'
import {type ExtractLeftTE} from '../utils/ExtractLeft'

export type ApiErrorUpdatingOffer = ExtractLeftTE<
  ReturnType<OfferPrivateApi['updateOffer']>
>
export default function updateOffer({
  offerApi,
  adminId,
  publicPayload,
  symmetricKey,
  ownerKeypair,
  privatePayloads,
}: {
  offerApi: OfferPrivateApi
  adminId: OfferAdminId
  publicPayload: OfferPublicPart
  symmetricKey: SymmetricKey
  ownerKeypair: PrivateKeyHolder
  privatePayloads: Array<{
    userPublicKey: PublicKeyPemBase64
    payloadPrivate: PrivatePayloadEncrypted
  }>
}): TE.TaskEither<
  ApiErrorUpdatingOffer | ErrorEncryptingPublicPart | ErrorDecryptingOffer,
  OfferInfo
> {
  return pipe(
    TE.Do,
    TE.chainW(() =>
      encryptOfferPublicPayload({offerPublicPart: publicPayload, symmetricKey})
    ),
    TE.chainW((encryptedPayload) =>
      pipe(
        offerApi.updateOffer({
          adminId,
          payloadPublic: encryptedPayload,
          offerPrivateList: privatePayloads,
        }),
        TE.chainW(decryptOffer(ownerKeypair))
      )
    )
  )
}

export interface UpdateOfferResult {
  encryptionErrors: PrivatePartEncryptionError[]
  offerInfo: OfferInfo
}

export function updateOfferReencryptForAll({
  offerApi,
  adminId,
  publicPayload,
  ownerKeyPair,
  contactApi,
  connectionLevel,
}: {
  offerApi: OfferPrivateApi
  contactApi: ContactPrivateApi
  adminId: OfferAdminId
  publicPayload: OfferPublicPart
  ownerKeyPair: PrivateKeyHolder
  connectionLevel: ConnectionLevel
}): TE.TaskEither<
  | ErrorGeneratingSymmetricKey
  | ErrorEncryptingPublicPart
  | ApiErrorUpdatingOffer
  | ErrorConstructingPrivatePayloads
  | ErrorDecryptingOffer
  | ApiErrorFetchingContactsForOffer,
  UpdateOfferResult
> {
  return pipe(
    TE.Do,
    TE.bindW('symmetricKey', () => TE.fromEither(generateSymmetricKey())),
    TE.bindW('privatePayloads', ({symmetricKey}) =>
      fetchInfoAndGeneratePrivatePayloads({
        contactApi,
        ownerCredentials: ownerKeyPair,
        symmetricKey,
        connectionLevel,
      })
    ),
    TE.bindW('response', ({symmetricKey, privatePayloads}) =>
      pipe(
        updateOffer({
          privatePayloads: privatePayloads.privateParts,
          symmetricKey,
          ownerKeypair: ownerKeyPair,
          offerApi,
          adminId,
          publicPayload,
        })
      )
    ),
    TE.map(({response, privatePayloads}) => ({
      offerInfo: response,
      encryptionErrors: privatePayloads.errors,
    }))
  )
}
