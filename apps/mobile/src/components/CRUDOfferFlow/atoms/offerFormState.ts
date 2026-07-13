import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type BtcNetwork,
  type CurrencyCode,
  type FeeState,
  type IntendedConnectionLevel,
  type ListingType,
  type LocationState,
  type OfferLocation,
  type OfferPublicPart,
  type OfferType,
  type OneOfferInState,
  type PaymentMethod,
  type ProductCategory,
  type SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {type JSDateString} from '@vexl-next/domain/src/utility/JSDateString.brand'
import getDefaultCurrency from '../../../utils/getDefaultCurrency'
import {MAX_AMOUNT_EUR} from '../../../utils/localization/currency'
import getDefaultSpokenLanguage from '../../../utils/localization/getDefaultSpokenLanguage'
import {type EditableOfferField} from '../offerSetupSteps'

export interface OfferFormState {
  readonly listingType: ListingType | undefined
  readonly offerType: OfferType | undefined
  readonly currency: CurrencyCode
  readonly amountBottomLimit: number
  readonly amountTopLimit: number
  readonly feeAmount: number
  readonly feeState: FeeState
  readonly expirationDate: JSDateString | undefined
  readonly btcNetwork: readonly BtcNetwork[]
  readonly paymentMethod: readonly PaymentMethod[]
  readonly location: readonly OfferLocation[]
  readonly locationState: readonly LocationState[]
  readonly productCategories: readonly ProductCategory[] | undefined
  readonly spokenLanguages: readonly SpokenLanguage[]
  readonly offerDescription: string
  // Sats input mirror of amountBottomLimit shown in the price step
  readonly satsValue: number
  readonly intendedConnectionLevel: IntendedConnectionLevel
  readonly selectedClubsUuids: readonly ClubUuid[]
}

export function createInitialOfferFormState(): OfferFormState {
  return {
    listingType: undefined,
    offerType: undefined,
    currency: getDefaultCurrency(),
    amountBottomLimit: 0,
    amountTopLimit: MAX_AMOUNT_EUR,
    feeAmount: 0,
    feeState: 'WITHOUT_FEE',
    expirationDate: undefined,
    btcNetwork: ['ON_CHAIN'],
    paymentMethod: ['CASH'],
    location: [],
    locationState: ['IN_PERSON'],
    productCategories: undefined,
    spokenLanguages: getDefaultSpokenLanguage(),
    offerDescription: '',
    satsValue: 0,
    intendedConnectionLevel: 'ALL',
    selectedClubsUuids: [],
  }
}

export function offerFormStateFromOffer(
  offer: OneOfferInState
): OfferFormState {
  const publicPart = offer.offerInfo.publicPart

  return {
    listingType: publicPart.listingType,
    offerType: publicPart.offerType,
    currency: publicPart.currency,
    amountBottomLimit: publicPart.amountBottomLimit,
    amountTopLimit: publicPart.amountTopLimit,
    feeAmount: publicPart.feeAmount,
    feeState: publicPart.feeState,
    expirationDate: publicPart.expirationDate,
    btcNetwork: publicPart.btcNetwork,
    paymentMethod: publicPart.paymentMethod,
    location: publicPart.location,
    locationState: publicPart.locationState,
    productCategories: publicPart.productCategories,
    spokenLanguages: publicPart.spokenLanguages,
    offerDescription: publicPart.offerDescription,
    satsValue: 0,
    intendedConnectionLevel:
      offer.ownershipInfo?.intendedConnectionLevel ?? 'FIRST',
    selectedClubsUuids: offer.ownershipInfo?.intendedClubs ?? [],
  }
}

// Fields the form cannot unset (listingType, expirationDate, productCategories)
// are only written when they hold a value so offers missing them stay
// deepEqual-comparable to the merged result.
export function mergeOfferFormStateIntoPublicPart(
  state: OfferFormState,
  publicPart: OfferPublicPart
): OfferPublicPart {
  return {
    ...publicPart,
    currency: state.currency,
    amountBottomLimit: state.amountBottomLimit,
    amountTopLimit: state.amountTopLimit,
    feeAmount: state.feeAmount,
    feeState: state.feeState,
    btcNetwork: state.btcNetwork,
    paymentMethod: state.paymentMethod,
    location: state.location,
    locationState: state.locationState,
    spokenLanguages: [...state.spokenLanguages],
    offerDescription: state.offerDescription,
    offerType: state.offerType ?? publicPart.offerType,
    ...(state.listingType !== undefined && {listingType: state.listingType}),
    ...(state.expirationDate !== undefined && {
      expirationDate: state.expirationDate,
    }),
    ...(state.productCategories !== undefined && {
      productCategories: state.productCategories,
    }),
  }
}

export function offerFormStateToNewOfferPublicPart({
  state,
  offerPublicKey,
}: {
  state: OfferFormState
  offerPublicKey: PublicKeyPemBase64
}): OfferPublicPart {
  return {
    offerPublicKey,
    currency: state.currency,
    amountBottomLimit: state.amountBottomLimit,
    amountTopLimit: state.amountTopLimit,
    feeAmount: state.feeAmount,
    feeState: state.feeState,
    btcNetwork: state.btcNetwork,
    paymentMethod: state.paymentMethod,
    location: state.location,
    locationState: state.locationState,
    spokenLanguages: [...state.spokenLanguages],
    offerDescription: state.offerDescription,
    offerType: state.offerType ?? 'SELL',
    activePriceState: 'NONE',
    activePriceValue: 0,
    activePriceCurrency: getDefaultCurrency(),
    active: true,
    groupUuids: [],
    ...(state.listingType !== undefined && {listingType: state.listingType}),
    ...(state.expirationDate !== undefined && {
      expirationDate: state.expirationDate,
    }),
    ...(state.productCategories !== undefined && {
      productCategories: state.productCategories,
    }),
  }
}

export function copyOfferFieldGroup(
  field: EditableOfferField,
  source: OfferFormState,
  target: OfferFormState
): OfferFormState {
  switch (field) {
    case 'amount':
      return {
        ...target,
        currency: source.currency,
        amountBottomLimit: source.amountBottomLimit,
        amountTopLimit: source.amountTopLimit,
        feeAmount: source.feeAmount,
        feeState: source.feeState,
        expirationDate: source.expirationDate,
      }
    case 'location':
      return {
        ...target,
        locationState: source.locationState,
        location: source.location,
        paymentMethod: source.paymentMethod,
      }
    case 'network':
      return {
        ...target,
        btcNetwork: source.btcNetwork,
      }
    case 'describe':
      return {...target, offerDescription: source.offerDescription}
    case 'language':
      return {...target, spokenLanguages: source.spokenLanguages}
    case 'productCategory':
      return {...target, productCategories: source.productCategories}
    case 'friendLevel':
      return {
        ...target,
        intendedConnectionLevel: source.intendedConnectionLevel,
      }
    case 'clubs':
      return {...target, selectedClubsUuids: source.selectedClubsUuids}
  }
}
