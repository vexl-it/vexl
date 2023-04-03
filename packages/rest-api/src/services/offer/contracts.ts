import {z} from 'zod'
import {
  OfferId,
  OfferType,
  PrivatePayloadEncrypted,
  PublicPayloadEncrypted,
} from '@vexl-next/domain/dist/general/offers'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'

export const OfferAdminId = z.string().brand<'OfferAdminId'>()
export type OfferAdminId = z.TypeOf<typeof OfferAdminId>
export const ServerOffer = z.object({
  id: z
    .number()
    .int()
    .positive()
    .describe('ID of the offer. It should be used for ordering.'),
  offerId: OfferId,
  expiration: UnixMilliseconds,
  publicPayload: PublicPayloadEncrypted,
  privatePayload: PrivatePayloadEncrypted,
  createdAt: IsoDatetimeString,
  modifiedAt: IsoDatetimeString,
})
export type ServerOffer = z.TypeOf<typeof ServerOffer>

export const getOffersByIdsRequest = z.object({ids: z.array(OfferId)})
export type GetOffersByIdsRequest = z.TypeOf<typeof getOffersByIdsRequest>

export const GetOfferByIdsResponse = z.array(ServerOffer)
export type GetOfferByIdsResponse = z.TypeOf<typeof GetOfferByIdsResponse>

export const GetOffersForMeResponse = z.object({
  offers: z.array(ServerOffer),
})
export type GetOffersForMeResponse = z.TypeOf<typeof GetOffersForMeResponse>

export const GetOffersForMeCreatedOrModifiedAfterRequest = z.object({
  modifiedAt: IsoDatetimeString,
})
export type GetOffersForMeCreatedOrModifiedAfterRequest = z.TypeOf<
  typeof GetOffersForMeCreatedOrModifiedAfterRequest
>

export const GetOffersForMeCreatedOrModifiedAfterResponse = z.object({
  offers: z.array(ServerOffer),
})
export type GetOffersForMeCreatedOrModifiedAfterResponse = z.TypeOf<
  typeof GetOffersForMeCreatedOrModifiedAfterResponse
>

export const ServerPrivatePart = z.object({
  userPublicKey: PublicKeyPemBase64,
  payloadPrivate: PrivatePayloadEncrypted,
})
export type ServerPrivatePart = z.TypeOf<typeof ServerPrivatePart>

export const CreateNewOfferRequest = z.object({
  offerType: OfferType,
  payloadPublic: PublicPayloadEncrypted,
  offerPrivateList: z.array(ServerPrivatePart),
})
export type CreateNewOfferRequest = z.TypeOf<typeof CreateNewOfferRequest>
export const CreateNewOfferResponse = ServerOffer.extend({
  adminId: OfferAdminId,
})
export type CreateNewOfferResponse = z.TypeOf<typeof CreateNewOfferResponse>

export const RefreshOfferRequest = z.object({
  adminIds: z.array(OfferAdminId),
})
export type RefreshOfferRequest = z.TypeOf<typeof RefreshOfferRequest>

export const RefreshOfferResponse = NoContentResponse
export type RefreshOfferResponse = z.TypeOf<typeof RefreshOfferResponse>

export const DeleteOfferRequest = z.object({
  adminIds: z.array(OfferAdminId),
})
export type DeleteOfferRequest = z.TypeOf<typeof DeleteOfferRequest>
export const DeleteOfferResponse = NoContentResponse
export type DeleteOfferResponse = z.TypeOf<typeof DeleteOfferResponse>

export const UpdateOfferRequest = z.object({
  adminId: OfferAdminId,
  payloadPublic: PublicPayloadEncrypted,
  offerPrivateList: z.array(
    z.object({
      userPublicKey: PublicKeyPemBase64,
      payloadPrivate: PrivatePayloadEncrypted,
    })
  ),
})
export type UpdateOfferRequest = z.TypeOf<typeof UpdateOfferRequest>

export const UpdateOfferResponse = ServerOffer
export type UpdateOfferResponse = z.TypeOf<typeof UpdateOfferResponse>

export const CreatePrivatePartRequest = z.object({
  adminId: OfferAdminId,
  offerPrivateList: z.array(ServerPrivatePart),
})
export type CreatePrivatePartRequest = z.TypeOf<typeof CreatePrivatePartRequest>

export const CreatePrivatePartResponse = NoContentResponse
export type CreatePrivatePartResponse = z.TypeOf<
  typeof CreatePrivatePartResponse
>
