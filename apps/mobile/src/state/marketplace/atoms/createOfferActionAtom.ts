import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ClubKeyNotFoundInInnerStateError,
  type ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type MyOfferInState,
  type OfferId,
  type OfferPublicPart,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import createNewOfferForMyContacts, {
  type ApiErrorWhileCreatingOffer,
} from '@vexl-next/resources-utils/src/offers/createNewOfferForMyContacts'
import {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from '@vexl-next/resources-utils/src/offers/decryptOffer'
import {type PrivatePayloadsConstructionError} from '@vexl-next/resources-utils/src/offers/utils/constructPrivatePayloads'
import {type PublicPartEncryptionError} from '@vexl-next/resources-utils/src/offers/utils/encryptOfferPublicPayload'
import {type ApiErrorFetchingContactsForOffer} from '@vexl-next/resources-utils/src/offers/utils/fetchContactsForOffer'
import {type SymmetricKeyGenerationError} from '@vexl-next/resources-utils/src/offers/utils/generateSymmetricKey'
import {Array, Effect, Option, Record, pipe} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import getCountryPrefix from '../../../utils/getCountryCode'
import reportError from '../../../utils/reportError'
import {clubsToKeyHolderAtom} from '../../clubs/atom/clubsToKeyHolderAtom'
import {upsertOfferToConnectionsActionAtom} from '../../connections/atom/offerToConnectionsAtom'
import {ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom} from '../../contacts/atom/ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom'
import {type NoVexlSecretError} from '../../notifications/actions/NoVexlSecretError'
import {generateVexlTokenActionAtom} from '../../notifications/actions/generateVexlTokenActionAtom'
import {sessionDataOrDummyAtom} from '../../session'
import {offersAtom} from './offersState'

export const createOfferActionAtom = atom<
  null,
  [
    {
      payloadPublic: OfferPublicPart
      intendedConnectionLevel: IntendedConnectionLevel
      intendedClubs: ClubUuid[]
      onProgress?: (status: OfferEncryptionProgress) => void
      offerKey: PrivateKeyHolder
      offerId: OfferId
    },
  ],
  Effect.Effect<
    OneOfferInState,
    | ApiErrorFetchingContactsForOffer
    | PrivatePayloadsConstructionError
    | ApiErrorWhileCreatingOffer
    | NoVexlSecretError
    | SymmetricKeyGenerationError
    | PublicPartEncryptionError
    | NonCompatibleOfferVersionError
    | DecryptingOfferError
    | ClubKeyNotFoundInInnerStateError
  >
>(null, (get, set, params) => {
  return Effect.gen(function* (_) {
    const api = get(apiAtom)
    const clubsInfo = get(clubsToKeyHolderAtom)
    const session = get(sessionDataOrDummyAtom)
    const {intendedClubs, payloadPublic, intendedConnectionLevel, onProgress} =
      params
    const intendedClubsRecord = pipe(
      intendedClubs ?? [],
      Array.filterMap((clubUuid) =>
        pipe(
          Record.get(clubsInfo, clubUuid),
          Option.map((club) => [clubUuid, club] as const)
        )
      ),
      Record.fromEntries
    )

    const vexlNotificationToken = yield* _(
      set(generateVexlTokenActionAtom, {keyHolder: params.offerKey})
    )

    const publicPayloadWithNotificationToken = {
      ...payloadPublic,
      // backward compatibility #2124 remove once all clients are updated
      fcmCypher: vexlNotificationToken,
      vexlNotificationToken,
    }

    const serverToClientHashesToHashedPhoneNumbersMap = yield* _(
      set(ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom)
    )

    const createOfferResult = yield* _(
      createNewOfferForMyContacts({
        offerApi: api.offer,
        offerId: params.offerId,
        publicPart: publicPayloadWithNotificationToken,
        countryPrefix: getCountryPrefix(session.phoneNumber),
        serverToClientHashesToHashedPhoneNumbersMap,
        contactApi: api.contact,
        intendedConnectionLevel,
        ownerKeyPair: session.privateKey,
        intendedClubs: intendedClubsRecord,
        onProgress,
      })
    )

    if (createOfferResult.encryptionErrors.length > 0) {
      reportError('error', new Error('Error while encrypting offer'), {
        errors: createOfferResult.encryptionErrors,
      })
    }

    const createdOffer: MyOfferInState = {
      ownershipInfo: {
        adminId: createOfferResult.adminId,
        intendedConnectionLevel,
        intendedClubs,
      },
      flags: {
        reported: false,
      },
      offerInfo: createOfferResult.offerInfo,
    }

    set(offersAtom, (oldState) => [...oldState, createdOffer])

    set(upsertOfferToConnectionsActionAtom, {
      connections: {
        firstLevel: createOfferResult.encryptedFor.firstDegreeConnections,
        secondLevel:
          intendedConnectionLevel === 'ALL'
            ? createOfferResult.encryptedFor.secondDegreeConnections
            : [],
        clubs: createOfferResult.encryptedFor.clubsConnections,
      },
      adminId: createOfferResult.adminId,
      symmetricKey: createOfferResult.symmetricKey,
    })

    return createdOffer
  })
})
