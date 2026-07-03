import {
  type KeyPairV2,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  generateNoteRepostId,
  type NoteId,
  type NoteRepostInfo,
} from '@vexl-next/domain/src/general/notes'
import {type SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {type ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerNotePrivatePart} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {Array, Effect, Either, type HashMap, pipe, Schema} from 'effect'
import {PRIVATE_PARTS_BATCH_SIZE} from '../offers/privatePartsUploadBatchSize'
import fetchContactsForOffer, {
  type ApiErrorFetchingContactsForOffer,
} from '../offers/utils/fetchContactsForOffer'
import {
  encryptNotePrivatePart,
  type NotePrivatePartEncryptionError,
} from './utils/encryptNotePrivatePart'

export type ApiErrorWhileRepostingNote = Effect.Effect.Error<
  ReturnType<OfferApi['repostNote']>
>

export interface RepostNoteResult {
  repostInfo: NoteRepostInfo
  encryptionErrors: NotePrivatePartEncryptionError[]
}

export default function repostNote({
  offerApi,
  contactApi,
  noteId,
  symmetricKey,
  ownerKeyPair,
  ownerKeyPairV2,
  serverToClientHashesToHashedPhoneNumbersMap,
}: {
  offerApi: OfferApi
  contactApi: ContactApi
  noteId: NoteId
  symmetricKey: SymmetricKey
  ownerKeyPair: PrivateKeyHolder
  ownerKeyPairV2: KeyPairV2
  serverToClientHashesToHashedPhoneNumbersMap: HashMap.HashMap<
    ServerToClientHashedNumber,
    HashedPhoneNumber
  >
}): Effect.Effect<
  RepostNoteResult,
  | ApiErrorFetchingContactsForOffer
  | ApiErrorWhileRepostingNote
  | NotePrivatePartEncryptionError
> {
  return Effect.gen(function* (_) {
    const repostId = generateNoteRepostId()

    const connectionsInfo = yield* _(
      fetchContactsForOffer({
        contactApi,
        intendedConnectionLevel: 'ALL',
        intendedClubs: {},
        serverToClientHashesToHashedPhoneNumbersMap,
      })
    )

    const recipients = pipe(
      [
        ...connectionsInfo.firstDegreeConnections,
        ...connectionsInfo.secondDegreeConnections,
      ],
      Array.dedupe,
      // Reposter never sends the note to themselves.
      Array.filter(
        (publicKey) =>
          publicKey !== ownerKeyPair.publicKeyPemBase64 &&
          publicKey !== ownerKeyPairV2.publicKey
      )
    )

    const encryptionResult = yield* _(
      recipients,
      Array.map((toPublicKey) =>
        Effect.either(
          encryptNotePrivatePart({
            toPublicKey,
            payloadPrivate: {
              commonFriends: [],
              friendLevel: ['NOT_SPECIFIED'],
              symmetricKey,
              viaRepost: true,
            },
          })
        )
      ),
      Effect.all
    )

    const encryptionErrors = pipe(
      encryptionResult,
      Array.filterMap(Either.getLeft)
    )

    const notePrivateList: readonly ServerNotePrivatePart[] = pipe(
      encryptionResult,
      Array.filterMap(Either.getRight),
      Array.dedupeWith((one, two) => one.userPublicKey === two.userPublicKey)
    )

    yield* _(
      Array.chunksOf(notePrivateList, PRIVATE_PARTS_BATCH_SIZE),
      Array.map((batch) =>
        offerApi.repostNote({noteId, repostId, notePrivateList: batch})
      ),
      Effect.all,
      // Roll back already uploaded batches so a partial repost does not stay
      // on the server with a repostId the client is about to discard.
      Effect.tapError(() =>
        offerApi
          .undoRepostNote({repostIds: [repostId]})
          .pipe(Effect.ignoreLogged)
      )
    )

    return {
      repostInfo: {
        repostId,
        repostedAt: Schema.decodeSync(UnixMilliseconds)(Date.now()),
      },
      encryptionErrors,
    } satisfies RepostNoteResult
  })
}
