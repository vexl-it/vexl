import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type NoteId,
  type NoteRepostId,
} from '@vexl-next/domain/src/general/notes'
import {type SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerNotePrivatePart} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {Array, Effect, Either, pipe} from 'effect'
import {type OfferEncryptionProgress} from '../offers/OfferEncryptionProgress'
import {PRIVATE_PARTS_BATCH_SIZE} from '../offers/privatePartsUploadBatchSize'
import {TimeLimitReachedError} from '../offers/updatePrivateParts'
import reportErrorFromResourcesUtils from '../reportErrorFromResourcesUtils'
import {deduplicate, subtractArrays} from '../utils/array'
import {createEncryptionYield} from '../utils/createEncryptionYield'
import {
  encryptNotePrivatePart,
  type NotePrivatePartEncryptionError,
  type NotePrivatePayloadToEncrypt,
} from './utils/encryptNotePrivatePart'

type CreateRepostNotePrivatePartError = Effect.Effect.Error<
  ReturnType<OfferApi['repostNote'] | OfferApi['createRepostNotePrivatePart']>
>

interface UploadRepostNotePrivatePartsBatchResult {
  succeeded: ServerNotePrivatePart[]
  failed: Array<{
    error: CreateRepostNotePrivatePartError
    privatePart: ServerNotePrivatePart
  }>
}

function uploadRepostNotePrivatePartsBatch({
  offerApi,
  repostId,
  noteId,
  privateParts,
}: {
  offerApi: OfferApi
  repostId: NoteRepostId
  noteId: NoteId
  privateParts: readonly ServerNotePrivatePart[]
}): Effect.Effect<UploadRepostNotePrivatePartsBatchResult> {
  const emptyResult: UploadRepostNotePrivatePartsBatchResult = {
    succeeded: [],
    failed: [],
  }

  return pipe(
    Array.chunksOf(privateParts, PRIVATE_PARTS_BATCH_SIZE),
    Array.map((oneChunk) =>
      offerApi
        .createRepostNotePrivatePart({
          repostId,
          notePrivateList: oneChunk,
        })
        .pipe(
          // An empty sharing path has no row left to locate the note.
          Effect.catchTag('NotFoundError', () =>
            offerApi.repostNote({repostId, noteId, notePrivateList: oneChunk})
          ),
          Effect.tapError((e) =>
            Effect.sync(() => {
              // The repost's note being gone (deleted / expired) is an
              // expected outcome, not an error worth reporting.
              if (e._tag === 'NotFoundError') return
              reportErrorFromResourcesUtils(
                'error',
                new Error(
                  'Error uploading repost note private parts from update'
                ),
                {errorTag: e._tag}
              )
            })
          ),
          Effect.either,
          Effect.map((result) => ({chunk: oneChunk, result}))
        )
    ),
    Effect.allWith({concurrency: 'unbounded'}),
    Effect.map(
      Array.reduce(
        emptyResult,
        (
          acc: UploadRepostNotePrivatePartsBatchResult,
          {chunk, result}
        ): UploadRepostNotePrivatePartsBatchResult => {
          if (Either.isLeft(result))
            return {
              ...acc,
              failed: [
                ...acc.failed,
                ...Array.map(chunk, (one) => ({
                  privatePart: one,
                  error: result.left,
                })),
              ],
            }
          return {
            ...acc,
            succeeded: [...acc.succeeded, ...chunk],
          }
        }
      )
    )
  )
}

export default function updateRepostNotePrivateParts({
  currentConnections,
  targetConnections,
  ownerPublicKeys,
  repostId,
  noteId,
  symmetricKey,
  stopProcessingAfter,
  api,
  onProgress,
}: {
  currentConnections: {
    readonly firstLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
    readonly secondLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
  }
  targetConnections: {
    readonly firstLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
    readonly secondLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
  }
  // The reposter never sends the note to themselves.
  ownerPublicKeys: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
  repostId: NoteRepostId
  noteId: NoteId
  symmetricKey: SymmetricKey
  stopProcessingAfter?: UnixMilliseconds
  api: OfferApi
  onProgress?: (status: OfferEncryptionProgress) => void
}): Effect.Effect<
  {
    updateSuccess: boolean
    encryptionErrors: NotePrivatePartEncryptionError[]
    timeLimitReachedErrors: TimeLimitReachedError[]
    removedConnections: Array<PublicKeyPemBase64 | PublicKeyV2>
    newConnections: {
      firstLevel: Array<PublicKeyPemBase64 | PublicKeyV2>
      secondLevel: Array<PublicKeyPemBase64 | PublicKeyV2>
    }
    // True when the server no longer knows the repost (note deleted or
    // expired). Callers should drop their local tracking record.
    repostNotFoundOnServer: boolean
  },
  Effect.Effect.Error<ReturnType<OfferApi['deleteRepostNotePrivatePart']>>
