import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {type IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from '@vexl-next/resources-utils/src/offers/decryptOffer'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Either, Option, pipe, Record} from 'effect'
import {atom} from 'jotai'
import reportError from '../../../../../utils/reportError'
import {
  DEFAULT_PRIVATE_PART_ID_BASE64,
  type NotOfferFromContactNetworkError,
} from '../../../domain'
import {
  clubOffersNextPageParamAtom,
  contactOffersNextPageParamAtom,
} from '../../offersState'
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

export const fetchOffersReportErrorsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      offersApi,
      lastUpdate,
      contactNetworkKeyPair,
      clubs,
    }: {
      offersApi: OfferApi
      lastUpdate: IsoDatetimeString
      contactNetworkKeyPair: PrivateKeyHolder
      clubs: Record<ClubUuid, PrivateKeyHolder>
    }
  ) => {
    const contactOffersNextPageParam =
      get(contactOffersNextPageParamAtom) ?? DEFAULT_PRIVATE_PART_ID_BASE64
    const clubOffersNextPageParam =
      get(clubOffersNextPageParamAtom) ?? DEFAULT_PRIVATE_PART_ID_BASE64

    return Effect.all({
      contact: pipe(
        set(getNewContactNetworkOffersAndDecryptPaginatedActionAtom, {
          offersApi,
          modifiedAt: lastUpdate,
          keyPair: contactNetworkKeyPair,
          lastPrivatePartIdBase64: contactOffersNextPageParam,
        }),
        Effect.map(filterAndReportDecryptionErrors)
      ),

      clubs: pipe(
        Record.toEntries(clubs),
        Array.map(([clubUuid, keyPair]) =>
          set(getNewClubsOffersAndDecryptPaginatedActionAtom, {
            offersApi,
            modifiedAt: lastUpdate,
            keyPair,
            clubUuid,
            lastPrivatePartIdBase64: clubOffersNextPageParam,
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
