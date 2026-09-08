import {
  type KeyPairV2,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  generateNoteAdminId,
  newNoteId,
  type NoteAdminId,
  type NoteId,
  type NoteInfo,
  type NotePublicPart,
} from '@vexl-next/domain/src/general/notes'
import {type SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {type ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, pipe, type HashMap} from 'effect'
import {type OfferEncryptionProgress} from '../offers/OfferEncryptionProgress'
import fetchContactsForOffer, {
  type ApiErrorFetchingContactsForOffer,
  type ConnectionsInfoForOffer,
} from '../offers/utils/fetchContactsForOffer'
import generateSymmetricKey, {
  type SymmetricKeyGenerationError,
} from '../offers/utils/generateSymmetricKey'
import decryptNote, {
  type DecryptingNoteError,
  type NonCompatibleNoteVersionError,
} from './decryptNote'
import constructNotePrivatePayloads, {
  type NotePrivatePayloadsConstructionError,
} from './utils/constructNotePrivatePayloads'
import {
  encryptNotePrivatePart,
  type NotePrivatePartEncryptionError,
} from './utils/encryptNotePrivatePart'
import encryptNotePublicPayload, {
  type NotePublicPartEncryptionError,
} from './utils/encryptNotePublicPayload'
import {sendNoteToNetworkBatchPrivateParts} from './utils/sendNoteToNetworkBatchPrivateParts'

export type ApiErrorWhileCreatingNote = Effect.Error<
  ReturnType<OfferApi['createNewNote']>
>

export interface CreateNoteResult {
  encryptionErrors: NotePrivatePartEncryptionError[]
  adminId: NoteAdminId
  symmetricKey: SymmetricKey
  noteInfo: NoteInfo
  encryptedFor: ConnectionsInfoForOffer
}

export default function createNewNoteForMyContacts({
  offerApi,
  contactApi,
  publicPart,
  ownerKeyPair,
  ownerKeyPairV2,
  expiresAt,
  serverToClientHashesToHashedPhoneNumbersMap,
  noteId: existingNoteId,
  adminId: existingAdminId,
  onProgress,
}: {
  offerApi: OfferApi
  contactApi: ContactApi
  publicPart: NotePublicPart
  ownerKeyPair: PrivateKeyHolder
  ownerKeyPairV2: KeyPairV2
  expiresAt: UnixMilliseconds
  serverToClientHashesToHashedPhoneNumbersMap: HashMap.HashMap<
    ServerToClientHashedNumber,
    HashedPhoneNumber
  >
  noteId?: NoteId
  adminId?: NoteAdminId
  onProgress?: (status: OfferEncryptionProgress) => void
}): Effect.Effect<
  CreateNoteResult,
  | ApiErrorFetchingContactsForOffer
  | NotePrivatePayloadsConstructionError
  | ApiErrorWhileCreatingNote
  | SymmetricKeyGenerationError
  | NotePublicPartEncryptionError
  | NotePrivatePartEncryptionError
  | DecryptingNoteError
  | NonCompatibleNoteVersionError
> {
  return Effect.gen(function* () {
    const noteId = existingNoteId ?? newNoteId()
    const adminId = existingAdminId ?? generateNoteAdminId()
    const symmetricKey = yield* generateSymmetricKey()

    if (onProgress) onProgress({type: 'CONSTRUCTING_PUBLIC_PAYLOAD'})
    const encryptedPublic = yield* encryptNotePublicPayload({
      notePublicPart: publicPart,
      symmetricKey,
    })

    if (onProgress) onProgress({type: 'FETCHING_CONTACTS'})
    const connectionsInfo = yield* fetchContactsForOffer({
      contactApi,
      intendedConnectionLevel: 'ALL',
      intendedClubs: {},
      serverToClientHashesToHashedPhoneNumbersMap,
    })

    if (onProgress) onProgress({type: 'CONSTRUCTING_PRIVATE_PAYLOADS'})
    const privatePayloads = yield* constructNotePrivatePayloads({
      connectionsInfo,
      symmetricKey,
    })

    // Owner's own private part carries the adminId (delete capability).
    const ownerPrivatePayload = yield* encryptNotePrivatePart({
      toPublicKey: ownerKeyPairV2.publicKey,
      payloadPrivate: {
        commonFriends: [],
        friendLevel: [],
        symmetricKey,
        viaRepost: false,
        adminId,
      },
    })

    const encryptionResult = yield* pipe(
      privatePayloads,
      Array.map((one, i) =>
        pipe(
          Effect.sync(() => {
            if (onProgress)
              onProgress({
                type: 'ENCRYPTING_PRIVATE_PAYLOADS',
                currentlyProcessingIndex: i,
                totalToEncrypt: privatePayloads.length,
              })
          }),
          Effect.andThen(Effect.result(encryptNotePrivatePart(one)))
        )
      ),
      Effect.all
    )

    const encryptionErrors = pipe(encryptionResult, Array.getFailures)

    const notePrivateList = pipe(
      encryptionResult,
      Array.getSuccesses,
      Array.dedupeWith((one, two) => one.userPublicKey === two.userPublicKey),
      Array.filter(
        (one) =>
          one.userPublicKey !== ownerKeyPair.publicKeyPemBase64 &&
          one.userPublicKey !== ownerKeyPairV2.publicKey
      )
    )

    if (onProgress) onProgress({type: 'SENDING_OFFER_TO_NETWORK'})
    const createResponse = yield* sendNoteToNetworkBatchPrivateParts({
      offerApi,
      noteData: {
        ownerPrivatePayload,
        notePrivateList,
        payloadPublic: encryptedPublic,
        adminId,
        noteId,
        expiresAt,
      },
    })

    const noteInfo = yield* decryptNote(
      ownerKeyPair,
      ownerKeyPairV2
    )(createResponse)

    if (onProgress) onProgress({type: 'DONE'})

    return {
      adminId,
      symmetricKey,
      noteInfo,
      encryptionErrors,
      encryptedFor: connectionsInfo,
    } satisfies CreateNoteResult
  })
}
