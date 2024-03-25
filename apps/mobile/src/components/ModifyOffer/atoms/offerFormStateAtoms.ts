import {
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
  type SinglePriceState,
  type SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {molecule} from 'bunshi/dist/react'
import {
  atom,
  type PrimitiveAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'

import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {IdNumeric} from '@vexl-next/domain/src/utility/IdNumeric'
import {
  IsoDatetimeString,
  MINIMAL_DATE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Uuid, generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {calculateViewportRadius} from '@vexl-next/domain/src/utility/geoCoordinates'
import {generateKeyPair} from '@vexl-next/resources-utils/src/utils/crypto'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {Alert} from 'react-native'
import {createInboxAtom} from '../../../state/chat/hooks/useCreateInbox'
import {
  SATOSHIS_IN_BTC,
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../../state/currentBtcPriceAtoms'
import {
  createOfferAtom,
  deleteOffersActionAtom,
  updateOfferAtom,
} from '../../../state/marketplace'
import {singleOfferAtom} from '../../../state/marketplace/atoms/offersState'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import calculatePriceInSats from '../../../utils/calculatePriceInSats'
import getDefaultCurrency from '../../../utils/getDefaultCurrency'
import {
  translationAtom,
  type TFunction,
} from '../../../utils/localization/I18nProvider'
import {currencies} from '../../../utils/localization/currency'
import getDefaultSpokenLanguage from '../../../utils/localization/getDefaultSpokenLanguage'
import notEmpty from '../../../utils/notEmpty'
import reportError from '../../../utils/reportError'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {offerProgressModalActionAtoms as progressModal} from '../../UploadingOfferProgressModal/atoms'
import numberOfFriendsAtom from './numberOfFriendsAtom'

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
      if (value)
        set(atomToSet, (val) => ({...val, [propertyToSetInAtom]: value}))
    }
  )
}

function checkConditionsToCreateOfferAreMetAndAlertIfNot({
  offerForm,
  t,
}: {
  offerForm: OfferPublicPart
  t: TFunction
}): boolean {
  const {
    amountBottomLimit,
    currency,
    listingType,
    singlePriceState,
    locationState,
    location,
    offerDescription,
  } = offerForm

  if (
    listingType !== 'BITCOIN' &&
    singlePriceState === 'HAS_COST' &&
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

  if (offerDescription.trim() === '') {
    Alert.alert(t('offerForm.errorDescriptionNotFilled'))
    return false
  }

  if (
    currency &&
    listingType !== 'BITCOIN' &&
    singlePriceState === 'HAS_COST' &&
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
    location,
    locationState,
    offerDescription,
    paymentMethod,
    ...restOfPublicPart
  } = publicPart

  return {
    ...restOfPublicPart,
    listingType,
    amountBottomLimit,
    amountTopLimit:
      listingType !== 'BITCOIN' ? amountBottomLimit : amountTopLimit,
    offerDescription: offerDescription.trim(),
    // TODO: old Vexl app versions compatibility fix
    // remove later
    locationState:
      listingType === 'OTHER' && location.length === 0
        ? ['ONLINE']
        : locationState,
    paymentMethod:
      listingType === 'OTHER' && location.length === 0
        ? ['BANK', 'REVOLUT']
        : paymentMethod,
    location,
  }
}

export function createOfferDummyPublicPart(): OfferPublicPart {
  const defaultCurrency = getDefaultCurrency()

  return {
    offerPublicKey: PublicKeyPemBase64.parse('offerPublicKey'),
    location: [],
    offerDescription: '',
    amountBottomLimit: 0,
    amountTopLimit: defaultCurrency.maxAmount ?? currencies.USD.maxAmount,
    feeState: 'WITHOUT_FEE',
    feeAmount: 0,
    locationState: ['IN_PERSON'],
    paymentMethod: ['CASH'],
    btcNetwork: ['ON_CHAIN'],
    currency: defaultCurrency.code ?? currencies.USD.code,
    offerType: 'SELL',
    spokenLanguages: getDefaultSpokenLanguage(),
    activePriceState: 'NONE',
    activePriceValue: 0,
    activePriceCurrency: defaultCurrency.code ?? currencies.USD.code,
    active: true,
    groupUuids: [],
    listingType: 'BITCOIN',
    singlePriceState: 'HAS_COST',
  }
}

export const dummyOffer: OneOfferInState = {
  ownershipInfo: {
    adminId: OfferAdminId.parse('offerAdminId'),
    intendedConnectionLevel: 'ALL',
  },
  flags: {
    reported: false,
  },
  offerInfo: {
    id: IdNumeric.parse(1),
    offerId: OfferId.parse(Uuid.parse(generateUuid())),
    privatePart: {
      commonFriends: ['Mike', 'John'],
      friendLevel: ['FIRST_DEGREE'],
      symmetricKey: SymmetricKey.parse('symmetricKey'),
    },
    publicPart: createOfferDummyPublicPart(),
    createdAt: IsoDatetimeString.parse(MINIMAL_DATE),
    modifiedAt: IsoDatetimeString.parse(MINIMAL_DATE),
  },
}

export const offerFormMolecule = molecule(() => {
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
  const nullableBtcNetworkAtom = atom<BtcNetwork[] | undefined>(
    dummyOffer.offerInfo.publicPart.btcNetwork
  )
  const nullablePaymentMethodAtom = atom<PaymentMethod[] | undefined>(
    dummyOffer.offerInfo.publicPart.paymentMethod
  )
  const nullableLocationAtom = atom<OfferLocation[] | undefined>(
    dummyOffer.offerInfo.publicPart.location
  )
  const nullableLocationStateAtom = atom<LocationState[] | undefined>(
    dummyOffer.offerInfo.publicPart.locationState
  )
  const nullableSinglePriceStateAtom = atom<SinglePriceState | undefined>(
    dummyOffer.offerInfo.publicPart.singlePriceState
  )

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

      if (listingType === 'BITCOIN') {
        set(locationStateAtom, [locationState])
      } else {
        set(locationStateAtom, (prev) =>
          prev?.includes(locationState)
            ? prev.filter((state) => state !== locationState)
            : [...(prev ?? []), locationState]
        )
      }

      set(
        paymentMethodAtom,
        locationState === 'ONLINE' ? ['BANK', 'REVOLUT'] : ['CASH']
      )
      set(locationAtom, [])
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

  const singlePriceStateAtom = getAtomWithNullableValueHandling(
    nullableSinglePriceStateAtom,
    offerFormAtom,
    'singlePriceState'
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

  const createOfferActionAtom = atom(null, (get, set): T.Task<boolean> => {
    const {t} = get(translationAtom)

    if (
      !checkConditionsToCreateOfferAreMetAndAlertIfNot({
        offerForm: get(offerFormAtom),
        t,
      })
    ) {
      return T.of(false)
    }

    const intendedConnectionLevel = get(intendedConnectionLevelAtom)
    const belowProgressLeft = get(modifyOfferLoaderTitleAtom)
    const payloadPublic = formatOfferPublicPart(get(offerFormAtom))

    set(progressModal.show, {
      title: t('offerForm.offerEncryption.encryptingYourOffer'),
      belowProgressLeft: belowProgressLeft.loadingText,
      bottomText: t('offerForm.offerEncryption.dontShutDownTheApp'),
      indicateProgress: {type: 'intermediate'},
    })

    return pipe(
      generateKeyPair(),
      TE.fromEither,
      TE.bindTo('key'),
      TE.bindW('createdOffer', ({key}) =>
        set(createOfferAtom, {
          payloadPublic: {
            ...payloadPublic,
            offerPublicKey: key.publicKeyPemBase64,
          },
          intendedConnectionLevel: intendedConnectionLevel ?? 'FIRST',
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
      ),
      TE.chainFirstW(({key, createdOffer}) =>
        set(createInboxAtom, {
          inbox: {
            privateKey: key,
            offerId: createdOffer.offerInfo.offerId,
          },
        })
      ),
      TE.matchEW(
        (e) => {
          set(progressModal.hide)
          if (e._tag !== 'NetworkError')
            reportError('error', new Error('Error while creating offer'), {e})
          showErrorAlert({
            title:
              toCommonErrorMessage(e, t) ?? t('offerForm.errorCreatingOffer'),
            error: e,
          })
          return T.of(false)
        },
        () => {
          return pipe(
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
            }),
            T.map(() => true)
          )
        }
      )
    )
  })

  const deleteOfferActionAtom = atom<null, [], T.Task<boolean>>(
    null,
    (get, set) => {
      const {t} = get(translationAtom)
      const offer = get(offerAtom)

      return pipe(
        set(deleteOffersActionAtom, {
          adminIds: [offer.ownershipInfo?.adminId].filter(notEmpty),
        }),
        TE.match(
          (e) => {
            showErrorAlert({
              title:
                toCommonErrorMessage(e, t) ?? t('editOffer.errorDeletingOffer'),
              error: e,
            })
            return false
          },
          (result) => {
            return result.success
          }
        )
      )
    }
  )

  const modifyOfferLoaderTitleAtom = atom((get) => {
    const {t} = get(translationAtom)
    const numberOfFriends = get(numberOfFriendsAtom)
    const intendedConnectionLevel = get(intendedConnectionLevelAtom)

    return pipe(
      numberOfFriends,
      E.match(
        (e) => {
          if (e._tag !== 'friendsNotLoaded') {
            showErrorAlert({
              title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
              error: e,
            })
          }

          return {
            loadingText: t('offerForm.noVexlersFoundForYourOffer'),
            doneText: t('offerForm.noVexlersFoundForYourOffer'),
          }
        },
        (r) => {
          return {
            loadingText: t('offerForm.offerEncryption.forVexlers', {
              count:
                intendedConnectionLevel === 'FIRST'
                  ? r.firstLevelFriendsCount
                  : r.secondLevelFriendsCount,
            }),
            doneText: t(
              'offerForm.offerEncryption.anonymouslyDeliveredToVexlers',
              {
                count:
                  intendedConnectionLevel === 'FIRST'
                    ? r.firstLevelFriendsCount
                    : r.secondLevelFriendsCount,
              }
            ),
          }
        }
      )
    )
  })

  const toggleOfferActiveAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)
    const offer = get(offerAtom)
    const belowProgressLeft = get(modifyOfferLoaderTitleAtom)

    const targetValue = !offer.offerInfo.publicPart.active

    set(progressModal.show, {
      title: t('editOffer.editingYourOffer'),
      bottomText: t('editOffer.pleaseWait'),
      belowProgressLeft: targetValue
        ? belowProgressLeft.loadingText
        : t('editOffer.pausingOfferProgress'),
      indicateProgress: {type: 'intermediate'},
    })

    return pipe(
      set(updateOfferAtom, {
        payloadPublic: {
          ...offer.offerInfo.publicPart,
          active: targetValue,
        },
        adminId: offer.ownershipInfo?.adminId ?? ('' as OfferAdminId),
        symmetricKey: offer.offerInfo.privatePart.symmetricKey,
        intendedConnectionLevel: offer.ownershipInfo
          ? offer.ownershipInfo.intendedConnectionLevel
          : 'FIRST',
      }),
      TE.matchE(
        (e) => {
          set(progressModal.hide)
          showErrorAlert({
            title:
              toCommonErrorMessage(e, t) ??
              t('editOffer.offerUnableToChangeOfferActivation'),
            error: e,
          })
          return T.of(false)
        },
        () => {
          return pipe(
            T.Do,
            T.chain(() =>
              set(progressModal.hideDeffered, {
                data: {
                  title: t('editOffer.offerEditSuccess'),
                  bottomText: t('editOffer.youCanCheckYourOffer'),
                  belowProgressLeft: targetValue
                    ? belowProgressLeft.doneText
                    : t('editOffer.pausingOfferSuccess'),
                  indicateProgress: {type: 'done'},
                },
                delayMs: 2000,
              })
            ),
            T.map(() => true)
          )
        }
      )
    )
  })

  const editOfferAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)
    const offer = get(offerAtom)

    const intendedConnectionLevel = get(intendedConnectionLevelAtom)
    const belowProgressLeft = get(modifyOfferLoaderTitleAtom)

    if (
      !checkConditionsToCreateOfferAreMetAndAlertIfNot({
        offerForm: get(offerFormAtom),
        t,
      })
    ) {
      return T.of(false)
    }

    const payloadPublic = formatOfferPublicPart(get(offerFormAtom))

    set(progressModal.show, {
      title: t('editOffer.editingYourOffer'),
      bottomText: t('editOffer.pleaseWait'),
      belowProgressLeft: belowProgressLeft.loadingText,
      indicateProgress: {type: 'intermediate'},
    })

    return pipe(
      set(updateOfferAtom, {
        payloadPublic,
        adminId: offer.ownershipInfo?.adminId ?? ('' as OfferAdminId),
        symmetricKey: offer.offerInfo.privatePart.symmetricKey,
        intendedConnectionLevel: intendedConnectionLevel ?? 'FIRST',
      }),
      TE.matchE(
        (e) => {
          set(progressModal.hide)
          showErrorAlert({
            title:
              toCommonErrorMessage(e, t) ?? t('editOffer.errorEditingOffer'),
            error: e,
          })
          return T.of(false)
        },
        () => {
          return pipe(
            T.Do,
            T.chain(() =>
              set(progressModal.hideDeffered, {
                data: {
                  title: t('editOffer.offerEditSuccess'),
                  bottomText: t('editOffer.youCanCheckYourOffer'),
                  belowProgressLeft: belowProgressLeft.doneText,
                  indicateProgress: {type: 'done'},
                },
                delayMs: 2000,
              })
            ),
            T.map(() => true)
          )
        }
      )
    )
  })

  const setOfferFormActionAtom = atom(null, (get, set, offerId: OfferId) => {
    const offer = get(singleOfferAtom(offerId))

    if (offer) {
      const offerPublicPart = offer.offerInfo.publicPart

      set(
        calculateSatsValueOnFiatValueChangeActionAtom,
        String(offer.offerInfo.publicPart.amountTopLimit)
      )

      set(offerAtom, offer)
      set(offerTypeAtom, offerPublicPart.offerType)
      set(listingTypeAtom, offerPublicPart.listingType ?? 'BITCOIN')
      set(nullableOfferTypeAtom, offerPublicPart.offerType)
      set(nullableCurrencyAtom, offerPublicPart.currency)
      set(nullableAmountTopLimitAtom, offerPublicPart.amountTopLimit)
      set(nullableAmountBottomLimitAtom, offerPublicPart.amountBottomLimit)
      set(nullableBtcNetworkAtom, offerPublicPart.btcNetwork)
      set(nullablePaymentMethodAtom, offerPublicPart.paymentMethod)
      set(nullableLocationAtom, offerPublicPart.location)
      set(nullableSinglePriceStateAtom, offerPublicPart.singlePriceState)
    }
  })

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
          calculatePriceInSats({price: priceNumber, currentBtcPrice}) ?? 0
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
          Math.round(currentBtcPrice * (satsNumber / SATOSHIS_IN_BTC))
        )
      }
    }
  )

  const changePriceCurrencyActionAtom = atom(
    null,
    (get, set, currencyCode: CurrencyCode) => {
      set(currencyAtom, currencyCode)
      set(updateCurrencyLimitsAtom, {currency: currencyCode})
      void set(refreshBtcPriceActionAtom, currencyCode)()
    }
  )

  const updateListingTypeActionAtom = atom(
    null,
    (get, set, listingType: ListingType | undefined) => {
      const amountBottomLimit = get(amountBottomLimitAtom)
      const location = get(locationAtom)
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
        set(locationStateAtom, ['IN_PERSON'])
        set(paymentMethodAtom, ['CASH'])
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

      if (listingType === 'OTHER' && location?.length === 0) {
        set(locationStateAtom, [])
        set(
          paymentMethodAtom,
          locationState?.length === 1 && locationState?.includes('ONLINE')
            ? ['BANK', 'REVOLUT']
            : ['CASH']
        )
      }
    }
  )

  return {
    offerAtom,
    showBuySellFieldAtom,
    showRestOfTheFieldsAtom,
    offerFormAtom,
    deleteOfferActionAtom,
    intendedConnectionLevelAtom,
    modifyOfferLoaderTitleAtom,
    toggleOfferActiveAtom,
    editOfferAtom,
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
    btcNetworkAtom,
    paymentMethodAtom,
    offerDescriptionAtom,
    singlePriceStateAtom,
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
  }
})
