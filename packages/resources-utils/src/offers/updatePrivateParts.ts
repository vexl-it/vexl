import {
  type PublicKeyPemBase64,
  PublicKeyPemBase64 as PublicKeyPemBase64Schema,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type PublicKeyV2 as PublicKeyV2Type} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type CommonConnectionsForUsers} from '@vexl-next/domain/src/general/contacts'
import {
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Array, Effect, Either, Option, pipe, Record, Schema} from 'effect'
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
import {type ContactWithV2Key} from './utils/fetchContactsForOffer'

type ClubConnections = Record<
  ClubUuid,
  ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2Type>
>

// Convert club connections (Union types) to ContactWithV2Key format for constructPrivatePayloads
const toContactsWithEmptyV2Keys = (
  clubConnections: ClubConnections
): Record<ClubUuid, readonly ContactWithV2Key[]> =>
  pipe(
    clubConnections,
    Record.map((keys) =>
      Array.map(keys, (key) => {
        // If it's a V2 key, store it and mark it in publicKeyV2
        if (key.startsWith('V2_PUB_')) {
          return {
            publicKey: key as PublicKeyV2Type,
            publicKeyV2: Option.some(key as PublicKeyV2Type),
          }
        }
        // Otherwise it's a V1 key
        return {
          publicKey: key as PublicKeyPemBase64,
          publicKeyV2: Option.none(),
        }
      })
    )
  )

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
  toPublicKey: Schema.Union(PublicKeyPemBase64Schema, PublicKeyV2),
}) {}

function checkAndReportRemovingClubConnectionThatIsAlsoFromSocualNetwork({
  targetConnections,
  removedClubsConnections,
}: {
  targetConnections: {
    readonly firstLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2Type>
    readonly secondLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2Type>
  }
  readonly removedClubsConnections: ReadonlyArray<
    PublicKeyPemBase64 | PublicKeyV2Type
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
  commonFriends,
  adminId,
  symmetricKey,
  stopProcessingAfter,
  api,
  onProgress,
}: {
  currentConnections: {
    readonly firstLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2Type>
    readonly secondLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2Type>
    readonly clubs: Record<
      ClubUuid,
      ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2Type>
    >
  }
  targetConnections: {
    readonly firstLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2Type>
    readonly secondLevel: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2Type>
    readonly clubs: Record<
      ClubUuid,
      ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2Type>
    >
  }
  commonFriends: CommonConnectionsForUsers
  adminId: OfferAdminId
  symmetricKey: SymmetricKey
  stopProcessingAfter?: UnixMilliseconds
  api: OfferApi
  onProgress?: (status: OfferEncryptionProgress) => void
}): Effect.Effect<
  {
    encryptionErrors: PrivatePartEncryptionError[]
    timeLimitReachedErrors: TimeLimitReachedError[]
    removedConnections: Array<PublicKeyPemBase64 | PublicKeyV2Type>
    newConnections: {
      firstLevel: Array<PublicKeyPemBase64 | PublicKeyV2Type>
      secondLevel: Array<PublicKeyPemBase64 | PublicKeyV2Type> | undefined
      clubs: Record<
        ClubUuid,
        ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2Type>
      >
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
          // Convert to ContactWithV2Key format (empty V2 keys since we don't have them for stored connections)
          clubsConnections: toContactsWithEmptyV2Keys(newClubsConnections),
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
      toPublicKey: PublicKeyPemBase64 | PublicKeyV2Type
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
      // Filter to V1 keys only - deletePrivatePart API doesn't support V2 keys yet
      const v1KeysToRemove = Array.filter(
        removedConnections,
        (key) => !key.startsWith('V2_PUB_')
      ) as PublicKeyPemBase64[]

      if (v1KeysToRemove.length > 0) {
        yield* _(
          api.deletePrivatePart({
            adminIds: [adminId],
            publicKeys: v1KeysToRemove,
          })
        )
      }
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
