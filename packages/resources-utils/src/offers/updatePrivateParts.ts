import {
  PublicKeyPemBase64 as PublicKeyPemBase64Schema,
  PublicKeyV2,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type CommonConnectionsForUsers} from '@vexl-next/domain/src/general/contacts'
import {
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Array, Effect, Either, pipe, Record, Schema} from 'effect'
import {type ReadonlyRecord} from 'effect/Record'
import reportErrorFromResourcesUtils from '../reportErrorFromResourcesUtils'
import {deduplicate, subtractArrays} from '../utils/array'
import {createEncryptionYield} from '../utils/createEncryptionYield'
import {type OfferEncryptionProgress} from './OfferEncryptionProgress'
import {
  planPrivatePartsUpdate,
  type OfferConnections,
} from './planPrivatePartsUpdate'
import {PRIVATE_PARTS_BATCH_SIZE} from './privatePartsUploadBatchSize'
import constructPrivatePayloads, {
  type PrivatePayloadsConstructionError,
} from './utils/constructPrivatePayloads'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './utils/encryptPrivatePart'

const substractArrayFromAllValues = <K extends string, V>(
  values: V[],
  record: Record<K, readonly V[]>
): Record<ReadonlyRecord.NonLiteralKey<K>, readonly V[]> => {
  return pipe(
    record,
    Record.toEntries,
    Array.map(
      ([key, value]) => [key, subtractArrays(value, values)] as [K, V[]]
    ),
    (a) => a,
    Record.fromEntries
  )
}

export class TimeLimitReachedError extends Schema.TaggedError<TimeLimitReachedError>(
  'TimeLimitReachedError'
)('TimeLimitReachedError', {
  cause: Schema.Unknown,
  message: Schema.String,
  toPublicKey: Schema.Union(PublicKeyPemBase64Schema, PublicKeyV2),
}) {}

function checkAndReportRemovingClubConnectionThatIsAlsoFromSocualNetwork({
  targetConnections,
  removedClubsConnections,
}: {
  targetConnections: {
    readonly firstLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
    readonly secondLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
  }
  readonly removedClubsConnections: ReadonlyArray<
    PublicKeyPemBase64 | PublicKeyV2
  >
}): void {
  const offerMeantForKeys = pipe(
    [targetConnections.firstLevel, targetConnections.secondLevel],
    Array.flatten
  )

  const commonElements = Array.intersection(
    offerMeantForKeys,
    removedClubsConnections
  )

  if (commonElements.length > 0) {
    reportErrorFromResourcesUtils(
      'error',
      new Error(
        '!!!! Removing club connection that is also from social network !!!'
      ),
      {
        commonElements,
      }
    )
  }
}

