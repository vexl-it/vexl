import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type ContactPrivateApi} from '@vexl-next/rest-api/src/services/contact'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import flattenTaskOfEithers from '../../utils/flattenTaskOfEithers'
import {type OfferEncryptionProgress} from '../OfferEncryptionProgress'
import {constructPrivatePayloadForOwner} from '../constructPrivatePayloadForOwner'
import constructPrivatePayloads, {
  type ErrorConstructingPrivatePayloads,
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
  contactApi: ContactPrivateApi
  intendedConnectionLevel: IntendedConnectionLevel
  symmetricKey: SymmetricKey
  ownerCredentials: PrivateKeyHolder
  adminId: OfferAdminId
  onProgress?: ((state: OfferEncryptionProgress) => void) | undefined
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
          constructPrivatePayloadForOwner({
            ownerCredentials,
            symmetricKey,
            adminId,
            intendedConnectionLevel,
          }),
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
