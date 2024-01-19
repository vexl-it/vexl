import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  PrivatePayloadEncrypted,
  type IntendedConnectionLevel,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type ContactPrivateApi} from '@vexl-next/rest-api/src/services/contact'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {eciesEncrypt} from '../../utils/crypto'
import flattenTaskOfEithers from '../../utils/flattenTaskOfEithers'
import {safeParse, stringifyToJson} from '../../utils/parsing'
import {type OfferEncryptionProgress} from '../OfferEncryptionProgress'
import constructPrivatePayloads, {
  type ErrorConstructingPrivatePayloads,
  type OfferPrivatePayloadToEncrypt,
} from './constructPrivatePayloads'
import fetchContactsForOffer, {
  type ApiErrorFetchingContactsForOffer,
  type ConnectionsInfoForOffer,
} from './fetchContactsForOffer'

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

export type PrivatePartEncryptionError =
  BasicError<'PrivatePartEncryptionError'> & {toPublicKey: PublicKeyPemBase64}

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
    TE.mapLeft(
      (e) =>
        ({
          _tag: 'PrivatePartEncryptionError',
          error: new Error('Error encrypting private part', {cause: e?.error}),
          toPublicKey: privatePart.toPublicKey,
        }) as const
    )
  )
}

export function fetchInfoAndGeneratePrivatePayloads({
  contactApi,
  intendedConnectionLevel,
  symmetricKey,
  ownerCredentials,
  onProgress,
}: {
  contactApi: ContactPrivateApi
  intendedConnectionLevel: IntendedConnectionLevel
  symmetricKey: SymmetricKey
  ownerCredentials: PrivateKeyHolder
  onProgress?: (state: OfferEncryptionProgress) => void
}): TE.TaskEither<
  ApiErrorFetchingContactsForOffer | ErrorConstructingPrivatePayloads,
  {
    errors: PrivatePartEncryptionError[]
    privateParts: ServerPrivatePart[]
    connections: ConnectionsInfoForOffer
  }
> {
  return pipe(
    TE.Do,
    TE.chainW(() => {
      if (onProgress) onProgress({type: 'FETCHING_CONTACTS'})
      return fetchContactsForOffer({contactApi, intendedConnectionLevel})
    }),
    TE.chainW((connectionsInfo) => {
      if (onProgress) onProgress({type: 'CONSTRUCTING_PRIVATE_PAYLOADS'})
      return pipe(
        TE.Do,
        TE.chainW(() =>
          TE.fromEither(
            constructPrivatePayloads({connectionsInfo, symmetricKey})
          )
        ),
        TE.map((privatePayloads) => [
          ...privatePayloads,
          privatePayloadForOwner({ownerCredentials, symmetricKey}),
        ]),
        TE.chainTaskK((privateParts) =>
          pipe(
            privateParts,
            A.mapWithIndex((i, one) =>
              pipe(
                TE.Do,
                TE.map((v) => {
                  if (onProgress)
                    onProgress({
                      type: 'ENCRYPTING_PRIVATE_PAYLOADS',
                      currentlyProcessingIndex: i,
                      totalToEncrypt: privateParts.length,
                    })
                  return v
                }),
                TE.chainW(() => encryptPrivatePart(one))
              )
            ),
            A.sequence(T.ApplicativeSeq),
            flattenTaskOfEithers,
            T.map(({lefts, rights}) => ({
              errors: lefts,
              privateParts: rights,
              connections: connectionsInfo,
            }))
          )
        )
      )
    })
  )
}
