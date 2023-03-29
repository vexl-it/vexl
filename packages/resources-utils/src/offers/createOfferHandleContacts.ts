import {type OfferPrivateApi} from '@vexl-next/rest-api/dist/services/offer'
import {type ContactPrivateApi} from '@vexl-next/rest-api/dist/services/contact'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {type ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'
import * as TE from 'fp-ts/TaskEither'
import {
  type OfferInfo,
  type OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {pipe} from 'fp-ts/function'
import generateSymmetricKey, {
  type ErrorGeneratingSymmetricKey,
} from './utils/generateSymmetricKey'
import {
  type ErrorConstructingPrivatePayloads,
  fetchInfoAndGeneratePrivatePayloads,
  type PrivatePartEncryptionError,
} from './utils/offerPrivatePayload'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'
import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import encryptOfferPublicPayload, {
  type ErrorEncryptingPublicPart,
} from './utils/encryptOfferPublicPayload'
import decryptOffer from './decryptOffer'
import {type ApiErrorFetchingContactsForOffer} from './utils/fetchContactsForOffer'

export type ApiErrorWhileCreatingOffer =
  BasicError<'ApiErrorWhileCreatingOffer'>

export interface CreateOfferResult {
  encryptionErrors: PrivatePartEncryptionError[]
  adminId: OfferAdminId
  symmetricKey: SymmetricKey
  offerInfo: OfferInfo
}

/**
 * Creates new offer for all contacts.
 * Does following tasks:
 * 1. Fetches contacts from the server, based on connectionLevel param
 * 2. Fetches common contacts for each contact
 * 3. Creates and encrypts Private parts for each contact
 * 4. Creates and encrypts Public part
 *
 * @Returns // TODO
 */
export default function createNewOfferForMyContacts({
  offerApi,
  contactApi,
  publicPart,
  ownerKeyPair,
  connectionLevel,
}: {
  offerApi: OfferPrivateApi
  contactApi: ContactPrivateApi
  publicPart: OfferPublicPart
  ownerKeyPair: PrivateKeyHolder
  connectionLevel: ConnectionLevel
}): TE.TaskEither<
  | ApiErrorFetchingContactsForOffer
  | ErrorConstructingPrivatePayloads
  | ApiErrorWhileCreatingOffer
  | ErrorGeneratingSymmetricKey
  | ErrorEncryptingPublicPart,
  CreateOfferResult
> {
  return pipe(
    TE.Do,
    TE.bindW('symmetricKey', () => TE.fromEither(generateSymmetricKey())),
    TE.bindW('encryptedPublic', ({symmetricKey}) =>
      encryptOfferPublicPayload({offerPublicPart: publicPart, symmetricKey})
    ),
    TE.bindW('privatePayloads', ({symmetricKey}) =>
      fetchInfoAndGeneratePrivatePayloads({
        symmetricKey,
        connectionLevel,
        contactApi,
        ownerCredentials: ownerKeyPair,
      })
    ),
    TE.bindW('response', ({privatePayloads, encryptedPublic}) =>
      pipe(
        offerApi.createNewOffer({
          offerPrivateList: privatePayloads.privateParts,
          payloadPublic: encryptedPublic,
          offerType: publicPart.offerType,
        }),
        TE.bindTo('response'),
        TE.bindW('offerInfo', ({response}) =>
          decryptOffer(ownerKeyPair)(response)
        ),
        TE.mapLeft(toError('ApiErrorWhileCreatingOffer'))
      )
    ),
    TE.map(({response, privatePayloads, symmetricKey}) => ({
      adminId: response.response.adminId,
      offerInfo: response.offerInfo,
      encryptionErrors: privatePayloads.errors,
      symmetricKey,
    }))
  )
}
