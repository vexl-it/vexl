import {fromJsDate} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
import {type OfferParts} from '../db/OfferDbService/domain'

export const offerPartsToServerOffer = (
  offerParts: OfferParts
): ServerOffer => ({
  id: offerParts.privatePart.id,
  offerId: offerParts.publicPart.offerId,
  privatePayload: offerParts.privatePart.payloadPrivate,
  publicPayload: offerParts.publicPart.payloadPublic,
  modifiedAt: fromJsDate(offerParts.publicPart.modifiedAt),
  createdAt: fromJsDate(offerParts.publicPart.createdAt),
  expiration: UnixMilliseconds0,
})
