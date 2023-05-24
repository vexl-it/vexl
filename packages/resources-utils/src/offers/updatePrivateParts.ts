import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {type SymmetricKey} from '@vexl-next/domain/dist/general/offers'
import {flow, pipe} from 'fp-ts/function'
import constructPrivatePayloads, {
  type ErrorConstructingPrivatePayloads,
} from './utils/constructPrivatePayloads'
import {type FetchCommonConnectionsResponse} from '@vexl-next/rest-api/dist/services/contact/contracts'
import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './utils/offerPrivatePayload'
import flattenTaskOfEithers from '../utils/flattenTaskOfEithers'
import {type OfferPrivateApi} from '@vexl-next/rest-api/dist/services/offer'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {deduplicate, subtractArrays} from '../utils/array'

export default function updatePrivateParts({
  currentConnections,
  targetConnections,
  commonFriends,
  adminId,
  symmetricKey,
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
  api: OfferPrivateApi
}): TE.TaskEither<
  | ErrorConstructingPrivatePayloads
  | ExtractLeftTE<ReturnType<OfferPrivateApi['createPrivatePart']>>
  | ExtractLeftTE<ReturnType<OfferPrivateApi['deletePrivatePart']>>,
  {
    encryptionErrors: PrivatePartEncryptionError[]
    newConnections: {
      firstLevel: PublicKeyPemBase64[]
      secondLevel?: PublicKeyPemBase64[]
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
        A.map(encryptPrivatePart),
        A.sequence(T.ApplicativePar),
        flattenTaskOfEithers,
        T.map(({lefts, rights}) => ({
          encryptionErrors: lefts,
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
    TE.map(({encryptionErrors}) => {
      const pubKeysThatFailedEncryptTo = encryptionErrors.map(
        (one) => one.toPublicKey
      )

      return {
        encryptionErrors,
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
