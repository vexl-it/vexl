import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type FetchCommonConnectionsResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {type OfferPrivateApi} from '@vexl-next/rest-api/src/services/offer'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {deduplicate, subtractArrays} from '../utils/array'
import flattenTaskOfEithers from '../utils/flattenTaskOfEithers'
import constructPrivatePayloads, {
  type ErrorConstructingPrivatePayloads,
} from './utils/constructPrivatePayloads'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './utils/encryptPrivatePart'

export interface TimeLimitReachedError {
  readonly _tag: 'TimeLimitReachedError'
  readonly toPublicKey: PublicKeyPemBase64
}

export default function updatePrivateParts({
  currentConnections,
  targetConnections,
  commonFriends,
  adminId,
  symmetricKey,
  stopProcessingAfter,
  api,
}: {
  currentConnections: {
    readonly firstLevel: readonly PublicKeyPemBase64[]
    readonly secondLevel?: readonly PublicKeyPemBase64[]
  }
  targetConnections: {
    readonly firstLevel: readonly PublicKeyPemBase64[]
    readonly secondLevel: readonly PublicKeyPemBase64[]
  }
  commonFriends: FetchCommonConnectionsResponse
  adminId: OfferAdminId
  symmetricKey: SymmetricKey
  stopProcessingAfter?: UnixMilliseconds
  api: OfferPrivateApi
}): TE.TaskEither<
  | ErrorConstructingPrivatePayloads
  | ExtractLeftTE<ReturnType<OfferPrivateApi['createPrivatePart']>>
  | ExtractLeftTE<ReturnType<OfferPrivateApi['deletePrivatePart']>>,
  {
    encryptionErrors: PrivatePartEncryptionError[]
    timeLimitReachedErrors: TimeLimitReachedError[]
    removedConnections: PublicKeyPemBase64[]
    newConnections: {
      firstLevel: PublicKeyPemBase64[]
      secondLevel?: PublicKeyPemBase64[] | undefined
    }
  }
> {
  const removedConnections = subtractArrays(
    deduplicate([
      ...currentConnections.firstLevel,
      ...(currentConnections.secondLevel ?? []),
    ]),
    deduplicate([
      ...targetConnections.firstLevel,
      ...targetConnections.secondLevel,
    ])
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

  console.info(
    `Updating connections of one offer. Number of removedConnections: ${
      removedConnections.length
    }. Number of newFirstLevelConnections: ${
      newFirstLevelConnections.length
    }. Number of newSecondLevelConnections: ${
      newSecondLevelConnections?.length ?? 'undefined'
    }.`
  )

  return pipe(
    constructPrivatePayloads({
      connectionsInfo: {
        firstDegreeConnections: newFirstLevelConnections,
        secondDegreeConnections: newSecondLevelConnections ?? [],
        commonFriends,
      },
      symmetricKey,
    }),
    TE.fromEither,
    TE.chainTaskK(
      flow(
        A.map(
          flow(
            TE.right,
            TE.chainFirstEitherK((one) => {
              if (!stopProcessingAfter || Date.now() < stopProcessingAfter)
                return E.right('ok')
              return E.left({
                _tag: 'TimeLimitReachedError',
                toPublicKey: one.toPublicKey,
              } as const)
            }),
            TE.chainW(encryptPrivatePart)
          )
        ),
        A.sequence(T.ApplicativeSeq),
        flattenTaskOfEithers,
        T.map(({lefts, rights}) => ({
          timeLimitReachedErrors: lefts.filter(
            (one): one is TimeLimitReachedError =>
              one._tag === 'TimeLimitReachedError'
          ),
          encryptionErrors: lefts.filter(
            (one): one is PrivatePartEncryptionError =>
              one._tag === 'PrivatePartEncryptionError'
          ),
          privateParts: rights,
        }))
      )
    ),
    TE.chainFirstW(({privateParts}) => {
      return privateParts.length > 0
        ? api.createPrivatePart({
            adminId,
            offerPrivateList: privateParts,
          })
        : (TE.right('ok') as TE.TaskEither<never, any>)
    }),
    TE.chainFirstW(({privateParts}) => {
      return removedConnections.length > 0
        ? api.deletePrivatePart({
            adminIds: [adminId],
            publicKeys: removedConnections,
          })
        : (TE.right('ok') as TE.TaskEither<never, any>)
    }),
    TE.map(({encryptionErrors, timeLimitReachedErrors}) => {
      const pubKeysThatFailedEncryptTo = [
        ...encryptionErrors,
        ...timeLimitReachedErrors,
      ].map((one) => one.toPublicKey)

      return {
        encryptionErrors,
        timeLimitReachedErrors,
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
        },
      }
    })
  )
}
