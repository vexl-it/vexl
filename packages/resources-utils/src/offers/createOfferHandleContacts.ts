import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  generateAdminId,
  type IntendedConnectionLevel,
  type OfferAdminId,
  type OfferInfo,
  type OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {effectToTaskEither} from '../effect-helpers/TaskEitherConverter'
import {type ExtractRightFromEffect} from '../utils/ExtractLeft'
import {type OfferEncryptionProgress} from './OfferEncryptionProgress'
import decryptOffer, {
  type ErrorDecryptingOffer,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'
import {type ErrorConstructingPrivatePayloads} from './utils/constructPrivatePayloads'
import encryptOfferPublicPayload, {
  type ErrorEncryptingPublicPart,
} from './utils/encryptOfferPublicPayload'
import {type PrivatePartEncryptionError} from './utils/encryptPrivatePart'
import {
  type ApiErrorFetchingContactsForOffer,
  type ConnectionsInfoForOffer,
} from './utils/fetchContactsForOffer'
import generateSymmetricKey, {
  type ErrorGeneratingSymmetricKey,
} from './utils/generateSymmetricKey'
import {fetchInfoAndGeneratePrivatePayloads} from './utils/offerPrivatePayload'

export type ApiErrorWhileCreatingOffer = ExtractRightFromEffect<
  ReturnType<OfferApi['createNewOffer']>
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
  offerApi: OfferApi
  contactApi: ContactApi
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
    TE.bindW('adminId', () => TE.right(generateAdminId())),
    TE.bindW('symmetricKey', () => TE.fromEither(generateSymmetricKey())),
    TE.bindW('encryptedPublic', ({symmetricKey}) => {
      if (onProgress) onProgress({type: 'CONSTRUCTING_PUBLIC_PAYLOAD'})
      return encryptOfferPublicPayload({
        offerPublicPart: publicPart,
        symmetricKey,
      })
    }),
    TE.bindW('privatePayloads', ({symmetricKey, adminId}) =>
      fetchInfoAndGeneratePrivatePayloads({
        symmetricKey,
        intendedConnectionLevel,
        contactApi,
        ownerCredentials: ownerKeyPair,
        onProgress,
        adminId,
      })
    ),
    TE.bindW('response', ({privatePayloads, encryptedPublic, adminId}) => {
      if (onProgress) onProgress({type: 'SENDING_OFFER_TO_NETWORK'})
      return pipe(
        effectToTaskEither(
          offerApi.createNewOffer({
            body: {
              offerPrivateList: privatePayloads.privateParts,
              countryPrefix,
              payloadPublic: encryptedPublic,
              offerType: publicPart.offerType,
              adminId,
            },
          })
        ),
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
