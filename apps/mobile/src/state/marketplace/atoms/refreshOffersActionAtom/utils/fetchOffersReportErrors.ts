import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {type IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from '@vexl-next/resources-utils/src/offers/decryptOffer'
import getNewClubsOffersAndDecrypt, {
  type ApiErrorFetchingClubsOffers,
  type NotOfferForExpectedClubError,
} from '@vexl-next/resources-utils/src/offers/getNewClubsOffersAndDecrypt'
import getNewContactNetworkOffersAndDecrypt, {
  type ApiErrorFetchingOffers,
  type NotOfferFromContactNetworkError,
} from '@vexl-next/resources-utils/src/offers/getNewOffersAndDecrypt'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Either, Option, pipe, Record} from 'effect'
import reportError from '../../../../../utils/reportError'

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

export const fetchOffersReportErrors = ({
  offersApi,
  lastUpdate,
  contactNetworkKeyPair,
  clubs,
}: {
  offersApi: OfferApi
  lastUpdate: IsoDatetimeString
  contactNetworkKeyPair: PrivateKeyHolder
  clubs: Record<ClubUuid, PrivateKeyHolder>
}): Effect.Effect<
  {contact: readonly OfferInfo[]; clubs: readonly OfferInfo[]},
  ApiErrorFetchingOffers | ApiErrorFetchingClubsOffers
> =>
  Effect.all({
    contact: pipe(
      getNewContactNetworkOffersAndDecrypt({
        offersApi,
        modifiedAt: lastUpdate,
        keyPair: contactNetworkKeyPair,
      }),
      Effect.map(filterAndReportDecryptionErrors)
    ),

    clubs: pipe(
      Record.toEntries(clubs),
      Array.map(([clubUuid, keyPair]) =>
        getNewClubsOffersAndDecrypt({
          offersApi,
          modifiedAt: lastUpdate,
          keyPair,
          clubUuid,
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
