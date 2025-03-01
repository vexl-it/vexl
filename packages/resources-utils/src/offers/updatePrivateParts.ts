import {
  type PublicKeyPemBase64,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type FetchCommonConnectionsResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Schema} from 'effect'
import {flow} from 'fp-ts/function'
import {deduplicate, subtractArrays} from '../utils/array'
import constructPrivatePayloads, {
  type PrivatePayloadsConstructionError,
} from './utils/constructPrivatePayloads'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './utils/encryptPrivatePart'
import {type ClubIdWithMembers} from './utils/fetchClubsInfoForOffer'

export class TimeLimitReachedError extends Schema.TaggedError<TimeLimitReachedError>(
  'TimeLimitReachedError'
)('TimeLimitReachedError', {
  cause: Schema.Unknown,
  message: Schema.String,
  toPublicKey: PublicKeyPemBase64E,
}) {}

export default function updatePrivateParts({
  currentConnections,
  targetConnections,
  commonFriends,
  adminId,
  symmetricKey,
  stopProcessingAfter,
  api,
  targetClubIdWithMembers,
}: {
  currentConnections: {
    readonly firstLevel: readonly PublicKeyPemBase64[]
    readonly secondLevel?: readonly PublicKeyPemBase64[]
    readonly clubs?: readonly PublicKeyPemBase64[]
  }
  targetConnections: {
    readonly firstLevel: readonly PublicKeyPemBase64[]
    readonly secondLevel: readonly PublicKeyPemBase64[]
  }
  commonFriends: FetchCommonConnectionsResponse
  adminId: OfferAdminId
  symmetricKey: SymmetricKey
  stopProcessingAfter?: UnixMilliseconds
  api: OfferApi
  targetClubIdWithMembers?: ClubIdWithMembers[]
}): Effect.Effect<
  {
    encryptionErrors: PrivatePartEncryptionError[]
    timeLimitReachedErrors: TimeLimitReachedError[]
    removedConnections: PublicKeyPemBase64[]
    newConnections: {
      firstLevel: PublicKeyPemBase64[]
      secondLevel?: PublicKeyPemBase64[] | undefined
      clubs?: PublicKeyPemBase64[]
    }
  },
  | PrivatePayloadsConstructionError
  | Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
  | Effect.Effect.Error<ReturnType<OfferApi['deletePrivatePart']>>
> {
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
  const targetClubsConnections = targetClubIdWithMembers?.flatMap(
    (club) => club.items
  )
  const removedClubsConnections = subtractArrays(
    currentConnections.clubs ?? [],
    targetClubsConnections ?? []
  )

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
  const newClubsConnectionsWithClubInfo = targetClubIdWithMembers?.map(
    (club) => ({
      clubUuid: club.clubUuid,
      items: subtractArrays(club.items, currentConnections.clubs ?? []),
    })
  )
  const newClubsConnections =
    newClubsConnectionsWithClubInfo?.flatMap((club) => club.items) ?? []

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
    }. Number of newClubsConnections: ${newClubsConnections.length}.`
  )

  return Effect.gen(function* (_) {
    const privatePayloads = yield* _(
      constructPrivatePayloads({
        connectionsInfo: {
          firstDegreeConnections: newFirstLevelConnections,
          secondDegreeConnections: newSecondLevelConnections ?? [],
          commonFriends,
        },
        clubIdWithMembers: newClubsConnectionsWithClubInfo ?? [],
        symmetricKey,
      })
    )

    const encryptionResult = yield* _(
      privatePayloads,
      Array.map(
        flow(
          Effect.succeed,
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
      ),
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

    if (encryptionResult.privateParts.length > 0) {
      yield* _(
        api.createPrivatePart({
          body: {
            adminId,
            offerPrivateList: encryptionResult.privateParts,
          },
        })
      )
    }

    if (removedConnections.length > 0) {
      yield* _(
        api.deletePrivatePart({
          body: {
            adminIds: [adminId],
            publicKeys: removedConnections,
          },
        })
      )
    }

    const pubKeysThatFailedEncryptTo = [
      ...encryptionResult.encryptionErrors,
      ...encryptionResult.timeLimitReachedErrors,
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
        clubs: subtractArrays(newClubsConnections, pubKeysThatFailedEncryptTo),
      },
    }
  })
}
