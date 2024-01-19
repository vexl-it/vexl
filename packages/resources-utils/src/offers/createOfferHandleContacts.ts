import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type OfferInfo,
  type OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type ContactPrivateApi} from '@vexl-next/rest-api/src/services/contact'
import {type OfferPrivateApi} from '@vexl-next/rest-api/src/services/offer'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {type OfferEncryptionProgress} from './OfferEncryptionProgress'
import decryptOffer, {
  type ErrorDecryptingOffer,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'
import {type ErrorConstructingPrivatePayloads} from './utils/constructPrivatePayloads'
import encryptOfferPublicPayload, {
  type ErrorEncryptingPublicPart,
} from './utils/encryptOfferPublicPayload'
import {
  type ApiErrorFetchingContactsForOffer,
  type ConnectionsInfoForOffer,
} from './utils/fetchContactsForOffer'
import generateSymmetricKey, {
  type ErrorGeneratingSymmetricKey,
} from './utils/generateSymmetricKey'
import {
  fetchInfoAndGeneratePrivatePayloads,
  type PrivatePartEncryptionError,
} from './utils/offerPrivatePayload'

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
  countryPrefix,
  intendedConnectionLevel,
  onProgress,
}: {
  offerApi: OfferPrivateApi
  contactApi: ContactPrivateApi
  publicPart: OfferPublicPart
  ownerKeyPair: PrivateKeyHolder
  countryPrefix: CountryPrefix
  intendedConnectionLevel: IntendedConnectionLevel
  onProgress?: (status: OfferEncryptionProgress) => void
}): TE.TaskEither<
  | ApiErrorFetchingContactsForOffer
  | ErrorConstructingPrivatePayloads
  | ApiErrorWhileCreatingOffer
  | ErrorGeneratingSymmetricKey
  | ErrorDecryptingOffer
  | ErrorEncryptingPublicPart
  | NonCompatibleOfferVersionError,
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
          countryPrefix,
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
