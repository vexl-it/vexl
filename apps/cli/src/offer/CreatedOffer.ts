import {z} from 'zod'
import {OfferId, OfferPublicPart} from '@vexl-next/domain/dist/general/offers'
import {OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {stringifyToJson} from '../utils/parsing'
import {saveFile} from '../utils/fs'
import {PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {UserCredentials} from '../utils/auth'

export const CreatedOffer = z.object({
  offerId: OfferId,
  adminId: OfferAdminId,
  keypair: PrivateKeyHolder,
  symmetricKey: z.string(),
  ownerCredentials: UserCredentials,
  offerPublicPart: OfferPublicPart,
})
export type CreatedOffer = z.TypeOf<typeof CreatedOffer>

export function saveCreatedOfferToFile(file: PathString) {
  return (offer: CreatedOffer) =>
    pipe(stringifyToJson(offer), E.chainW(saveFile(file)))
}
