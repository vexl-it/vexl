import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type CommonConnectionsForUsers} from '@vexl-next/domain/src/general/contacts'
import {type NoteAdminId} from '@vexl-next/domain/src/general/notes'
import {type SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerNotePrivatePart} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {Array, Effect, Either, HashMap, pipe} from 'effect'
import {type OfferEncryptionProgress} from '../offers/OfferEncryptionProgress'
import {PRIVATE_PARTS_BATCH_SIZE} from '../offers/privatePartsUploadBatchSize'
import {TimeLimitReachedError} from '../offers/updatePrivateParts'
import reportErrorFromResourcesUtils from '../reportErrorFromResourcesUtils'
import {deduplicate, subtractArrays} from '../utils/array'
import constructNotePrivatePayloads, {
  type NotePrivatePayloadsConstructionError,
} from './utils/constructNotePrivatePayloads'
import {
  encryptNotePrivatePart,
  type NotePrivatePartEncryptionError,
} from './utils/encryptNotePrivatePart'

interface UploadNotePrivatePartsBatchResult {
  succeeded: ServerNotePrivatePart[]
  failed: Array<{
    error: Effect.Effect.Error<ReturnType<OfferApi['createNotePrivatePart']>>
    privatePart: ServerNotePrivatePart
  }>
}

function uploadNotePrivatePartsBatch({
  offerApi,
  adminId,
  privateParts,
}: {
  offerApi: OfferApi
  adminId: NoteAdminId
  privateParts: readonly ServerNotePrivatePart[]
}): Effect.Effect<UploadNotePrivatePartsBatchResult> {
  const emptyResult: UploadNotePrivatePartsBatchResult = {
    succeeded: [],
    failed: [],
  }

  return pipe(
    Array.chunksOf(privateParts, PRIVATE_PARTS_BATCH_SIZE),
    Array.map((oneChunk) =>
      offerApi
        .createNotePrivatePart({
          adminId,
          notePrivateList: oneChunk,
        })
        .pipe(
          Effect.tapError((e) =>
            Effect.sync(() => {
              reportErrorFromResourcesUtils(
                'error',
                new Error('Error uploading note private parts from update'),
                {e}
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
          acc: UploadNotePrivatePartsBatchResult,
          {chunk, result}
        ): UploadNotePrivatePartsBatchResult => {
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

/**
 * Uploads note private parts for connections that are missing them (e.g. newly
 * imported contacts) and deletes the private parts of removed connections so
 * they lose access to the note — mirroring how offer private parts are updated.
 */
export default function updateNotePrivateParts({
  currentConnections,
  targetConnections,
  commonFriends,
  ownerPublicKeys,
  adminId,
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
  commonFriends: CommonConnectionsForUsers
  // The owner's own private part carries the adminId and must never be
  // overshadowed by a regular one, so the owner keys are excluded here.
  ownerPublicKeys: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
  adminId: NoteAdminId
  symmetricKey: SymmetricKey
  stopProcessingAfter?: UnixMilliseconds
  api: OfferApi
  onProgress?: (status: OfferEncryptionProgress) => void
}): Effect.Effect<
  {
    encryptionErrors: NotePrivatePartEncryptionError[]
    timeLimitReachedErrors: TimeLimitReachedError[]
    removedConnections: Array<PublicKeyPemBase64 | PublicKeyV2>
    newConnections: {
      firstLevel: Array<PublicKeyPemBase64 | PublicKeyV2>
      secondLevel: Array<PublicKeyPemBase64 | PublicKeyV2>
    }
  },
  | NotePrivatePayloadsConstructionError
  | Effect.Effect.Error<ReturnType<OfferApi['deleteNotePrivatePart']>>
> {
  return Effect.gen(function* (_) {
    // The owner keys are excluded defensively — the author's private part
    // carries the adminId and the server refuses to delete it.
    const removedConnections = subtractArrays(
      subtractArrays(
        deduplicate([
          ...currentConnections.firstLevel,
          ...currentConnections.secondLevel,
        ]),
        deduplicate([
          ...targetConnections.firstLevel,
          ...targetConnections.secondLevel,
        ])
      ),
      ownerPublicKeys
    )

    const newFirstLevelConnections = subtractArrays(
      subtractArrays(targetConnections.firstLevel, ownerPublicKeys),
      currentConnections.firstLevel
    )
    const newSecondLevelConnections = subtractArrays(
      subtractArrays(targetConnections.secondLevel, ownerPublicKeys),
      currentConnections.secondLevel
    )

    if (onProgress) onProgress({type: 'CONSTRUCTING_PRIVATE_PAYLOADS'})

    const privatePayloads = yield* _(
      constructNotePrivatePayloads({
        connectionsInfo: {
          firstDegreeConnections: newFirstLevelConnections,
          secondDegreeConnections: newSecondLevelConnections,
          commonFriends,
          verifiedFriends: HashMap.empty(),
          clubsConnections: {},
        },
        symmetricKey,
      })
    )

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
      error: Effect.Effect.Error<ReturnType<OfferApi['createNotePrivatePart']>>
    }> = []
    if (encryptionResult.privateParts.length > 0) {
      uploadErrors = yield* _(
        uploadNotePrivatePartsBatch({
          offerApi: api,
          adminId,
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

    if (removedConnections.length > 0) {
      yield* _(
        api.deleteNotePrivatePart({
          adminIds: [adminId],
          publicKeys: removedConnections,
        })
      )
    }

    if (onProgress) onProgress({type: 'DONE'})

    const pubKeysThatFailedEncryptTo = [
      ...encryptionResult.encryptionErrors,
      ...encryptionResult.timeLimitReachedErrors,
      ...uploadErrors,
    ].map((one) => one.toPublicKey)

    return {
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
    }
  })
}
