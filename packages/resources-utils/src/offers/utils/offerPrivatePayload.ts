import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {
  type OfferPrivatePart,
  PrivatePayloadEncrypted,
  type SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {keys} from '../../utils/keys'
import * as E from 'fp-ts/Either'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'
import fetchContactsForOffer, {
  type ConnectionsInfoForOffer,
  type ApiErrorFetchingContactsForOffer,
} from './fetchContactsForOffer'
import {flow, pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {safeParse, stringifyToJson} from '../../utils/parsing'
import {eciesEncrypt} from '../../utils/crypto'
import {type ServerPrivatePart} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {type ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {type ContactPrivateApi} from '@vexl-next/rest-api/dist/services/contact'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import flattenTaskOfEithers from '../../utils/flattenTaskOfEithers'

export interface OfferPrivatePayloadToEncrypt {
  toPublicKey: PublicKeyPemBase64
  payloadPrivate: OfferPrivatePart
}

function privatePayloadForOwner({
  ownerCredentials,
  symmetricKey,
}: {
  ownerCredentials: PrivateKeyHolder
  symmetricKey: SymmetricKey
}): OfferPrivatePayloadToEncrypt {
  return {
    toPublicKey: ownerCredentials.publicKeyPemBase64,
    payloadPrivate: {
      commonFriends: [],
      friendLevel: ['NOT_SPECIFIED'],
      symmetricKey,
    },
  }
}

export type ErrorConstructingPrivatePayloads =
  BasicError<'ErrorConstructingPrivatePayloads'>
// TODO this function should be tested
function constructPrivatePayloads({
  connectionsInfo: {
    firstDegreeConnections,
    secondDegreeConnections,
    commonFriends,
  },
  symmetricKey,
}: {
  connectionsInfo: ConnectionsInfoForOffer
  symmetricKey: SymmetricKey
}): E.Either<ErrorConstructingPrivatePayloads, OfferPrivatePayloadToEncrypt[]> {
  return E.tryCatch(() => {
    // First we need to find out friend levels for each connection.
    // We can do that by iterating over firstDegreeFriends and secondDegreeFriends
    const friendLevel: Record<
      PublicKeyPemBase64,
      Set<'FIRST_DEGREE' | 'SECOND_DEGREE'>
    > = {}
    for (const firstDegreeFriendPublicKey of firstDegreeConnections) {
      friendLevel[firstDegreeFriendPublicKey] = new Set(['FIRST_DEGREE'])
    }

    // There are duplicities. That is why all these shinanigans with Set
    for (const secondDegreeFriendPublicKey of secondDegreeConnections) {
      if (!friendLevel[secondDegreeFriendPublicKey])
        friendLevel[secondDegreeFriendPublicKey] = new Set(['SECOND_DEGREE'])
      else friendLevel[secondDegreeFriendPublicKey].add('SECOND_DEGREE')
    }

    return keys(friendLevel).map((key) => ({
      toPublicKey: key,
      payloadPrivate: {
        commonFriends:
          commonFriends.commonContacts.find((one) => one.publicKey === key)
            ?.common?.hashes ?? [],
        friendLevel: friendLevel[key] ? Array.from(friendLevel[key]) : [],
        symmetricKey,
      },
    }))
  }, toError('ErrorConstructingPrivatePayloads', 'Failed to construct private parts'))
}

export type PrivatePartEncryptionError =
  BasicError<'PrivatePartEncryptionError'>

export function encryptPrivatePart(
  privatePart: OfferPrivatePayloadToEncrypt
): TE.TaskEither<PrivatePartEncryptionError, ServerPrivatePart> {
  return pipe(
    TE.Do,
    TE.chainW(() => TE.fromEither(stringifyToJson(privatePart.payloadPrivate))),
    TE.chainW(
      flow(
        eciesEncrypt(privatePart.toPublicKey),
        TE.map((json) => `0${json}`),
        TE.chainEitherKW(safeParse(PrivatePayloadEncrypted))
      )
    ),
    TE.map((encrypted) => ({
      userPublicKey: privatePart.toPublicKey,
      payloadPrivate: encrypted,
    })),
    TE.mapLeft(toError('PrivatePartEncryptionError'))
  )
}

export function fetchInfoAndGeneratePrivatePayloads({
  contactApi,
  connectionLevel,
  symmetricKey,
  ownerCredentials,
}: {
  contactApi: ContactPrivateApi
  connectionLevel: ConnectionLevel
  symmetricKey: SymmetricKey
  ownerCredentials: PrivateKeyHolder
}): TE.TaskEither<
  ApiErrorFetchingContactsForOffer | ErrorConstructingPrivatePayloads,
  {errors: PrivatePartEncryptionError[]; privateParts: ServerPrivatePart[]}
> {
  return pipe(
    fetchContactsForOffer({contactApi, connectionLevel}),
    TE.chainW((connectionsInfo) =>
      TE.fromEither(constructPrivatePayloads({connectionsInfo, symmetricKey}))
    ),
    TE.map((privatePayloads) => [
      ...privatePayloads,
      privatePayloadForOwner({ownerCredentials, symmetricKey}),
    ]),
    TE.chainTaskK(
      flow(
        A.map(encryptPrivatePart),
        A.sequence(T.ApplicativePar),
        flattenTaskOfEithers,
        T.map(({lefts, rights}) => ({errors: lefts, privateParts: rights}))
      )
    )
  )
}
