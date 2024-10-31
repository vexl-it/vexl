import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {toError} from '@vexl-next/domain/src/utility/errors'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Array} from 'effect'
import {type NonEmptyArray} from 'effect/Array'
import * as NEA from 'fp-ts/NonEmptyArray'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import flattenTaskOfEithers from '../../utils/flattenTaskOfEithers'
import {type OfferEncryptionProgress} from '../OfferEncryptionProgress'
import {constructPrivatePayloadForOwner} from '../constructPrivatePayloadForOwner'
import constructPrivatePayloads, {
  type ErrorConstructingPrivatePayloads,
  type OfferPrivatePayloadToEncrypt,
} from './constructPrivatePayloads'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './encryptPrivatePart'
import fetchContactsForOffer, {
  type ApiErrorFetchingContactsForOffer,
  type ConnectionsInfoForOffer,
} from './fetchContactsForOffer'
export function fetchInfoAndGeneratePrivatePayloads({
  contactApi,
  intendedConnectionLevel,
  symmetricKey,
  adminId,
  ownerCredentials,
  onProgress,
}: {
  contactApi: ContactApi
  intendedConnectionLevel: IntendedConnectionLevel
  symmetricKey: SymmetricKey
  ownerCredentials: PrivateKeyHolder
  adminId: OfferAdminId
  onProgress?: ((state: OfferEncryptionProgress) => void) | undefined
}): TE.TaskEither<
  ApiErrorFetchingContactsForOffer | ErrorConstructingPrivatePayloads,
  {
    errors: PrivatePartEncryptionError[]
    privateParts: NonEmptyArray<ServerPrivatePart>
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
        TE.map(
          (privatePayloads): NonEmptyArray<OfferPrivatePayloadToEncrypt> => [
            constructPrivatePayloadForOwner({
              ownerCredentials,
              symmetricKey,
              adminId,
              intendedConnectionLevel,
            }),
            ...privatePayloads,
          ]
        ),
        TE.chainTaskK((privateParts) =>
          pipe(
            privateParts,
            NEA.mapWithIndex((i, one) =>
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
            NEA.sequence(T.ApplicativeSeq),
            flattenTaskOfEithers,
            T.map(
              ({
                lefts,
                rights,
              }: {
                lefts: PrivatePartEncryptionError[]
                rights: ServerPrivatePart[]
              }) => ({
                errors: lefts,
                privateParts: rights,
                connections: connectionsInfo,
              })
            )
          )
        ),
        TE.chainW((value) => {
          const privateParts = value.privateParts
          if (!Array.isNonEmptyArray(privateParts)) {
            return TE.left(
              toError(
                'ErrorConstructingPrivatePayloads' as const,
                'No private part was encrypted'
              )(new Error('No private part was encrypted'))
            )
          }

          return TE.right<
            never,
            typeof value & {
              privateParts: NonEmptyArray<ServerPrivatePart>
            }
          >({...value, privateParts})
        })
      )
    })
  )
}