interface UploadPrivatePartsBatchResult {
  succeeded: ServerPrivatePart[]
  failed: Array<{
    error: Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
    privatePart: ServerPrivatePart
  }>
}
function uploadPrivatePartsBatch({
  offerApi,
  adminId,
  privateParts,
}: {
  offerApi: OfferApi
  adminId: OfferAdminId
  privateParts: readonly ServerPrivatePart[]
}): Effect.Effect<UploadPrivatePartsBatchResult> {
  return pipe(
    Array.chunksOf(privateParts, PRIVATE_PARTS_BATCH_SIZE),
    Array.map((oneChunk) =>
      offerApi
        .createPrivatePart({
          adminId,
          offerPrivateList: oneChunk,
        })
        .pipe(
          Effect.either,
          Effect.tapError((e) =>
            Effect.sync(() => {
              console.warn('Error uploading private parts from update')
              reportErrorFromResourcesUtils(
                'error',
                new Error('Error uploading private parts from update'),
                {e}
              )
            })
          ),
          Effect.map((result) => ({chunk: oneChunk, result}))
        )
    ),
    Effect.allWith({concurrency: 'unbounded'}),
    Effect.map(
      Array.reduce(
        {
          succeeded: [],
          failed: [],
        } as UploadPrivatePartsBatchResult,
        (acc, {chunk, result}) => {
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

export default function updatePrivateParts({
  currentConnections,
  targetConnections,
  connectionsToRefresh = [],
  commonFriends,
  verifiedFriends,
  adminId,
  symmetricKey,
  stopProcessingAfter,
  api,
  onProgress,
}: {
  currentConnections: OfferConnections
  targetConnections: OfferConnections
  connectionsToRefresh?: readonly PublicKeyV2[]
  commonFriends: CommonConnectionsForUsers
  verifiedFriends: CommonConnectionsForUsers
  adminId: OfferAdminId
  symmetricKey: SymmetricKey
  stopProcessingAfter?: UnixMilliseconds
  api: OfferApi
  onProgress?: (status: OfferEncryptionProgress) => void
}): Effect.Effect<
  {
    updateSuccess: boolean
    encryptionErrors: PrivatePartEncryptionError[]
    timeLimitReachedErrors: TimeLimitReachedError[]
    removedConnections: Array<PublicKeyPemBase64 | PublicKeyV2>
    newConnections: OfferConnections
  },
  | PrivatePayloadsConstructionError
  | Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
  | Effect.Effect.Error<ReturnType<OfferApi['deletePrivatePart']>>
> {
  return Effect.gen(function* (_) {
    const removedFirstSecondLevelConnections = subtractArrays(
      deduplicate([
        ...currentConnections.firstLevel,
        ...(currentConnections.secondLevel ?? []),
      ]),
      deduplicate([
        ...targetConnections.firstLevel,
        ...targetConnections.secondLevel,
      ])
    )

    const allTargetClubConnections = pipe(
      targetConnections.clubs,
      Record.values,
      Array.flatten
    )

    const allCurrentClubConnections = pipe(
      currentConnections.clubs ?? {},
      Record.values,
      Array.flatten
    )

    const removedClubsConnections = subtractArrays(
      allCurrentClubConnections,
      allTargetClubConnections
    )

    checkAndReportRemovingClubConnectionThatIsAlsoFromSocualNetwork({
      targetConnections: {
        firstLevel: targetConnections.firstLevel,
        secondLevel: targetConnections.secondLevel,
      },
      removedClubsConnections,
    })

    const {
      newConnections: {
        firstLevel: newFirstLevelConnections,
        secondLevel: newSecondLevelConnections,
        clubs: newClubsConnections,
      },
      encryptionCandidates,
    } = planPrivatePartsUpdate({
      currentConnections,
      targetConnections,
      connectionsToRefresh,
    })

    const removedConnections = [
      ...removedFirstSecondLevelConnections,
      ...removedClubsConnections,
    ]

    console.info(
      `Updating connections of one offer. Number of removedConnections: ${
        removedFirstSecondLevelConnections.length
      }. Number of removed clubs connections: ${
        removedClubsConnections.length
      }. Number of newFirstLevelConnections: ${
        newFirstLevelConnections.length
      }. Number of newSecondLevelConnections: ${
        newSecondLevelConnections.length
      }. Number of newClubsConnections: ${pipe(
        newClubsConnections,
        Record.toEntries,
        Array.map(([uuid, keys]) => `${uuid}: ${keys.length}`),
        Array.join(', ')
      )}.`
    )

    if (onProgress) onProgress({type: 'CONSTRUCTING_PRIVATE_PAYLOADS'})

    const privatePayloads = yield* _(
      constructPrivatePayloads({
        connectionsInfo: {
          firstDegreeConnections: Array.filter(
            targetConnections.firstLevel,
            (key) => encryptionCandidates.has(key)
          ),
          secondDegreeConnections: Array.filter(
            targetConnections.secondLevel,
            (key) => encryptionCandidates.has(key)
          ),
          commonFriends,
          verifiedFriends,
          clubsConnections: Record.map(
            targetConnections.clubs,
            Array.filter((key) => encryptionCandidates.has(key))
          ),
        },
        symmetricKey,
      })
    )

    const yieldToUi = createEncryptionYield()
    const encryptionResult = yield* _(
      privatePayloads,
      Array.map((payload, i) => {
        return pipe(
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
          Effect.flatMap(encryptPrivatePart),
          Effect.either
        )
      }),
      Effect.all,
      Effect.map((result) => ({
        timeLimitReachedErrors: Array.getLefts(result).filter(
          (left) => left._tag === 'TimeLimitReachedError'
        ),
        encryptionErrors: Array.getLefts(result).filter(
          (left) => left._tag === 'PrivatePartEncryptionError'
        ),
        privateParts: Array.getRights(result),
      }))
    )

    if (onProgress) onProgress({type: 'SENDING_OFFER_TO_NETWORK'})
    let uploadErrors: Array<{
      toPublicKey: PublicKeyPemBase64 | PublicKeyV2
      error: Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
    }> = []
    if (encryptionResult.privateParts.length > 0) {
      uploadErrors = yield* _(
        uploadPrivatePartsBatch({
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
        api.deletePrivatePart({
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
      updateSuccess:
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
        clubs: substractArrayFromAllValues(
          pubKeysThatFailedEncryptTo,
          newClubsConnections
        ),
      },
    }
  })
}
