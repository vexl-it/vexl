import {type KeyHolder} from '@vexl-next/cryptography'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ClubKeyNotFoundInInnerStateError,
  type ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
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
import {Effect} from 'effect'
import decryptOffer, {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'
import {type OfferEncryptionProgress} from './OfferEncryptionProgress'
import {type PrivatePayloadsConstructionError} from './utils/constructPrivatePayloads'
import encryptOfferPublicPayload, {
  type PublicPartEncryptionError,
} from './utils/encryptOfferPublicPayload'
import {type PrivatePartEncryptionError} from './utils/encryptPrivatePart'
import {
  type ApiErrorFetchingContactsForOffer,
  type ConnectionsInfoForOffer,
} from './utils/fetchContactsForOffer'
import generateSymmetricKey, {
  type SymmetricKeyGenerationError,
} from './utils/generateSymmetricKey'
import {fetchInfoAndGeneratePrivatePayloads} from './utils/offerPrivatePayload'
import {sendOfferToNetworkBatchPrivateParts} from './utils/sendOfferToNetworkBatchPrivateParts'

export type ApiErrorWhileCreatingOffer = Effect.Effect.Error<
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
  intendedClubs,
}: {
  offerApi: OfferApi
  contactApi: ContactApi
  publicPart: OfferPublicPart
  ownerKeyPair: PrivateKeyHolder
  countryPrefix: CountryPrefix
  intendedConnectionLevel: IntendedConnectionLevel
  intendedClubs: Record<ClubUuid, KeyHolder.PrivateKeyHolder>
  onProgress?: (status: OfferEncryptionProgress) => void
}): Effect.Effect<
  CreateOfferResult,
  | ApiErrorFetchingContactsForOffer
  | PrivatePayloadsConstructionError
  | ApiErrorWhileCreatingOffer
  | SymmetricKeyGenerationError
  | DecryptingOfferError
  | PublicPartEncryptionError
  | NonCompatibleOfferVersionError
  | ClubKeyNotFoundInInnerStateError
> {
  return Effect.gen(function* (_) {
    const adminId = generateAdminId()
    const symmetricKey = yield* _(generateSymmetricKey())

    if (onProgress) onProgress({type: 'CONSTRUCTING_PUBLIC_PAYLOAD'})

    const encryptedPublic = yield* _(
      encryptOfferPublicPayload({
        offerPublicPart: publicPart,
        symmetricKey,
      })
    )

    const privatePayloads = yield* _(
      fetchInfoAndGeneratePrivatePayloads({
        symmetricKey,
        intendedConnectionLevel,
        contactApi,
        ownerCredentials: ownerKeyPair,
        intendedClubs,
        onProgress,
        adminId,
      })
    )

    if (onProgress) onProgress({type: 'SENDING_OFFER_TO_NETWORK'})

    const sendOfferToNetworkResponse = yield* _(
      sendOfferToNetworkBatchPrivateParts({
        offerApi,
        offerData: {
          offerPrivateList: privatePayloads.privateParts,
          countryPrefix,
          payloadPublic: encryptedPublic,
          offerType: publicPart.offerType,
          adminId,
        },
      })
    )

    const offerInfo = yield* _(
      decryptOffer(ownerKeyPair)(sendOfferToNetworkResponse)
    )

    if (onProgress) onProgress({type: 'DONE'})

    return {
      adminId: sendOfferToNetworkResponse.adminId,
      offerInfo,
      encryptionErrors: privatePayloads.errors,
      symmetricKey,
      encryptedFor: privatePayloads.connections,
    } satisfies CreateOfferResult
  })
}
