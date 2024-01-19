import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  OfferAdminId,
  OfferId,
  OfferType,
  PrivatePayloadEncrypted,
  PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {z} from 'zod'
import {NoContentResponse} from '../../NoContentResponse.brand'

export interface ReportOfferLimitReachedError {
  readonly _tag: 'ReportOfferLimitReachedError'
}

export const ServerOffer = z.object({
  id: z
    .number()
    .int()
    .min(0)
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
  countryPrefix: CountryPrefix,
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

export const RefreshOfferResponse = z.array(OfferId)
export type RefreshOfferResponse = z.TypeOf<typeof RefreshOfferResponse>

export const DeleteOfferRequest = z.object({
  adminIds: z.array(OfferAdminId),
})
export type DeleteOfferRequest = z.TypeOf<typeof DeleteOfferRequest>
export const DeleteOfferResponse = NoContentResponse
export type DeleteOfferResponse = z.TypeOf<typeof DeleteOfferResponse>

export const OfferPrivateListItem = z.object({
  userPublicKey: PublicKeyPemBase64,
  payloadPrivate: PrivatePayloadEncrypted,
})
export type OfferPrivateListItem = z.TypeOf<typeof OfferPrivateListItem>

export const UpdateOfferRequest = z.object({
  adminId: OfferAdminId,
  payloadPublic: PublicPayloadEncrypted,
  offerPrivateList: z.array(OfferPrivateListItem),
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

export const DeletePrivatePartRequest = z.object({
  adminIds: z.array(OfferAdminId),
  publicKeys: z.array(PublicKeyPemBase64),
})
export type DeletePrivatePartRequest = z.TypeOf<typeof DeletePrivatePartRequest>

export const DeletePrivatePartResponse = NoContentResponse
export type DeletePrivatePartResponse = z.TypeOf<
  typeof CreatePrivatePartResponse
>

export const RemovedOfferIdsRequest = z.object({
  offerIds: z.array(OfferId),
})
export type RemovedOfferIdsRequest = z.TypeOf<typeof RemovedOfferIdsRequest>
export const RemovedOfferIdsResponse = RemovedOfferIdsRequest
export type RemovedOfferIdsResponse = z.TypeOf<typeof RemovedOfferIdsResponse>

export const ReportOfferRequest = z.object({
  offerId: OfferId,
})
export type ReportOfferRequest = z.TypeOf<typeof ReportOfferRequest>
export const ReportOfferResponse = NoContentResponse

export const DeleteUserResponse = NoContentResponse
export type DeleteUserResponse = z.TypeOf<typeof DeleteUserResponse>
