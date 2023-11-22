import {z} from 'zod'

export const OfferEncryptionProgress = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ENCRYPTING_PRIVATE_PAYLOADS'),
    currentlyProcessingIndex: z.number(),
    totalToEncrypt: z.number(),
  }),
  z.object({type: z.literal('FETCHING_CONTACTS')}),
  z.object({type: z.literal('CONSTRUCTING_PRIVATE_PAYLOADS')}),
  z.object({type: z.literal('CONSTRUCTING_PUBLIC_PAYLOAD')}),
  z.object({type: z.literal('SENDING_OFFER_TO_NETWORK')}),
  z.object({type: z.literal('DONE')}),
])
export type OfferEncryptionProgress = z.TypeOf<typeof OfferEncryptionProgress>
