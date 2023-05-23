export type OfferEncryptionProgress =
  | {
      type: 'ENCRYPTING_PRIVATE_PAYLOADS'
      currentlyProcessingIndex: number
      totalToEncrypt: number
    }
  | {type: 'FETCHING_CONTACTS'}
  | {type: 'CONSTRUCTING_PRIVATE_PAYLOADS'}
  | {type: 'CONSTRUCTING_PUBLIC_PAYLOAD'}
  | {type: 'SENDING_OFFER_TO_NETWORK'}
  | {type: 'DONE'}

export default {}
