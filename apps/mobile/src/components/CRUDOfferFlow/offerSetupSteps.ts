export type OfferSetupStep =
  | 'offerType'
  | 'listingType'
  | 'productCategory'
  | 'amount'
  | 'location'
  | 'network'
  | 'describe'
  | 'language'
  | 'friendLevel'
  | 'clubs'

export type EditableOfferField = Exclude<
  OfferSetupStep,
  'offerType' | 'listingType'
>
