import {type CRUDOfferStackParamsList} from '../../navigationTypes'

export const btcOfferScreens: Array<keyof CRUDOfferStackParamsList> = [
  'ListingAndOfferType',
  'CurrencyAndAmount',
  'LocationPaymentMethodAndNetworkScreen',
  'OfferDescriptionAndSpokenLanguagesScreen',
  'FriendLevelScreen',
  'SummaryScreen',
]

export const productOfferScreens: Array<keyof CRUDOfferStackParamsList> = [
  'ListingAndOfferType',
  'PriceScreen',
  'DeliveryMethodAndNetworkScreen',
  'OfferDescriptionAndSpokenLanguagesScreen',
  'FriendLevelScreen',
  'SummaryScreen',
]

export const otherOfferScreens: Array<keyof CRUDOfferStackParamsList> = [
  'ListingAndOfferType',
  'PriceScreen',
  'LocationPaymentMethodAndNetworkScreen',
  'OfferDescriptionAndSpokenLanguagesScreen',
  'FriendLevelScreen',
  'SummaryScreen',
]
