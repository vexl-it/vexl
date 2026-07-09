import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {type Effect} from 'effect'
import {deepEqual} from 'fast-equals'
import {atom, type Atom, type PrimitiveAtom, type WritableAtom} from 'jotai'
import {singleOfferAtom} from '../../../state/marketplace/atoms/offersState'
import {lastUsedOfferSpokenLanguagesAtom} from '../../../utils/preferences'
import {
  createInitialOfferFormState,
  mergeOfferFormStateIntoPublicPart,
  offerFormStateFromOffer,
  type OfferFormState,
} from './offerFormState'

export interface OfferFormLifecycleAtoms {
  readonly setOfferFormActionAtom: WritableAtom<
    null,
    [OfferId | undefined],
    void
  >
  readonly resetOfferFormActionAtom: WritableAtom<null, [], void>
  readonly initializeValuesForOfferFormActionAtom: WritableAtom<
    null,
    [],
    Effect.Effect<void>
  >
  readonly discardChangesActionAtom: WritableAtom<null, [], void>
  readonly hasUnsavedChangesAtom: Atom<boolean>
}

export function createOfferFormLifecycleAtoms({
  workingFormAtom,
  committedFormAtom,
  editedOfferIdAtom,
  offerActiveAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  initializeAmountTopLimitFromBtcPriceActionAtom,
}: {
  workingFormAtom: PrimitiveAtom<OfferFormState>
  committedFormAtom: PrimitiveAtom<OfferFormState>
  editedOfferIdAtom: PrimitiveAtom<OfferId | undefined>
  offerActiveAtom: PrimitiveAtom<boolean>
  calculateSatsValueOnFiatValueChangeActionAtom: WritableAtom<
    null,
    [string],
    void
  >
  initializeAmountTopLimitFromBtcPriceActionAtom: WritableAtom<
    null,
    [],
    Effect.Effect<void>
  >
}): OfferFormLifecycleAtoms {
  const setOfferFormActionAtom = atom(
    null,
    (get, set, offerId: OfferId | undefined) => {
      const offer = get(singleOfferAtom(offerId))
      if (!offer) return

      const initialFormState = offerFormStateFromOffer(offer)
      set(editedOfferIdAtom, offer.offerInfo.offerId)
      set(workingFormAtom, initialFormState)
      set(committedFormAtom, initialFormState)
      set(
        calculateSatsValueOnFiatValueChangeActionAtom,
        String(offer.offerInfo.publicPart.amountBottomLimit)
      )
      set(offerActiveAtom, offer.offerInfo.publicPart.active)
    }
  )

  const resetOfferFormActionAtom = atom(null, (get, set) => {
    const state: OfferFormState = {
      ...createInitialOfferFormState(),
      spokenLanguages: [...get(lastUsedOfferSpokenLanguagesAtom)],
    }
    set(editedOfferIdAtom, undefined)
    set(workingFormAtom, state)
    set(committedFormAtom, state)
    set(offerActiveAtom, true)
  })

  const initLanguagesFromPreferencesActionAtom = atom(null, (get, set) => {
    const savedLanguages = [...get(lastUsedOfferSpokenLanguagesAtom)]
    set(workingFormAtom, (state) => ({
      ...state,
      spokenLanguages: savedLanguages,
    }))
    set(committedFormAtom, (state) => ({
      ...state,
      spokenLanguages: savedLanguages,
    }))
  })

  const initializeValuesForOfferFormActionAtom = atom(
    null,
    (get, set): Effect.Effect<void> => {
      set(initLanguagesFromPreferencesActionAtom)
      return set(initializeAmountTopLimitFromBtcPriceActionAtom)
    }
  )

  const discardChangesActionAtom = atom(null, (get, set) => {
    set(setOfferFormActionAtom, get(editedOfferIdAtom))
  })

  const hasUnsavedChangesAtom = atom((get) => {
    const original = get(singleOfferAtom(get(editedOfferIdAtom)))
    if (!original) return false

    const committed = get(committedFormAtom)
    const originalPublicPart = original.offerInfo.publicPart

    if (
      !deepEqual(
        mergeOfferFormStateIntoPublicPart(committed, originalPublicPart),
        originalPublicPart
      )
    )
      return true

    const originalConnectionLevel =
      original.ownershipInfo?.intendedConnectionLevel ?? 'FIRST'
    if (committed.intendedConnectionLevel !== originalConnectionLevel)
      return true

    const committedClubs = [...committed.selectedClubsUuids].sort()
    const originalClubs = [
      ...(original.ownershipInfo?.intendedClubs ?? []),
    ].sort()
    return !deepEqual(committedClubs, originalClubs)
  })

  return {
    setOfferFormActionAtom,
    resetOfferFormActionAtom,
    initializeValuesForOfferFormActionAtom,
    discardChangesActionAtom,
    hasUnsavedChangesAtom,
  }
}
