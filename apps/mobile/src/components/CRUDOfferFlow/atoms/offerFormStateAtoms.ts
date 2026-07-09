import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {molecule} from 'bunshi/dist/react'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {getIsOffering} from '../../../utils/offerHelpers'
import {createOfferFormDraftAtoms} from './offerFormDraftAtoms'
import {createOfferFormFieldActionAtoms} from './offerFormFieldActionAtoms'
import {createOfferFormLifecycleAtoms} from './offerFormLifecycleAtoms'
import {createOfferFormPriceAtoms} from './offerFormPriceAtoms'
import {createOfferFormPublishAtoms} from './offerFormPublishAtoms'
import {
  createInitialOfferFormState,
  type OfferFormState,
} from './offerFormState'

// The offer form keeps two copies of the same state: workingFormAtom is the
// draft every input writes to, committedFormAtom only receives a field's
// values when that field is saved. Publishing an edited offer reads the
// committed state; creating a new offer reads the working state directly
// (the create flow has no per-field save).
export const offerFormMolecule = molecule(() => {
  const workingFormAtom = atom<OfferFormState>(createInitialOfferFormState())
  const committedFormAtom = atom<OfferFormState>(createInitialOfferFormState())
  const editedOfferIdAtom = atom<OfferId | undefined>(undefined)
  const offerActiveAtom = atom<boolean>(true)

  const listingTypeAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('listingType')
  )
  const offerTypeAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('offerType')
  )
  const currencyAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('currency')
  )
  const amountBottomLimitAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('amountBottomLimit')
  )
  const amountTopLimitAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('amountTopLimit')
  )
  const feeAmountAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('feeAmount')
  )
  const feeStateAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('feeState')
  )
  const expirationDateAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('expirationDate')
  )
  const btcNetworkAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('btcNetwork')
  )
  const paymentMethodAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('paymentMethod')
  )
  const locationAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('location')
  )
  const locationStateAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('locationState')
  )
  const productCategoriesAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('productCategories')
  )
  const spokenLanguagesAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('spokenLanguages')
  )
  const offerDescriptionAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('offerDescription')
  )
  const satsValueAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('satsValue')
  )
  const intendedConnectionLevelAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('intendedConnectionLevel')
  )
  const selectedClubsUuidsAtom = focusAtom(workingFormAtom, (optic) =>
    optic.prop('selectedClubsUuids')
  )

  const priceAtoms = createOfferFormPriceAtoms({
    currencyAtom,
    amountBottomLimitAtom,
    amountTopLimitAtom,
    satsValueAtom,
  })

  const fieldActionAtoms = createOfferFormFieldActionAtoms({
    listingTypeAtom,
    feeAmountAtom,
    feeStateAtom,
    amountBottomLimitAtom,
    btcNetworkAtom,
    paymentMethodAtom,
    locationAtom,
    locationStateAtom,
    productCategoriesAtom,
    spokenLanguagesAtom,
    selectedClubsUuidsAtom,
    calculateSatsValueOnFiatValueChangeActionAtom:
      priceAtoms.calculateSatsValueOnFiatValueChangeActionAtom,
  })

  const draftAtoms = createOfferFormDraftAtoms({
    workingFormAtom,
    committedFormAtom,
  })

  const lifecycleAtoms = createOfferFormLifecycleAtoms({
    workingFormAtom,
    committedFormAtom,
    editedOfferIdAtom,
    offerActiveAtom,
    calculateSatsValueOnFiatValueChangeActionAtom:
      priceAtoms.calculateSatsValueOnFiatValueChangeActionAtom,
    initializeAmountTopLimitFromBtcPriceActionAtom:
      priceAtoms.initializeAmountTopLimitFromBtcPriceActionAtom,
  })

  const publishAtoms = createOfferFormPublishAtoms({
    workingFormAtom,
    committedFormAtom,
    editedOfferIdAtom,
    offerActiveAtom,
    checkAmountExceedsLimitAndShowDialogActionAtom:
      priceAtoms.checkAmountExceedsLimitAndShowDialogActionAtom,
    discardChangesActionAtom: lifecycleAtoms.discardChangesActionAtom,
  })

  const offerTitleAtom = atom((get) => {
    const {t} = get(translationAtom)
    const listingType = get(listingTypeAtom)
    const offerType = get(offerTypeAtom)
    const isOffering = getIsOffering(listingType, offerType ?? 'SELL')
    if (listingType === 'PRODUCT') {
      return isOffering
        ? t('editOffer.title.offeringProduct')
        : t('editOffer.title.wantProduct')
    }
    if (listingType === 'OTHER') {
      return isOffering
        ? t('editOffer.title.offeringService')
        : t('editOffer.title.wantService')
    }
    return isOffering
      ? t('editOffer.title.offeringBitcoin')
      : t('editOffer.title.wantBtc')
  })

  return {
    offerActiveAtom,
    listingTypeAtom,
    offerTypeAtom,
    currencyAtom,
    amountBottomLimitAtom,
    amountTopLimitAtom,
    feeAmountAtom,
    feeStateAtom,
    expirationDateAtom,
    locationAtom,
    locationStateAtom,
    productCategoriesAtom,
    spokenLanguagesAtom,
    offerDescriptionAtom,
    satsValueAtom,
    intendedConnectionLevelAtom,
    selectedClubsUuidsAtom,
    offerTitleAtom,
    ...priceAtoms,
    ...fieldActionAtoms,
    ...draftAtoms,
    ...lifecycleAtoms,
    ...publishAtoms,
  }
})
