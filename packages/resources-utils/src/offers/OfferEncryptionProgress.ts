import {Schema} from 'effect'

const EncryptingPrivatePayloads = Schema.Struct({
  type: Schema.Literal('ENCRYPTING_PRIVATE_PAYLOADS'),
  currentlyProcessingIndex: Schema.Number,
  totalToEncrypt: Schema.Number,
})

const FetchingContacts = Schema.Struct({
  type: Schema.Literal('FETCHING_CONTACTS'),
})

export const ConstructingPrivatePayloads = Schema.Struct({
  type: Schema.Literal('CONSTRUCTING_PRIVATE_PAYLOADS'),
})

const ConstructingPublicPayload = Schema.Struct({
  type: Schema.Literal('CONSTRUCTING_PUBLIC_PAYLOAD'),
})

const SendingOfferToNetwork = Schema.Struct({
  type: Schema.Literal('SENDING_OFFER_TO_NETWORK'),
})

const Done = Schema.Struct({
  type: Schema.Literal('DONE'),
})

export const OfferEncryptionProgress = Schema.Union(
  EncryptingPrivatePayloads,
  FetchingContacts,
  ConstructingPrivatePayloads,
  ConstructingPublicPayload,
  SendingOfferToNetwork,
  Done
)

export type OfferEncryptionProgress = Schema.Schema.Type<
  typeof OfferEncryptionProgress
>
