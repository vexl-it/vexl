import {
  newOfferId,
  OfferAdminId,
  OfferId,
  SymmetricKey,
  type BtcNetwork,
  type CurrencyCode,
  type ListingType,
  type LocationState,
  type OfferLocation,
  type OfferPublicPart,
  type OfferType,
  type OneOfferInState,
  type PaymentMethod,
  type SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {molecule} from 'bunshi/dist/react'
import {
  atom,
  type Atom,
  type PrimitiveAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'

import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {IdNumeric} from '@vexl-next/domain/src/utility/IdNumeric'
import {
  IsoDatetimeString,
  MINIMAL_DATE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {generateUuid, Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {calculateViewportRadius} from '@vexl-next/domain/src/utility/geoCoordinates'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {Array, Effect, Option, pipe, Record} from 'effect'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {Alert} from 'react-native'
import {symmetricDifference} from 'set-operations'
import {type CRUDOfferStackParamsList} from '../../../navigationTypes'
import {upsertInboxOnBeAndLocallyActionAtom} from '../../../state/chat/hooks/useCreateInbox'
import {clubsWithMembersAtom} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {type ClubWithMembers} from '../../../state/clubs/domain'
import {importedContactsCountAtom} from '../../../state/contacts/atom/contactsStore'
import {
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../../state/currentBtcPriceAtoms'
import {createOfferActionAtom as createOfferFromCompleteDataActionAtom} from '../../../state/marketplace/atoms/createOfferActionAtom'
import {deleteOffersActionAtom} from '../../../state/marketplace/atoms/deleteOffersActionAtom'
import {singleOfferAtom} from '../../../state/marketplace/atoms/offersState'
import {updateOfferActionAtom} from '../../../state/marketplace/atoms/updateOfferActionAtom'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import calculatePriceInFiatFromSats from '../../../utils/calculatePriceInFiatFromSats'
import calculatePriceInSats from '../../../utils/calculatePriceInSats'
import {version} from '../../../utils/environment'
import getDefaultCurrency from '../../../utils/getDefaultCurrency'
import {
  translationAtom,
  type TFunction,
} from '../../../utils/localization/I18nProvider'
import {currencies} from '../../../utils/localization/currency'
import getDefaultSpokenLanguage from '../../../utils/localization/getDefaultSpokenLanguage'
import {navigationRef} from '../../../utils/navigation'
import notEmpty from '../../../utils/notEmpty'
import checkNotificationPermissionsAndAskIfPossibleActionAtom from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import {preferencesAtom} from '../../../utils/preferences'
import reportError from '../../../utils/reportError'
import {
  toCommonErrorMessage,
  type SomeError,
} from '../../../utils/useCommonErrorMessages'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {showErrorAlert} from '../../ErrorAlert'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import {offerProgressModalActionAtoms as progressModal} from '../../UploadingOfferProgressModal/atoms'
import {
  btcOfferScreens,
  otherOfferScreens,
  productOfferScreens,
} from '../domain'
import numberOfFriendsAtom, {
  numberOfFriendsLoadedEffect,
} from './numberOfFriendsAtom'

function getAtomWithNullableValueHandling<T, S>(
  nullableAtom: PrimitiveAtom<T | undefined>,
  atomToSet: PrimitiveAtom<S>,
  propertyToSetInAtom: keyof S
): PrimitiveAtom<T | undefined> {
  return atom(
    (get) => get(nullableAtom),
    (get, set, update: SetStateAction<T | undefined>) => {
      const value = getValueFromSetStateActionOfAtom(update)(() =>
        get(nullableAtom)
      )
      set(nullableAtom, value)
      if (value !== undefined)
        set(atomToSet, (val) => ({...val, [propertyToSetInAtom]: value}))
    }
  )
}

function checkConditionsToCreateOfferAreMetAndAlertIfNot({
  offerForm,
  singlePriceActive,
  t,
}: {
  offerForm: OfferPublicPart
  singlePriceActive: boolean
  t: TFunction
}): boolean {
  const {
    amountBottomLimit,
    currency,
    listingType,
    locationState,
    location,
    offerDescription,
  } = offerForm

  if (!listingType) {
    Alert.alert(t('offerForm.errorListingTypeNotFilled'))
    return false
  }

  if (
    listingType !== 'BITCOIN' &&
    singlePriceActive &&
    amountBottomLimit === 0
  ) {
    Alert.alert(t('offerForm.errorPriceNotFilled'))
    return false
  }

  if (listingType === 'PRODUCT' && locationState.length === 0) {
    Alert.alert(t('offerForm.errorDeliveryMethodNotFilled'))
    return false
  }

  if (
    listingType === 'PRODUCT' &&
    locationState.includes('IN_PERSON') &&
    location.length === 0
  ) {
    Alert.alert(t('offerForm.errorPickupLocationNotFilled'))
    return false
  }

  if (
    listingType === 'BITCOIN' &&
    locationState.includes('IN_PERSON') &&
    location.length === 0
  ) {
    Alert.alert(t('offerForm.errorLocationNotFilled'))
    return false
  }

  if (
    listingType === 'OTHER' &&
    locationState.includes('IN_PERSON') &&
    location.length === 0
  ) {
    Alert.alert(t('offerForm.errorOtherOfferLocationNotFilled'))
    return false
  }

  if (offerDescription.trim() === '') {
    Alert.alert(t('offerForm.errorDescriptionNotFilled'))
    return false
  }

  if (
    currency &&
    listingType !== 'BITCOIN' &&
    singlePriceActive &&
    amountBottomLimit > currencies[currency].maxAmount
  ) {
    Alert.alert(
      t('offerForm.errorExceededLimits', {
        limit: currencies[currency].maxAmount,
        currency,
      })
    )
    return false
  }

  return true
}

function formatOfferPublicPart(publicPart: OfferPublicPart): OfferPublicPart {
  const {
    amountBottomLimit,
    amountTopLimit,
    listingType,
    offerDescription,
    ...restOfPublicPart
  } = publicPart

  return {
    ...restOfPublicPart,
    listingType,
    amountBottomLimit,
    amountTopLimit:
      listingType !== 'BITCOIN' ? amountBottomLimit : amountTopLimit,
    offerDescription: offerDescription.trim(),
  }
}

export function createOfferDummyPublicPart(): OfferPublicPart {
  const defaultCurrency = getDefaultCurrency()
  const amountTopLimit = pipe(
    Array.findFirst(
      Record.values(currencies),
      (currency) => currency.code === defaultCurrency
    ),
    Option.map((currency) => currency.maxAmount),
    Option.getOrElse(() => currencies.USD.maxAmount)
  )

  return {
    offerPublicKey: PublicKeyPemBase64.parse('offerPublicKey'),
    location: [],
    offerDescription: '',
    amountBottomLimit: 0,
    amountTopLimit,
    feeState: 'WITHOUT_FEE',
    feeAmount: 0,
    locationState: ['IN_PERSON'],
    paymentMethod: ['CASH'],
    btcNetwork: ['ON_CHAIN'],
    currency: defaultCurrency,
    offerType: 'SELL',
    spokenLanguages: getDefaultSpokenLanguage(),
    activePriceState: 'NONE',
    activePriceValue: 0,
    activePriceCurrency: defaultCurrency,
    active: true,
    groupUuids: [],
  }
}

export const offerFormMolecule = molecule(() => {
  const dummyOffer: OneOfferInState = {
    ownershipInfo: {
      adminId: OfferAdminId.parse('offerAdminId'),
      intendedConnectionLevel: 'ALL',
      intendedClubs: [],
    },
    flags: {
      reported: false,
    },
    offerInfo: {
      id: IdNumeric.parse(1),
      offerId: OfferId.parse(Uuid.parse(generateUuid())),
      privatePart: {
        commonFriends: [
          HashedPhoneNumber.parse('Mike'),
          HashedPhoneNumber.parse('John'),
        ],
        friendLevel: ['FIRST_DEGREE'],
        symmetricKey: SymmetricKey.parse('symmetricKey'),
        clubIds: [],
      },
      publicPart: createOfferDummyPublicPart(),
      createdAt: IsoDatetimeString.parse(MINIMAL_DATE),
      modifiedAt: IsoDatetimeString.parse(MINIMAL_DATE),
    },
  }

  const offerAtom = atom<OneOfferInState>(dummyOffer)
  const nullableListingTypeAtom = atom<ListingType | undefined>(undefined)
  const nullableOfferTypeAtom = atom<OfferType | undefined>(undefined)
  const nullableCurrencyAtom = atom<CurrencyCode | undefined>(
    dummyOffer.offerInfo.publicPart.currency
  )
  const nullableAmountTopLimitAtom = atom<number | undefined>(
    dummyOffer.offerInfo.publicPart.amountTopLimit
  )
  const nullableAmountBottomLimitAtom = atom<number | undefined>(
    dummyOffer.offerInfo.publicPart.amountBottomLimit
  )
  const nullableBtcNetworkAtom = atom<readonly BtcNetwork[] | undefined>(
    dummyOffer.offerInfo.publicPart.btcNetwork
  )
  const nullablePaymentMethodAtom = atom<readonly PaymentMethod[] | undefined>(
    dummyOffer.offerInfo.publicPart.paymentMethod
  )
  const nullableLocationAtom = atom<readonly OfferLocation[] | undefined>(
    dummyOffer.offerInfo.publicPart.location
  )
  const nullableLocationStateAtom = atom<readonly LocationState[] | undefined>(
    dummyOffer.offerInfo.publicPart.locationState
  )

  const currencySelectVisibleAtom = atom<boolean>(false)

  const showBuySellFieldAtom = atom<boolean>(
    (get) => get(nullableListingTypeAtom) !== undefined
  )

  const showRestOfTheFieldsAtom = atom<boolean>(
    (get) => get(nullableOfferTypeAtom) !== undefined
  )

  const offerFormAtom = focusAtom(offerAtom, (optic) =>
    optic.prop('offerInfo').prop('publicPart')
  )

  const currencyAtom = getAtomWithNullableValueHandling(
    nullableCurrencyAtom,
    offerFormAtom,
    'currency'
  )

  const amountBottomLimitAtom = getAtomWithNullableValueHandling(
    nullableAmountBottomLimitAtom,
    offerFormAtom,
    'amountBottomLimit'
  )

  const amountTopLimitAtom = getAtomWithNullableValueHandling(
    nullableAmountTopLimitAtom,
    offerFormAtom,
    'amountTopLimit'
  )

  const updateCurrencyLimitsAtom = atom<
    null,
    [{currency: CurrencyCode | undefined}],
    boolean
  >(null, (get, set, params) => {
    const {currency = 'USD'} = params
    const currencyFromAtom = get(currencyAtom)
    if (currencyFromAtom === currency) return false

    set(currencyAtom, currency)
    set(amountBottomLimitAtom, 0)
    set(amountTopLimitAtom, currencies[currency].maxAmount)
    return true
  })

  const updateLocationStateAndPaymentMethodAtom = atom(
    null,
    (get, set, locationState: LocationState) => {
      const listingType = get(listingTypeAtom)

      if (!listingType || listingType !== 'PRODUCT') {
        set(locationStateAtom, [locationState])
      } else {
        set(locationStateAtom, (prev) =>
          prev?.includes(locationState)
            ? prev.filter((state) => state !== locationState)
            : [...(prev ?? []), locationState]
        )
      }

      // TODO: after removing compatibility with old vexl apps refactor to ['CASH', 'REVOLUT', 'BANK'] for ['IN_PERSON', 'ONLINE'] delivery method
      set(paymentMethodAtom, () => {
        const locationState = get(locationStateAtom)
        if (
          locationState?.length === 1 &&
          locationState?.includes('IN_PERSON')
        ) {
          return ['CASH']
        }

        return ['BANK', 'REVOLUT']
      })

      if (
        (listingType === 'BITCOIN' && locationState === 'ONLINE') ||
        (listingType === 'PRODUCT' &&
          !get(locationStateAtom)?.includes('IN_PERSON'))
      ) {
        set(locationAtom, [])
      }
    }
  )

  const listingTypeAtom = getAtomWithNullableValueHandling(
    nullableListingTypeAtom,
    offerFormAtom,
    'listingType'
  )

  const offerTypeAtom = getAtomWithNullableValueHandling(
    nullableOfferTypeAtom,
    offerFormAtom,
    'offerType'
  )

  const offerTypeOrDummyValueAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('offerType')
  )

  const spokenLanguagesAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('spokenLanguages')
  )

  const spokenLanguagesAtomsAtom = splitAtom(spokenLanguagesAtom)

  const feeAmountAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('feeAmount')
  )

  const feeStateAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('feeState')
  )

  const locationStateAtom = getAtomWithNullableValueHandling(
    nullableLocationStateAtom,
    offerFormAtom,
    'locationState'
  )

  const locationAtom = getAtomWithNullableValueHandling(
    nullableLocationAtom,
    offerFormAtom,
    'location'
  )

  const btcNetworkAtom = getAtomWithNullableValueHandling(
    nullableBtcNetworkAtom,
    offerFormAtom,
    'btcNetwork'
  )

  const paymentMethodAtom = getAtomWithNullableValueHandling(
    nullablePaymentMethodAtom,
    offerFormAtom,
    'paymentMethod'
  )

  const expirationDateAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('expirationDate')
  )

  const offerDescriptionAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('offerDescription')
  )

  const singlePriceActiveAtom = atom<boolean>(true)

  const toggleSinglePriceActiveAtom = atom(
    (get) => get(singlePriceActiveAtom),
    (get, set) => {
      const isActive = get(singlePriceActiveAtom)
      if (isActive) {
        set(amountBottomLimitAtom, 0)
        set(satsValueAtom, 0)
      }

      set(singlePriceActiveAtom, !isActive)
    }
  )

  const toggleLocationActiveAtom = atom(
    (get) => get(locationStateAtom)?.includes('IN_PERSON'),
    (get, set) => {
      const isActive = get(locationStateAtom)?.includes('IN_PERSON')
      set(
        updateLocationStateAndPaymentMethodAtom,
        isActive ? 'ONLINE' : 'IN_PERSON'
      )
      set(locationAtom, [])
    }
  )

  const offerActiveAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('active')
  )

  const intendedConnectionLevelAtom = focusAtom(
    offerAtom,
    (optic) =>
      optic
        .optional()
        .prop('ownershipInfo')
        .optional()
        .prop('intendedConnectionLevel') ?? 'FIRST'
  )

  const selectedClubsUuidsAtom = atom<readonly ClubUuid[]>([])

  function createSelectClubAtom(
    clubWithMembersAtom: Atom<ClubWithMembers>
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> {
    return atom(
      (get) =>
        get(selectedClubsUuidsAtom)?.includes(
          get(clubWithMembersAtom).club.uuid
        ) ?? false,
      (get, set, isSelected: SetStateAction<boolean>) => {
        const {club} = get(clubWithMembersAtom)

        const selected = getValueFromSetStateActionOfAtom(isSelected)(
          () => get(selectedClubsUuidsAtom)?.includes(club.uuid) ?? false
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

  const updateBtcNetworkAtom = atom(
    (get) => get(btcNetworkAtom),
    (get, set, btcNetwork: BtcNetwork) => {
      set(btcNetworkAtom, (prev) => {
        if (prev?.includes(btcNetwork) && prev.length > 1) {
          return prev.filter((network) => network !== btcNetwork)
        } else if (!prev?.includes(btcNetwork)) {
          return [...(prev ?? []), btcNetwork]
        }

        return prev
      })
    }
  )

  const selectedSpokenLanguagesAtom = atom<SpokenLanguage[]>(
    getDefaultSpokenLanguage()
  )

  const satsValueAtom = atom<number>(0)

  const removeSpokenLanguageActionAtom = atom(
    null,
    (get, set, spokenLanguage: SpokenLanguage) => {
      const spokenLanguages = get(spokenLanguagesAtom)
      const selectedSpokenLanguages = get(selectedSpokenLanguagesAtom)

      if (selectedSpokenLanguages.length > 1) {
        set(
          spokenLanguagesAtom,
          spokenLanguages.filter((language) => language !== spokenLanguage)
        )
        set(
          selectedSpokenLanguagesAtom,
          selectedSpokenLanguages.filter(
            (language) => language !== spokenLanguage
          )
        )
      }
    }
  )

  function createIsThisLanguageSelectedAtom(
    spokenLanguage: SpokenLanguage
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> {
    return atom(
      (get) => get(selectedSpokenLanguagesAtom).includes(spokenLanguage),
      (get, set, isSelected: SetStateAction<boolean>) => {
        const selectedSpokenLanguages = get(selectedSpokenLanguagesAtom)
        const selected = getValueFromSetStateActionOfAtom(isSelected)(() =>
          get(selectedSpokenLanguagesAtom).includes(spokenLanguage)
        )

        if (selected) {
          set(selectedSpokenLanguagesAtom, [
            ...selectedSpokenLanguages,
            spokenLanguage,
          ])
        } else if (selectedSpokenLanguages.length > 1) {
          set(
            selectedSpokenLanguagesAtom,
            selectedSpokenLanguages.filter((lang) => lang !== spokenLanguage)
          )
        }
      }
    )
  }

  const resetSelectedSpokenLanguagesActionAtom = atom(null, (get, set) => {
    set(selectedSpokenLanguagesAtom, get(spokenLanguagesAtom))
  })

  const saveSelectedSpokenLanguagesActionAtom = atom(null, (get, set) => {
    set(spokenLanguagesAtom, get(selectedSpokenLanguagesAtom))
  })

  const setOfferLocationActionAtom = atom(
    null,
    (get, set, locationSuggestion: LocationSuggestion) => {
      const location = get(locationAtom)

      if (
        !location?.some(
          (offerLocation) =>
            offerLocation.placeId === locationSuggestion.userData.placeId
        )
      ) {
        set(locationAtom, [
          ...(location ?? []),
          {
            placeId: locationSuggestion.userData.placeId,
            address:
              locationSuggestion.userData.suggestFirstRow +
              ', ' +
              locationSuggestion.userData.suggestSecondRow,
            shortAddress: locationSuggestion.userData.suggestFirstRow,
            latitude: locationSuggestion.userData.latitude,
            longitude: locationSuggestion.userData.longitude,
            radius: calculateViewportRadius(
              locationSuggestion.userData.viewport
            ),
          },
        ])
      }
    }
  )

  const offerExpirationModalVisibleAtom = atom<boolean>(false)

  const createOfferActionAtom = atom(
    null,
    (get, set): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)
      const importedContactsCount = get(importedContactsCountAtom)
      const singlePriceActive = get(singlePriceActiveAtom)

      if (
        !checkConditionsToCreateOfferAreMetAndAlertIfNot({
          offerForm: get(offerFormAtom),
          singlePriceActive,
          t,
        })
      ) {
        return Effect.succeed(false)
      }

      return Effect.gen(function* (_) {
        const intendedConnectionLevel = get(intendedConnectionLevelAtom)
        const intendedClubs = get(selectedClubsUuidsAtom)
        const {goldenAvatarType} = get(preferencesAtom)
        const payloadPublic = formatOfferPublicPart(get(offerFormAtom))

        const belowProgressLeft = get(modifyOfferLoaderTitleAtom)

        yield* _(set(checkNotificationPermissionsAndAskIfPossibleActionAtom))

        set(progressModal.show, {
          title: t('offerForm.offerEncryption.encryptingYourOffer'),
          belowProgressLeft: belowProgressLeft.loadingText,
          bottomText: t('offerForm.offerEncryption.dontShutDownTheApp'),
          indicateProgress: {type: 'intermediate'},
        })

        const offerId = newOfferId()
        const {inbox} = yield* _(
          set(upsertInboxOnBeAndLocallyActionAtom, {
            for: 'myOffer',
            offerId,
          })
        )

        yield* _(numberOfFriendsLoadedEffect)

        yield* _(
          set(createOfferFromCompleteDataActionAtom, {
            offerId,
            payloadPublic: {
              ...payloadPublic,
              authorClientVersion: version,
              offerPublicKey: inbox.privateKey.publicKeyPemBase64,
              goldenAvatarType,
            },

            intendedConnectionLevel: intendedConnectionLevel ?? 'FIRST',
            intendedClubs: [...intendedClubs],
            onProgress: (progress) => {
              set(progressModal.showStep, {
                progress,
                textData: {
                  title: t('offerForm.offerEncryption.encryptingYourOffer'),
                  belowProgressLeft: belowProgressLeft.loadingText,
                  bottomText: t('offerForm.offerEncryption.dontShutDownTheApp'),
                },
              })
            },
            offerKey: inbox.privateKey,
          })
        )

        yield* _(
          set(progressModal.hideDeffered, {
            data: {
              title: t('offerForm.offerEncryption.doneOfferPoster'),
              bottomText: t(
                'offerForm.offerEncryption.yourFriendsAndFriendsOfFriends'
              ),
              belowProgressLeft: belowProgressLeft.doneText,
              belowProgressRight: t('progressBar.DONE'),
              indicateProgress: {type: 'progress', percentage: 100},
            },
            delayMs: 3000,
          })
        )

        return true
      }).pipe(
        Effect.catchAll((e) => {
          set(progressModal.hide)

          if (e._tag === 'NotificationPrompted') return Effect.succeed(false)

          if (
            e._tag === 'PrivatePayloadsConstructionError' &&
            importedContactsCount === 0
          ) {
            return Effect.zipRight(
              set(askAreYouSureActionAtom, {
                variant: 'danger',
                steps: [
                  {
                    type: 'StepWithText',
                    title: t('offerForm.errorCreatingOffer'),
                    description: t('offerForm.seemsYouHaveReachNoVexlers'),
                    positiveButtonText: t('common.close'),
                  },
                ],
              }).pipe(Effect.ignore),
              Effect.succeed(false)
            )
          }

          if (e._tag === 'PrivatePayloadsConstructionError') {
            return Effect.zipRight(
              set(askAreYouSureActionAtom, {
                variant: 'danger',
                steps: [
                  {
                    type: 'StepWithText',
                    title: t('offerForm.errorCreatingOffer'),
                    description: t(
                      'offerForm.youCurrentlyHaveNoConnectionsForSelectedFriendLevel'
                    ),
                    positiveButtonText: t('postLoginFlow.importContactsButton'),
                    negativeButtonText: t('clubs.joinNewClub'),
                  },
                ],
              }).pipe(
                Effect.match({
                  onSuccess() {
                    if (navigationRef.isReady()) {
                      navigationRef.reset({
                        index: 0,
                        routes: [
                          {
                            name: 'SetContacts',
                          },
                        ],
                      })
                    }
                  },
                  onFailure(error) {
                    if (error._tag === 'UserDeclinedError') {
                      if (navigationRef.isReady()) {
                        navigationRef.navigate('EventsAndClubs', {
                          screen: 'Clubs',
                        })
                      }
                    } else {
                      reportError(
                        'error',
                        new Error('Error in offer creation'),
                        {
                          error,
                        }
                      )
                    }
                  },
                })
              ),
              Effect.succeed(false)
            )
          }

          reportError('error', new Error('Error while creating offer'), {e})

          showErrorAlert({
            title:
              toCommonErrorMessage(e, t) ?? t('offerForm.errorCreatingOffer'),
            error: e,
          })

          return Effect.succeed(false)
        })
      )
    }
  )

  const deleteOfferWithAreYouSureActionAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)
    const offer = get(offerAtom)

    return Effect.gen(function* (_) {
      yield* _(
        set(askAreYouSureActionAtom, {
          variant: 'danger',
          steps: [
            {
              type: 'StepWithText',
              title: t('editOffer.deleteOffer'),
              description: t('editOffer.deleteOfferDescription'),
              positiveButtonText: t('common.yesDelete'),
              negativeButtonText: t('common.nope'),
            },
          ],
        })
      )

      set(loadingOverlayDisplayedAtom, true)

      yield* _(
        set(deleteOffersActionAtom, {
          adminIds: [offer.ownershipInfo?.adminId].filter(notEmpty),
        })
      )

      set(loadingOverlayDisplayedAtom, false)

      return true
    }).pipe(
      Effect.catchAll((e) => {
        if (e._tag !== 'UserDeclinedError')
          showErrorAlert({
            title:
              toCommonErrorMessage(e, t) ?? t('editOffer.errorDeletingOffer'),
            error: e,
          })

        return Effect.succeed(false)
      })
    )
  })

  const modifyOfferLoaderTitleAtom = atom((get) => {
    const {t} = get(translationAtom)
    const numberOfFriends = get(numberOfFriendsAtom)
    // TODO: this value is from state and may not be 100% accurate
    // as we are fetching connections when encrypting offer once more
    const intendedConnectionLevel = get(intendedConnectionLevelAtom)
    const intendedClubs = get(selectedClubsUuidsAtom)
    const offerEncryptedAlsoForClubs = Array.length(intendedClubs) > 0
    const clubsMembersCount = pipe(
      get(clubsWithMembersAtom),
      Array.filterMap((club) =>
        Array.contains(club.club.uuid)(intendedClubs)
          ? Option.some(club.members)
          : Option.none()
      ),
      Array.flatten,
      Array.length
    )

    if (numberOfFriends.state === 'error') {
      return {
        loadingText: t('offerForm.noVexlersFoundForYourOffer'),
        doneText: t('offerForm.noVexlersFoundForYourOffer'),
      }
    }

    if (numberOfFriends.state === 'loading') {
      return {
        loadingText: t('offerForm.loadingNumberOfVexlaks'),
        doneText: t('offerForm.loadingVexlaksDone'),
      }
    }

    const friendsCount =
      intendedConnectionLevel === 'FIRST'
        ? !offerEncryptedAlsoForClubs
          ? numberOfFriends.firstLevelFriendsCount
          : numberOfFriends.firstLevelFriendsCount + clubsMembersCount
        : !offerEncryptedAlsoForClubs
          ? numberOfFriends.firstAndSecondLevelFriendsCount
          : numberOfFriends.firstAndSecondLevelFriendsCount + clubsMembersCount

    return {
      loadingText: t('offerForm.offerEncryption.forVexlers', {
        count: friendsCount,
      }),
      doneText: t('offerForm.offerEncryption.anonymouslyDeliveredToVexlers', {
        count: friendsCount,
      }),
    }
  })

  const toggleOfferActiveAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const targetValue = !get(offerActiveAtom)

      set(offerActiveAtom, targetValue)
      const offer = get(offerAtom)

      if (!offer.ownershipInfo) return

      const belowProgressLeft = get(modifyOfferLoaderTitleAtom)

      set(progressModal.show, {
        title: t('editOffer.editingYourOffer'),
        bottomText: t('editOffer.pleaseWait'),
        belowProgressLeft: targetValue
          ? belowProgressLeft.loadingText
          : t('editOffer.pausingOfferProgress'),
        indicateProgress: {type: 'intermediate'},
      })

      yield* _(
        set(updateOfferActionAtom, {
          payloadPublic: {
            ...offer.offerInfo.publicPart,
            active: targetValue,
          },
          adminId: offer.ownershipInfo.adminId ?? ('' as OfferAdminId),
          symmetricKey: offer.offerInfo.privatePart.symmetricKey,
          intendedConnectionLevel: offer.ownershipInfo
            ? offer.ownershipInfo.intendedConnectionLevel
            : 'FIRST',
          intendedClubs: offer.ownershipInfo.intendedClubs,
          updateFcmCypher: false,
          ...(offer.offerInfo.privatePart.intendedClubs && {
            intendedClubs: [...offer.offerInfo.privatePart.intendedClubs],
          }),
          updatePrivateParts: false,
        })
      )

      yield* _(
        set(progressModal.hideDeffered, {
          data: {
            title: !targetValue
              ? t('editOffer.pausingOfferSuccess')
              : t('editOffer.offerEditSuccess'),
            bottomText: t('editOffer.youCanCheckYourOffer'),
            belowProgressLeft: targetValue
              ? belowProgressLeft.doneText
              : t('editOffer.offerEditSuccess'),
            indicateProgress: {type: 'done'},
          },
          delayMs: 1500,
        })
      )
    }).pipe(
      Effect.match({
        onSuccess: () => true,
        onFailure: (e) => {
          set(offerActiveAtom, !get(offerActiveAtom))
          set(progressModal.hide)
          showErrorAlert({
            title:
              toCommonErrorMessage(e, t) ??
              t('editOffer.offerUnableToChangeOfferActivation'),
            error: e,
          })

          return false
        },
      })
    )
  })

  const editOfferActionAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)
    const singlePriceActive = get(singlePriceActiveAtom)

    if (
      !checkConditionsToCreateOfferAreMetAndAlertIfNot({
        offerForm: get(offerFormAtom),
        singlePriceActive,
        t,
      })
    ) {
      return Effect.succeed(false)
    }

    return Effect.gen(function* (_) {
      const {
        offerInfo: {offerId},
      } = get(offerAtom)
      const offer = get(singleOfferAtom(offerId))
      const intendedConnectionLevel =
        get(intendedConnectionLevelAtom) ?? 'FIRST'
      const intendedClubs = get(selectedClubsUuidsAtom)

      // this should never happen as we are setting the form from existing offer
      if (!offer) {
        return yield* _(
          Effect.fail({
            _tag: 'NotFoundError' as const,
          } satisfies SomeError)
        )
      }

      const targetRecipientsHasChanged =
        intendedConnectionLevel !==
          offer.ownershipInfo?.intendedConnectionLevel ||
        symmetricDifference(
          intendedClubs,
          offer.ownershipInfo?.intendedClubs ?? []
        ).length > 0

      const belowProgressLeft = get(modifyOfferLoaderTitleAtom)

      set(progressModal.show, {
        title: t('editOffer.editingYourOffer'),
        bottomText: t('editOffer.pleaseWait'),
        belowProgressLeft: belowProgressLeft.loadingText,
        indicateProgress: {type: 'intermediate'},
      })

      yield* _(numberOfFriendsLoadedEffect)
      const payloadPublic = formatOfferPublicPart(get(offerFormAtom))

      yield* _(
        set(updateOfferActionAtom, {
          payloadPublic: {
            ...payloadPublic,
            active: true,
          },
          adminId: offer.ownershipInfo?.adminId ?? ('' as OfferAdminId),
          symmetricKey: offer.offerInfo.privatePart.symmetricKey,
          intendedConnectionLevel,
          intendedClubs: [...intendedClubs],
          updateFcmCypher: false,
          updatePrivateParts: targetRecipientsHasChanged,
          onProgress: (progress) => {
            set(progressModal.showStep, {
              progress,
              textData: {
                title: t('offerForm.offerEncryption.encryptingYourOffer'),
                belowProgressLeft: belowProgressLeft.loadingText,
                bottomText: t('offerForm.offerEncryption.dontShutDownTheApp'),
              },
            })
          },
        })
      )

      yield* _(
        set(progressModal.hideDeffered, {
          data: {
            title: t('editOffer.offerEditSuccess'),
            bottomText: t('editOffer.youCanCheckYourOffer'),
            belowProgressLeft: belowProgressLeft.doneText,
            indicateProgress: {type: 'done'},
          },
          delayMs: 2000,
        })
      )
    }).pipe(
      Effect.match({
        onSuccess: () => true,
        onFailure: (e) => {
          set(progressModal.hide)

          showErrorAlert({
            title:
              toCommonErrorMessage(e, t) ?? t('editOffer.errorEditingOffer'),
            error: e,
          })

          return false
        },
      })
    )
  })

  const setOfferFormActionAtom = atom(
    null,
    (get, set, offerId: OfferId | undefined) => {
      const offer = get(singleOfferAtom(offerId))

      if (offer) {
        const offerPublicPart = offer.offerInfo.publicPart

        set(
          calculateSatsValueOnFiatValueChangeActionAtom,
          String(offer.offerInfo.publicPart.amountBottomLimit)
        )

        set(
          singlePriceActiveAtom,
          offerPublicPart.listingType !== 'BITCOIN' &&
            offerPublicPart.amountBottomLimit !== 0 &&
            offerPublicPart.amountTopLimit !== 0
        )

        set(offerAtom, offer)
        set(offerTypeAtom, offerPublicPart.offerType)
        set(listingTypeAtom, offerPublicPart.listingType)
        set(nullableOfferTypeAtom, offerPublicPart.offerType)
        set(nullableCurrencyAtom, offerPublicPart.currency)
        set(nullableAmountTopLimitAtom, offerPublicPart.amountTopLimit)
        set(nullableAmountBottomLimitAtom, offerPublicPart.amountBottomLimit)
        set(nullableBtcNetworkAtom, offerPublicPart.btcNetwork)
        set(nullablePaymentMethodAtom, offerPublicPart.paymentMethod)
        set(nullableLocationAtom, offerPublicPart.location)
        set(nullableLocationStateAtom, offerPublicPart.locationState)
        set(
          selectedClubsUuidsAtom,
          offer.offerInfo.privatePart.intendedClubs ?? []
        )
      }
    }
  )

  const resetOfferFormActionAtom = atom(null, (get, set) => {
    // we want to reset whole offer form except of chosen listing type
    set(offerAtom, dummyOffer)
    set(nullableOfferTypeAtom, undefined)
    set(nullableListingTypeAtom, dummyOffer.offerInfo.publicPart.listingType)
    set(nullableCurrencyAtom, dummyOffer.offerInfo.publicPart.currency)
    set(
      nullableAmountTopLimitAtom,
      dummyOffer.offerInfo.publicPart.amountTopLimit
    )
    set(
      nullableAmountBottomLimitAtom,
      dummyOffer.offerInfo.publicPart.amountBottomLimit
    )
    set(nullableBtcNetworkAtom, dummyOffer.offerInfo.publicPart.btcNetwork)
    set(
      nullablePaymentMethodAtom,
      dummyOffer.offerInfo.publicPart.paymentMethod
    )
    set(nullableLocationAtom, dummyOffer.offerInfo.publicPart.location)
    set(
      nullableLocationStateAtom,
      dummyOffer.offerInfo.publicPart.locationState
    )
  })

  const btcPriceForOfferWithCurrencyAtom =
    createBtcPriceForCurrencyAtom(currencyAtom)

  const calculateSatsValueOnFiatValueChangeActionAtom = atom(
    null,
    (get, set, priceString: string) => {
      if (!priceString || isNaN(Number(priceString))) {
        set(satsValueAtom, 0)
        set(amountBottomLimitAtom, 0)
        return
      }

      const priceNumber = Number(priceString)
      const currentBtcPrice = get(btcPriceForOfferWithCurrencyAtom)?.btcPrice

      set(amountBottomLimitAtom, priceNumber)

      if (currentBtcPrice) {
        set(
          satsValueAtom,
          calculatePriceInSats({
            price: priceNumber,
            currentBtcPrice: currentBtcPrice.BTC,
          }) ?? 0
        )
      }
    }
  )

  const calculateFiatValueOnSatsValueChangeActionAtom = atom(
    null,
    (get, set, satsString: string) => {
      if (!satsString || isNaN(Number(satsString))) {
        set(amountBottomLimitAtom, 0)
        set(satsValueAtom, 0)
        return
      }

      const satsNumber = Number(satsString)
      const currentBtcPrice = get(btcPriceForOfferWithCurrencyAtom)?.btcPrice

      set(satsValueAtom, satsNumber)

      if (currentBtcPrice) {
        set(
          amountBottomLimitAtom,
          calculatePriceInFiatFromSats({
            satsNumber,
            currentBtcPrice: currentBtcPrice.BTC,
          })
        )
      }
    }
  )

  const changePriceCurrencyActionAtom = atom(
    null,
    (get, set, currencyCode: CurrencyCode) => {
      set(currencyAtom, currencyCode)
      set(updateCurrencyLimitsAtom, {currency: currencyCode})

      void set(refreshBtcPriceActionAtom, currencyCode)().then((success) => {
        if (success) {
          set(
            calculateFiatValueOnSatsValueChangeActionAtom,
            String(get(satsValueAtom))
          )
        }
      })
    }
  )

  const updateListingTypeActionAtom = atom(
    null,
    (get, set, listingType: ListingType | undefined) => {
      const amountBottomLimit = get(amountBottomLimitAtom)
      const locationState = get(locationStateAtom)

      set(listingTypeAtom, listingType)

      if (
        (listingType === 'BITCOIN' || listingType === 'PRODUCT') &&
        locationState?.length === 0
      ) {
        set(updateLocationStateAndPaymentMethodAtom, 'IN_PERSON')
      }

      if (
        listingType === 'BITCOIN' &&
        locationState?.includes('IN_PERSON') &&
        locationState?.includes('ONLINE')
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
        set(singlePriceActiveAtom, true)
      }
    }
  )

  const currentStepInOfferCreationAtom = atom<keyof CRUDOfferStackParamsList>(
    'ListingAndOfferType'
  )

  const dontAllowNavigationToNextStepAndReturnReasonAtom = atom((get) => {
    const currentStepInOfferCreation = get(currentStepInOfferCreationAtom)
    const offerType = get(offerTypeAtom)
    const listingType = get(listingTypeAtom)
    const locationState = get(locationStateAtom)
    const location = get(locationAtom)
    const singlePriceActive = get(singlePriceActiveAtom)
    const amountBottomLimit = get(amountBottomLimitAtom)
    const currency = get(currencyAtom)

    const noListingType =
      currentStepInOfferCreation === 'ListingAndOfferType' && !listingType

    if (noListingType) return 'errorListingTypeNotFilled'

    const noOfferType =
      currentStepInOfferCreation === 'ListingAndOfferType' && !offerType

    if (noOfferType) return 'errorOfferTypeNotFilled'

    const noOfferDescription =
      currentStepInOfferCreation ===
        'OfferDescriptionAndSpokenLanguagesScreen' &&
      get(offerDescriptionAtom).trim() === ''

    if (noOfferDescription) return 'errorDescriptionNotFilled'

    const noLocationForInPersonOffer =
      currentStepInOfferCreation === 'LocationPaymentMethodAndNetworkScreen' &&
      locationState?.includes('IN_PERSON') &&
      location?.length === 0

    if (noLocationForInPersonOffer) return 'errorLocationNotFilled'

    const priceNotFilled =
      currentStepInOfferCreation === 'PriceScreen' &&
      listingType !== 'BITCOIN' &&
      singlePriceActive &&
      amountBottomLimit === 0

    if (priceNotFilled) return 'errorPriceNotFilled'

    const deliveryMethodNotFilled =
      currentStepInOfferCreation === 'DeliveryMethodAndNetworkScreen' &&
      listingType === 'PRODUCT' &&
      locationState?.length === 0

    if (deliveryMethodNotFilled) return 'errorDeliveryMethodNotFilled'

    const pickupLocationNotFilled =
      (currentStepInOfferCreation === 'DeliveryMethodAndNetworkScreen' &&
        listingType === 'PRODUCT' &&
        locationState?.includes('IN_PERSON') &&
        location?.length === 0) ??
      false

    if (pickupLocationNotFilled) return 'errorPickupLocationNotFilled'

    const exceededLimit =
      ((currentStepInOfferCreation === 'CurrencyAndAmount' ||
        currentStepInOfferCreation === 'PriceScreen') &&
        currency &&
        listingType !== 'BITCOIN' &&
        singlePriceActive &&
        amountBottomLimit &&
        amountBottomLimit > currencies[currency].maxAmount) ??
      false

    if (exceededLimit) return 'errorExceededLimits'

    return undefined
  })

  const emitAlertBasedOnCurrentStepIfAnyAtom = atom(null, (get) => {
    const {t} = get(translationAtom)
    const currency = get(currencyAtom) ?? 'USD'
    const reason = get(dontAllowNavigationToNextStepAndReturnReasonAtom)

    if (reason === 'errorExceededLimits')
      Alert.alert(
        t(`offerForm.${reason}`, {
          limit: currencies[currency].maxAmount,
          currency,
        })
      )
    else if (reason) Alert.alert(t(`offerForm.${reason}`))
  })

  const screensBasedOnListingTypeAtom = atom((get) => {
    const listingType = get(listingTypeAtom)

    return listingType === 'BITCOIN'
      ? btcOfferScreens
      : listingType === 'PRODUCT'
        ? productOfferScreens
        : listingType === 'OTHER'
          ? otherOfferScreens
          : []
  })

  return {
    offerAtom,
    showBuySellFieldAtom,
    showRestOfTheFieldsAtom,
    offerFormAtom,
    deleteOfferWithAreYouSureActionAtom,
    intendedConnectionLevelAtom,
    modifyOfferLoaderTitleAtom,
    toggleOfferActiveAtom,
    editOfferActionAtom,
    createOfferActionAtom,
    currencyAtom,
    amountBottomLimitAtom,
    amountTopLimitAtom,
    listingTypeAtom,
    offerTypeAtom,
    feeAmountAtom,
    feeStateAtom,
    locationStateAtom,
    locationAtom,
    expirationDateAtom,
    offerExpirationModalVisibleAtom,
    paymentMethodAtom,
    offerDescriptionAtom,
    toggleSinglePriceActiveAtom,
    toggleLocationActiveAtom,
    offerActiveAtom,
    updateCurrencyLimitsAtom,
    updateLocationStateAndPaymentMethodAtom,
    resetOfferFormActionAtom,
    setOfferLocationActionAtom,
    offerTypeOrDummyValueAtom,
    spokenLanguagesAtom,
    spokenLanguagesAtomsAtom,
    removeSpokenLanguageActionAtom,
    createIsThisLanguageSelectedAtom,
    selectedSpokenLanguagesAtom,
    resetSelectedSpokenLanguagesActionAtom,
    saveSelectedSpokenLanguagesActionAtom,
    setOfferFormActionAtom,
    satsValueAtom,
    btcPriceForOfferWithCurrencyAtom,
    calculateSatsValueOnFiatValueChangeActionAtom,
    calculateFiatValueOnSatsValueChangeActionAtom,
    changePriceCurrencyActionAtom,
    updateListingTypeActionAtom,
    updateBtcNetworkAtom,
    currentStepInOfferCreationAtom,
    dontAllowNavigationToNextStepAndReturnReasonAtom,
    emitAlertBasedOnCurrentStepIfAnyAtom,
    screensBasedOnListingTypeAtom,
    currencySelectVisibleAtom,
    createSelectClubAtom,
    selectedClubsUuidsAtom,
  }
})
