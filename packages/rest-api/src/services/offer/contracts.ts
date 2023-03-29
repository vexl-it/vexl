import {z} from 'zod'
import {OfferType} from '@vexl-next/domain/dist/general/offers'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'

export const OfferAdminId = z.string().brand<'OfferAdminId'>()
export const ServerOffer = z.object({
  id: z
    .number()
    .int()
    .positive()
    .describe('ID of the offer. It should be used for ordering.'),
  offerId: z.string().describe('265-bit Offer ID'), // branded type
  publicPayload: z
    .string()
    .describe(
      'Encrypted public payload. It should be encrypted by client with symmetric encryption.'
    ),
  privatePayload: z
    .string()
    .describe(
      'Encrypted private payload. It should be encrypted by client with asymmetric encryption.'
    ),
  createdAt: z.string().datetime({offset: true}),
  modifiedAt: z.string().datetime({offset: true}),
})
export type ServerOffer = z.TypeOf<typeof ServerOffer>

export const GetOffersForMeResponse = z.object({
  offers: z.array(ServerOffer),
})
export type GetOffersForMeResponse = z.TypeOf<typeof GetOffersForMeResponse>

export const GetOffersForMeCreatedOrModifiedAfterRequest = z.object({
  modifiedAt: z.string().datetime(),
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

export const CreateNewOfferRequest = z.object({
  offerType: OfferType,
  payloadPublic: z.string(),
  offerPrivateList: z.array(
    z.object({
      userPublicKey: PublicKeyPemBase64,
      payloadPrivate: z.string(),
    })
  ),
})
export type CreateNewOfferRequest = z.TypeOf<typeof CreateNewOfferRequest>
export const CreateNewOfferResponse = ServerOffer.extend({
  adminId: OfferAdminId,
})
export type CreateNewOfferResponse = z.TypeOf<typeof CreateNewOfferResponse>