> {
  return Effect.gen(function* (_) {
    const removedConnections = subtractArrays(
      deduplicate([
        ...currentConnections.firstLevel,
        ...currentConnections.secondLevel,
      ]),
      deduplicate([
        ...targetConnections.firstLevel,
        ...targetConnections.secondLevel,
      ])
    )

    const newFirstLevelConnections = subtractArrays(
      subtractArrays(targetConnections.firstLevel, ownerPublicKeys),
      currentConnections.firstLevel
    )
    const newSecondLevelConnections = subtractArrays(
      subtractArrays(targetConnections.secondLevel, ownerPublicKeys),
      currentConnections.secondLevel
    )

    if (Array.isNonEmptyArray(removedConnections)) {
      yield* api.deleteRepostNotePrivatePart({
        repostId,
        publicKeys: removedConnections,
      })
    }

    if (onProgress) onProgress({type: 'CONSTRUCTING_PRIVATE_PAYLOADS'})

    // Repost private parts intentionally carry no common friends or concrete
    // friend level — the same shape repostNote uses when creating the repost.
    const privatePayloads = pipe(
      deduplicate([...newFirstLevelConnections, ...newSecondLevelConnections]),
      Array.map(
        (toPublicKey): NotePrivatePayloadToEncrypt => ({
          toPublicKey,
          payloadPrivate: {
            commonFriends: [],
            friendLevel: ['NOT_SPECIFIED'],
            symmetricKey,
            viaRepost: true,
          },
        })
      )
    )

    const yieldToUi = createEncryptionYield()
    const encryptionResult = yield* _(
      privatePayloads,
      Array.map((payload, i) =>
        pipe(
          Effect.succeed(payload),
          Effect.zipLeft(
            Effect.sync(() => {
              if (onProgress)
                onProgress({
                  type: 'ENCRYPTING_PRIVATE_PAYLOADS',
                  currentlyProcessingIndex: i,
                  totalToEncrypt: privatePayloads.length,
                })
            })
          ),
          Effect.zipLeft(yieldToUi),
          Effect.flatMap((payload) => {
            if (stopProcessingAfter && Date.now() >= stopProcessingAfter)
              return Effect.fail(
                new TimeLimitReachedError({
                  toPublicKey: payload.toPublicKey,
                  message: 'Time limit reached',
                  cause: new Error('Time limit reached'),
                })
              )

            return Effect.succeed(payload)
          }),
          Effect.flatMap(encryptNotePrivatePart),
          Effect.either
        )
      ),
      Effect.all,
      Effect.map((result) => ({
        timeLimitReachedErrors: Array.getLefts(result).filter(
          (left) => left._tag === 'TimeLimitReachedError'
        ),
        encryptionErrors: Array.getLefts(result).filter(
          (left) => left._tag === 'NotePrivatePartEncryptionError'
        ),
        privateParts: Array.getRights(result),
      }))
    )

    if (onProgress) onProgress({type: 'SENDING_OFFER_TO_NETWORK'})

    let uploadErrors: Array<{
      toPublicKey: PublicKeyPemBase64 | PublicKeyV2
      error: CreateRepostNotePrivatePartError
    }> = []
    if (encryptionResult.privateParts.length > 0) {
      uploadErrors = yield* _(
        uploadRepostNotePrivatePartsBatch({
          offerApi: api,
          repostId,
          noteId,
          privateParts: encryptionResult.privateParts,
        }),
        Effect.map((result) =>
          Array.map(result.failed, (one) => ({
            toPublicKey: one.privatePart.userPublicKey,
            error: one.error,
          }))
        )
      )
    }

    if (onProgress) onProgress({type: 'DONE'})

    const repostNotFoundOnServer = pipe(
      uploadErrors,
      Array.some((one) => one.error._tag === 'NotFoundError')
    )

    const pubKeysThatFailedEncryptTo = [
      ...encryptionResult.encryptionErrors,
      ...encryptionResult.timeLimitReachedErrors,
      ...uploadErrors,
    ].map((one) => one.toPublicKey)

    return {
      updateSuccess:
        !Array.isNonEmptyArray(encryptionResult.encryptionErrors) &&
        !Array.isNonEmptyArray(encryptionResult.timeLimitReachedErrors) &&
        !Array.isNonEmptyArray(uploadErrors),
      encryptionErrors: encryptionResult.encryptionErrors,
      timeLimitReachedErrors: encryptionResult.timeLimitReachedErrors,
      removedConnections: deduplicate(removedConnections),
      newConnections: {
        firstLevel: subtractArrays(
          newFirstLevelConnections,
          pubKeysThatFailedEncryptTo
        ),
        secondLevel: subtractArrays(
          newSecondLevelConnections,
          pubKeysThatFailedEncryptTo
        ),
      },
      repostNotFoundOnServer,
    }
  })
}
