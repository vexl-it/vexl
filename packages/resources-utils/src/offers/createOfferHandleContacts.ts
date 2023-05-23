import {type OfferPrivateApi} from '@vexl-next/rest-api/dist/services/offer'
import {type ContactPrivateApi} from '@vexl-next/rest-api/dist/services/contact'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import * as TE from 'fp-ts/TaskEither'
import {
  type IntendedConnectionLevel,
  type OfferInfo,
  type OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {pipe} from 'fp-ts/function'
import generateSymmetricKey, {
  type ErrorGeneratingSymmetricKey,
} from './utils/generateSymmetricKey'
import {
  fetchInfoAndGeneratePrivatePayloads,
  type PrivatePartEncryptionError,
} from './utils/offerPrivatePayload'
import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import encryptOfferPublicPayload, {
  type ErrorEncryptingPublicPart,
} from './utils/encryptOfferPublicPayload'
import decryptOffer, {type ErrorDecryptingOffer} from './decryptOffer'
import {
  type ApiErrorFetchingContactsForOffer,
  type ConnectionsInfoForOffer,
} from './utils/fetchContactsForOffer'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {type ErrorConstructingPrivatePayloads} from './utils/constructPrivatePayloads'
import {type OfferEncryptionProgress} from './OfferEncryptionProgress'

export type ApiErrorWhileCreatingOffer = ExtractLeftTE<
  ReturnType<OfferPrivateApi['createNewOffer']>
>

export interface CreateOfferResult {
  encryptionErrors: PrivatePartEncryptionError[]
  adminId: OfferAdminId
  symmetricKey: SymmetricKey
  offerInfo: OfferInfo
  encryptedFor: ConnectionsInfoForOffer
}

export default function createNewOfferForMyContacts({
  offerApi,
  contactApi,
  publicPart,
  ownerKeyPair,
  intendedConnectionLevel,
  onProgress,
}: {
  offerApi: OfferPrivateApi
  contactApi: ContactPrivateApi
  publicPart: OfferPublicPart
  ownerKeyPair: PrivateKeyHolder
  intendedConnectionLevel: IntendedConnectionLevel
  onProgress?: (status: OfferEncryptionProgress) => void
}): TE.TaskEither<
  | ApiErrorFetchingContactsForOffer
  | ErrorConstructingPrivatePayloads
  | ApiErrorWhileCreatingOffer
  | ErrorGeneratingSymmetricKey
  | ErrorDecryptingOffer
  | ErrorEncryptingPublicPart,
  CreateOfferResult
> {
  return pipe(
    TE.Do,
    TE.bindW('symmetricKey', () => TE.fromEither(generateSymmetricKey())),
    TE.bindW('encryptedPublic', ({symmetricKey}) => {
      if (onProgress) onProgress({type: 'CONSTRUCTING_PUBLIC_PAYLOAD'})
      return encryptOfferPublicPayload({
        offerPublicPart: publicPart,
        symmetricKey,
      })
    }),
    TE.bindW('privatePayloads', ({symmetricKey}) =>
      fetchInfoAndGeneratePrivatePayloads({
        symmetricKey,
        intendedConnectionLevel,
        contactApi,
        ownerCredentials: ownerKeyPair,
        onProgress,
      })
    ),
    TE.bindW('response', ({privatePayloads, encryptedPublic}) => {
      if (onProgress) onProgress({type: 'SENDING_OFFER_TO_NETWORK'})
      return pipe(
        offerApi.createNewOffer({
          offerPrivateList: privatePayloads.privateParts,
          payloadPublic: encryptedPublic,
          offerType: publicPart.offerType,
        }),
        TE.bindTo('response'),
        TE.bindW('offerInfo', ({response}) =>
          decryptOffer(ownerKeyPair)(response)
        )
      )
    }),
    TE.map(({response, privatePayloads, symmetricKey}) => ({
      adminId: response.response.adminId,
      offerInfo: response.offerInfo,
      encryptionErrors: privatePayloads.errors,
      symmetricKey,
      encryptedFor: privatePayloads.connections,
    })),
    TE.map((v) => {
      if (onProgress) onProgress({type: 'DONE'})
      return v
    })
  )
}
