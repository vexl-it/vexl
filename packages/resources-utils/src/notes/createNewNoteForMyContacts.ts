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
import {Array, Effect, Either, type HashMap, pipe} from 'effect'
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

export type ApiErrorWhileCreatingNote = Effect.Effect.Error<
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
  return Effect.gen(function* (_) {
    const noteId = existingNoteId ?? newNoteId()
    const adminId = existingAdminId ?? generateNoteAdminId()
    const symmetricKey = yield* _(generateSymmetricKey())

    const encryptedPublic = yield* _(
      encryptNotePublicPayload({notePublicPart: publicPart, symmetricKey})
    )

    const connectionsInfo = yield* _(
      fetchContactsForOffer({
        contactApi,
        intendedConnectionLevel: 'ALL',
        intendedClubs: {},
        serverToClientHashesToHashedPhoneNumbersMap,
      })
    )

    const privatePayloads = yield* _(
      constructNotePrivatePayloads({connectionsInfo, symmetricKey})
    )

    // Owner's own private part carries the adminId (delete capability).
    const ownerPrivatePayload = yield* _(
      encryptNotePrivatePart({
        toPublicKey: ownerKeyPairV2.publicKey,
        payloadPrivate: {
          commonFriends: [],
          friendLevel: [],
          symmetricKey,
          viaRepost: false,
          adminId,
        },
      })
    )

    const encryptionResult = yield* _(
      privatePayloads,
      Array.map((one) => Effect.either(encryptNotePrivatePart(one))),
      Effect.all
    )

    const encryptionErrors = pipe(
      encryptionResult,
      Array.filterMap(Either.getLeft)
    )

    const notePrivateList = pipe(
      encryptionResult,
      Array.filterMap(Either.getRight),
      Array.dedupeWith((one, two) => one.userPublicKey === two.userPublicKey),
      Array.filter(
        (one) =>
          one.userPublicKey !== ownerKeyPair.publicKeyPemBase64 &&
          one.userPublicKey !== ownerKeyPairV2.publicKey
      )
    )

    const createResponse = yield* _(
      sendNoteToNetworkBatchPrivateParts({
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
    )

    const noteInfo = yield* _(
      decryptNote(ownerKeyPair, ownerKeyPairV2)(createResponse)
    )

    return {
      adminId,
      symmetricKey,
      noteInfo,
      encryptionErrors,
      encryptedFor: connectionsInfo,
    } satisfies CreateNoteResult
  })
}
