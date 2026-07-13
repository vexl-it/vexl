import {type TFunction} from '../../../utils/localization/I18nProvider'
import {type OfferFormState} from './offerFormState'

export function getOfferFormValidationErrorMessage(
  form: OfferFormState,
  t: TFunction
): string | undefined {
  const {
    amountBottomLimit,
    listingType,
    locationState,
    location,
    offerDescription,
  } = form

  if (!listingType) return t('offerForm.errorListingTypeNotFilled')

  if (listingType !== 'BITCOIN' && amountBottomLimit <= 0) {
    return t('offerForm.errorPriceNotFilled')
  }

  if (listingType === 'PRODUCT' && locationState.length === 0) {
    return t('offerForm.errorDeliveryMethodNotFilled')
  }

  if (
    listingType === 'PRODUCT' &&
    locationState.includes('IN_PERSON') &&
    location.length === 0
  ) {
    return t('offerForm.errorPickupLocationNotFilled')
  }

  if (
    listingType === 'BITCOIN' &&
    locationState.includes('IN_PERSON') &&
    location.length === 0
  ) {
    return t('offerForm.errorLocationNotFilled')
  }

  if (
    listingType === 'OTHER' &&
    locationState.includes('IN_PERSON') &&
    location.length === 0
  ) {
    return t('offerForm.errorOtherOfferLocationNotFilled')
  }

  if (offerDescription.trim() === '') {
    return t('offerForm.errorDescriptionNotFilled')
  }

  return undefined
}
