import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type BtcNetwork,
  type FeeState,
  type ListingType,
  type LocationState,
  type OfferLocation,
  type PaymentMethod,
  type ProductCategory,
  type SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe} from 'effect'
import {
  atom,
  type Atom,
  type PrimitiveAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import {type ClubWithMembers} from '../../../state/clubs/domain'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'

export interface OfferFormFieldActionAtoms {
  readonly updateListingTypeActionAtom: WritableAtom<
    null,
    [ListingType | undefined],
    void
  >
  readonly updateLocationStateAndPaymentMethodAtom: WritableAtom<
    null,
    [LocationState],
    void
  >
  readonly removeLocationActionAtom: WritableAtom<null, [string], void>
  readonly discardLocationIfNotInPersonActionAtom: WritableAtom<null, [], void>
  readonly updateBtcNetworkAtom: WritableAtom<
    readonly BtcNetwork[],
    [BtcNetwork],
    void
  >
  readonly toggleLanguageActionAtom: WritableAtom<null, [SpokenLanguage], void>
  readonly selectProductCategoryActionAtom: WritableAtom<
    null,
    [ProductCategory],
    void
  >
  readonly createSelectClubAtom: (
    clubWithMembersAtom: Atom<ClubWithMembers>
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
}

export function createOfferFormFieldActionAtoms({
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
  calculateSatsValueOnFiatValueChangeActionAtom,
}: {
  listingTypeAtom: PrimitiveAtom<ListingType | undefined>
  feeAmountAtom: PrimitiveAtom<number>
  feeStateAtom: PrimitiveAtom<FeeState>
  amountBottomLimitAtom: PrimitiveAtom<number>
  btcNetworkAtom: PrimitiveAtom<readonly BtcNetwork[]>
  paymentMethodAtom: PrimitiveAtom<readonly PaymentMethod[]>
  locationAtom: PrimitiveAtom<readonly OfferLocation[]>
  locationStateAtom: PrimitiveAtom<readonly LocationState[]>
  productCategoriesAtom: PrimitiveAtom<readonly ProductCategory[] | undefined>
  spokenLanguagesAtom: PrimitiveAtom<readonly SpokenLanguage[]>
  selectedClubsUuidsAtom: PrimitiveAtom<readonly ClubUuid[]>
  calculateSatsValueOnFiatValueChangeActionAtom: WritableAtom<
    null,
    [string],
    void
  >
}): OfferFormFieldActionAtoms {
  const updateLocationStateAndPaymentMethodAtom = atom(
    null,
    (get, set, locationState: LocationState) => {
      set(locationStateAtom, [locationState])

      // TODO: after removing compatibility with old vexl apps refactor to ['CASH', 'REVOLUT', 'BANK'] for ['IN_PERSON', 'ONLINE'] delivery method
      set(
        paymentMethodAtom,
        locationState === 'IN_PERSON' ? ['CASH'] : ['BANK', 'REVOLUT']
      )
    }
  )

  const updateListingTypeActionAtom = atom(
    null,
    (get, set, listingType: ListingType | undefined) => {
      const amountBottomLimit = get(amountBottomLimitAtom)
      const locationState = get(locationStateAtom)

      set(listingTypeAtom, listingType)

      if (listingType !== 'BITCOIN') {
        set(feeAmountAtom, 0)
        set(feeStateAtom, 'WITHOUT_FEE')
      }

      if (listingType !== 'PRODUCT') {
        set(productCategoriesAtom, undefined)
      }

      if (
        (listingType === 'BITCOIN' || listingType === 'PRODUCT') &&
        locationState.length === 0
      ) {
        set(updateLocationStateAndPaymentMethodAtom, 'IN_PERSON')
      }

      if (
        listingType === 'BITCOIN' &&
        locationState.includes('IN_PERSON') &&
        locationState.includes('ONLINE')
      ) {
        set(updateLocationStateAndPaymentMethodAtom, 'IN_PERSON')
      }

      if (
        (listingType === 'PRODUCT' || listingType === 'OTHER') &&
        amountBottomLimit
      ) {
        set(
          calculateSatsValueOnFiatValueChangeActionAtom,
          String(amountBottomLimit)
        )
      }
    }
  )

  const removeLocationActionAtom = atom(null, (get, set, placeId: string) => {
    set(locationAtom, (prev) =>
      pipe(
        prev,
        Array.filter((loc) => loc.placeId !== placeId)
      )
    )
  })

  const discardLocationIfNotInPersonActionAtom = atom(null, (get, set) => {
    const locationState = get(locationStateAtom)
    const location = get(locationAtom)

    if (
      Array.isNonEmptyReadonlyArray(location) &&
      !pipe(
        locationState,
        Array.some((state) => state === 'IN_PERSON')
      )
    ) {
      set(locationAtom, [])
    }
  })

  const updateBtcNetworkAtom = atom(
    (get) => get(btcNetworkAtom),
    (get, set, btcNetwork: BtcNetwork) => {
      set(btcNetworkAtom, (prev) => {
        if (prev.includes(btcNetwork) && prev.length > 1) {
          return pipe(
            prev,
            Array.filter((network) => network !== btcNetwork)
          )
        } else if (!prev.includes(btcNetwork)) {
          return [...prev, btcNetwork]
        }

        return prev
      })
    }
  )

  const toggleLanguageActionAtom = atom(
    null,
    (get, set, language: SpokenLanguage) => {
      const selected = get(spokenLanguagesAtom)
      if (selected.includes(language)) {
        if (selected.length > 1) {
          set(
            spokenLanguagesAtom,
            pipe(
              selected,
              Array.filter((lang) => lang !== language)
            )
          )
        }
      } else {
        set(spokenLanguagesAtom, [...selected, language])
      }
    }
  )

  const selectProductCategoryActionAtom = atom(
    null,
    (get, set, category: ProductCategory) => {
      const currentFirst = pipe(
        Option.fromNullable(get(productCategoriesAtom)),
        Option.flatMap(Array.head)
      )
      if (Option.getOrUndefined(currentFirst) === category) {
        set(productCategoriesAtom, undefined)
      } else {
        set(productCategoriesAtom, [category])
      }
    }
  )

  function createSelectClubAtom(
    clubWithMembersAtom: Atom<ClubWithMembers>
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> {
    return atom(
      (get) =>
        get(selectedClubsUuidsAtom).includes(
          get(clubWithMembersAtom).club.uuid
        ),
      (get, set, isSelected: SetStateAction<boolean>) => {
        const {club} = get(clubWithMembersAtom)

        const selected = getValueFromSetStateActionOfAtom(isSelected)(() =>
          get(selectedClubsUuidsAtom).includes(club.uuid)
        )

        set(selectedClubsUuidsAtom, (value) => {
          const newValue = new Set(value)
          if (selected) newValue.add(club.uuid)
          else newValue.delete(club.uuid)
          return Array.fromIterable(newValue)
        })
      }
    )
  }

  return {
    updateListingTypeActionAtom,
    updateLocationStateAndPaymentMethodAtom,
    removeLocationActionAtom,
    discardLocationIfNotInPersonActionAtom,
    updateBtcNetworkAtom,
    toggleLanguageActionAtom,
    selectProductCategoryActionAtom,
    createSelectClubAtom,
  }
}
