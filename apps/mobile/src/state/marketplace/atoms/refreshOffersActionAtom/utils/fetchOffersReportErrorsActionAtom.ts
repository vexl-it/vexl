import {
  type KeyPairV2,
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubKeys, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from '@vexl-next/resources-utils/src/offers/decryptOffer'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Either, Option, pipe, Record} from 'effect'
import {constVoid} from 'effect/Function'
import {atom} from 'jotai'
import reportError from '../../../../../utils/reportError'
import {
  type ApiErrorFetchingOffers,
  type NotOfferFromContactNetworkError,
} from '../../../domain'
import {
  clubOffersNextPageParamAtom,
  contactOffersNextPageParamAtom,
  extraIdentitiesContactOffersNextPageParamAtom,
} from '../../offersState'
import {type OfferForIdentity} from './combineIncomingOffers'
import {
  getNewClubsOffersAndDecryptPaginatedActionAtom,
  type NotOfferForExpectedClubError,
} from './getNewClubsOffersAndDecrypt'
import {getNewContactNetworkOffersAndDecryptPaginatedActionAtom} from './getNewOffersAndDecrypt'

type DecryptedOfferResult = Either.Either<
  OfferInfo,
  | DecryptingOfferError
  | NonCompatibleOfferVersionError
  | NotOfferForExpectedClubError
  | NotOfferFromContactNetworkError
>

const getOfferOrNoneReportError = (
  decryptedOffer: DecryptedOfferResult
): Option.Option<OfferInfo> => {
  if (Either.isRight(decryptedOffer)) return Option.some(decryptedOffer.right)

  const error = decryptedOffer.left
  if (error._tag === 'DecryptingOfferError') {
    reportError('error', new Error('Error while decrypting offers'), {
      error,
    })
  } else if (error._tag === 'NonCompatibleOfferVersionError') {
    console.log('Got non compatible offer version. Skipping offer')
    console.log('Got non compatible offer version. Skipping offer', error)
  } else if (
    error._tag === 'NotOfferForExpectedClubError' ||
    error._tag === 'NotOfferFromContactNetworkError'
  ) {
    reportError(
      'error',
      new Error(
        'Received offer marked either as club offer or contact offer from unexpected public key'
      ),
      {
        error,
      }
    )
  }

  return Option.none()
}

const filterAndReportDecryptionErrors = (
  decryptedOfferResults: DecryptedOfferResult[]
): readonly OfferInfo[] => {
  return pipe(
    decryptedOfferResults,
    Array.map(getOfferOrNoneReportError),
    Array.getSomes
  )
}

interface ContactOffersOfIdentity {
  readonly offers: readonly OfferForIdentity[]
  readonly commitNextPageToken: () => void
}

export interface OffersIdentity {
  readonly identity: PublicKeyPemBase64
  readonly offersApi: OfferApi
  readonly keyPair: PrivateKeyHolder
  readonly keyPairV2: KeyPairV2
}

/**
 * Contact offers come to every phone number of the user, each decrypted with
 * that number's keys. Offers of the user come to the main number only.
 */
export const fetchOffersReportErrorsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      mainIdentity,
      extraIdentities,
      clubs,
    }: {
      mainIdentity: OffersIdentity
      extraIdentities: readonly OffersIdentity[]
      clubs: Record<ClubUuid, ClubKeys>
    }
  ) => {
    const clubOffersNextPageParam = get(clubOffersNextPageParamAtom)
    const extraCursors = get(extraIdentitiesContactOffersNextPageParamAtom)

    const fetchForIdentity = ({
      identity,
      offersApi,
      keyPair,
      keyPairV2,
      lastPrivatePartIdBase64,
      storeNextPageToken,
    }: OffersIdentity & {
      lastPrivatePartIdBase64: string | undefined
      storeNextPageToken: (nextPageToken: string) => void
    }): Effect.Effect<ContactOffersOfIdentity, ApiErrorFetchingOffers> =>
      Effect.gen(function* (_) {
        let nextPageToken: string | undefined
        const offers = yield* _(
          set(getNewContactNetworkOffersAndDecryptPaginatedActionAtom, {
            offersApi,
            keyPair,
            keyPairV2,
            lastPrivatePartIdBase64,
            storeNextPageToken: (token) => {
              nextPageToken = token
            },
          }),
          Effect.map(filterAndReportDecryptionErrors)
        )
        return {
          offers: Array.map(offers, (offerInfo) => ({identity, offerInfo})),
          commitNextPageToken: () => {
            if (nextPageToken) storeNextPageToken(nextPageToken)
          },
        }
      })

    return Effect.all({
      contact: Effect.all(
        [
          fetchForIdentity({
            ...mainIdentity,
            lastPrivatePartIdBase64: get(contactOffersNextPageParamAtom),
            storeNextPageToken: (nextPageToken) => {
              set(contactOffersNextPageParamAtom, nextPageToken)
            },
          }),
          ...Array.map(extraIdentities, (extra) =>
            fetchForIdentity({
              ...extra,
              lastPrivatePartIdBase64: extraCursors?.[extra.identity],
              storeNextPageToken: (nextPageToken) => {
                set(extraIdentitiesContactOffersNextPageParamAtom, (prev) => ({
                  ...prev,
                  [extra.identity]: nextPageToken,
                }))
              },
            }).pipe(
              // Owner parts are encrypted for the main number only
              Effect.map((result) => ({
                ...result,
                offers: Array.filter(
                  result.offers,
                  ({offerInfo}) => !offerInfo.privatePart.adminId
                ),
              })),
              // One number failing must not hold back the others
              Effect.catchAll((e) => {
                reportError(
                  'warn',
                  new Error('Error fetching offers of an extra phone number'),
                  {e}
                )
                return Effect.succeed({
                  offers: [],
                  commitNextPageToken: constVoid,
                })
              })
            )
          ),
        ],
        {concurrency: 'unbounded'}
      ).pipe(
        Effect.map((results) => ({
          offers: Array.flatMap(results, (one) => one.offers),
          // Only once the offers are merged, a failed refresh must not skip them
          commitNextPageTokens: () => {
            Array.forEach(results, (one) => {
              one.commitNextPageToken()
            })
          },
        }))
      ),

      clubs: pipe(
        Record.toEntries(clubs),
        Array.map(([clubUuid, keyPair]) =>
          set(getNewClubsOffersAndDecryptPaginatedActionAtom, {
            offersApi: mainIdentity.offersApi,
            keyPair,
            clubUuid,
            lastPrivatePartIdBase64: pipe(
              Record.get(clubOffersNextPageParam, clubUuid),
              Option.getOrUndefined
            ),
          }).pipe(
            Effect.catchTag('NotFoundError', () => {
              // Club not found, ignore
              return Effect.succeed([])
            })
          )
        ),
        Effect.all,
        Effect.map(Array.flatten),
        Effect.map(filterAndReportDecryptionErrors)
      ),
    })
  }
)
