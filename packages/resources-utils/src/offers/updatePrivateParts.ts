import {
  type PublicKeyPemBase64,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type FetchCommonConnectionsResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Array, Effect, Either, pipe, Record, Schema} from 'effect'
import {type ReadonlyRecord} from 'effect/Record'
import reportErrorFromResourcesUtils from '../reportErrorFromResourcesUtils'
import {deduplicate, subtractArrays} from '../utils/array'
import {type OfferEncryptionProgress} from './OfferEncryptionProgress'
import {PRIVATE_PARTS_BATCH_SIZE} from './privatePartsUploadBatchSize'
import constructPrivatePayloads, {
  type PrivatePayloadsConstructionError,
} from './utils/constructPrivatePayloads'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './utils/encryptPrivatePart'

type ClubConnections = Record<ClubUuid, readonly PublicKeyPemBase64[]>

const calculateNewClubsConnections = ({
  currentConnections,
  targetConnections,
}: {
  currentConnections: ClubConnections
  targetConnections: ClubConnections
}): ClubConnections => {
  const allClubsUuids = Array.dedupe([
    ...Record.keys(currentConnections),
    ...Record.keys(targetConnections),
  ])

  return pipe(
    allClubsUuids,
    Array.map((clubUuid) => {
      const currentConnectionsForClub = currentConnections[clubUuid] ?? []
      const targetConnectionsForClub = targetConnections[clubUuid] ?? []

      return [
        clubUuid,
        subtractArrays(targetConnectionsForClub, currentConnectionsForClub),
      ] as const
    }),
    Record.fromEntries
  )
}

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
  toPublicKey: PublicKeyPemBase64E,
}) {}

function checkAndReportRemovingClubConnectionThatIsAlsoFromSocualNetwork({
  targetConnections,
  removedClubsConnections,
}: {
  targetConnections: {
    readonly firstLevel: readonly PublicKeyPemBase64[]
    readonly secondLevel: readonly PublicKeyPemBase64[]
  }
  readonly removedClubsConnections: readonly PublicKeyPemBase64[]
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
  commonFriends,
  adminId,
  symmetricKey,
  stopProcessingAfter,
  api,
  onProgress,
}: {
  currentConnections: {
    readonly firstLevel: readonly PublicKeyPemBase64[]
    readonly secondLevel: readonly PublicKeyPemBase64[]
    readonly clubs: Record<ClubUuid, readonly PublicKeyPemBase64[]>
  }
  targetConnections: {
    readonly firstLevel: readonly PublicKeyPemBase64[]
    readonly secondLevel: readonly PublicKeyPemBase64[]
    readonly clubs: Record<ClubUuid, readonly PublicKeyPemBase64[]>
  }
  commonFriends: FetchCommonConnectionsResponse
  adminId: OfferAdminId
  symmetricKey: SymmetricKey
  stopProcessingAfter?: UnixMilliseconds
  api: OfferApi
  onProgress?: (status: OfferEncryptionProgress) => void
}): Effect.Effect<
  {
    encryptionErrors: PrivatePartEncryptionError[]
    timeLimitReachedErrors: TimeLimitReachedError[]
    removedConnections: PublicKeyPemBase64[]
    newConnections: {
      firstLevel: PublicKeyPemBase64[]
      secondLevel: PublicKeyPemBase64[] | undefined
      clubs: Record<ClubUuid, readonly PublicKeyPemBase64[]>
    }
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

    const newFirstLevelConnections = subtractArrays(
      targetConnections.firstLevel,
      currentConnections.firstLevel
    )
    const newSecondLevelConnections = currentConnections.secondLevel
      ? subtractArrays(
          targetConnections.secondLevel,
          currentConnections.secondLevel
        )
      : undefined

    const newClubsConnections = calculateNewClubsConnections({
      currentConnections: currentConnections.clubs ?? {},
      targetConnections: targetConnections.clubs,
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
        newSecondLevelConnections?.length ?? 'undefined'
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
          firstDegreeConnections: newFirstLevelConnections,
          secondDegreeConnections: newSecondLevelConnections ?? [],
          commonFriends,
          clubsConnections: newClubsConnections,
        },
        symmetricKey,
      })
    )

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
      toPublicKey: PublicKeyPemBase64
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
      encryptionErrors: encryptionResult.encryptionErrors,
      timeLimitReachedErrors: encryptionResult.timeLimitReachedErrors,
      removedConnections: deduplicate(removedConnections),
      newConnections: {
        firstLevel: subtractArrays(
          newFirstLevelConnections,
          pubKeysThatFailedEncryptTo
        ),
        secondLevel: newSecondLevelConnections
          ? subtractArrays(
              newSecondLevelConnections,
              pubKeysThatFailedEncryptTo
            )
          : undefined,
        clubs: substractArrayFromAllValues(
          pubKeysThatFailedEncryptTo,
          newClubsConnections
        ),
      },
    }
  })
}
