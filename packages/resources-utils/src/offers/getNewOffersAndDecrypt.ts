import {type OfferPrivateApi} from '@vexl-next/rest-api/src/services/offer'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import * as TE from 'fp-ts/TaskEither'
import type * as E from 'fp-ts/Either'
import decryptOffer, {
  type ErrorDecryptingOffer,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'
import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import {type IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {type ExtractLeftTE} from '../utils/ExtractLeft'

export type ApiErrorFetchingOffers = ExtractLeftTE<
  ReturnType<OfferPrivateApi['getOffersForMeModifiedOrCreatedAfter']>
>

/**
 * Downloads new offers from the server and decrypts them with provided keypair
 */
export default function getNewOffersAndDecrypt({
  offersApi,
  keyPair,
  modifiedAt,
}: {
  /**
   * Offers API instance. Already handles auth for us.
   */
  offersApi: OfferPrivateApi
  /**
   * KeyPair to decrypt offers with.
   */
  keyPair: PrivateKeyHolder
  /**
   * Only offers modified/created after this date will be fetched.
   */
  modifiedAt: IsoDatetimeString
}): TE.TaskEither<
  ApiErrorFetchingOffers,
  Array<
    E.Either<ErrorDecryptingOffer | NonCompatibleOfferVersionError, OfferInfo>
  >
> {
  return pipe(
    offersApi.getOffersForMeModifiedOrCreatedAfter({modifiedAt}),
    TE.map(({offers}) => offers),
    TE.chainW((offers) =>
      pipe(
        offers,
        A.map(decryptOffer(keyPair)),
        A.sequence(T.ApplicativeSeq),
        TE.fromTask
      )
    )
  )
}
