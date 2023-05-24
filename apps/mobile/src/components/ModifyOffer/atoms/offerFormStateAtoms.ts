import {atom} from 'jotai'
import {
  type Currency,
  type IntendedConnectionLevel,
  type LocationState,
  OfferId,
  type OfferPublicPart,
  SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {createScope, molecule} from 'jotai-molecules'
import {type OneOfferInState} from '../../../state/marketplace/domain'
import {OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {IdNumeric} from '@vexl-next/domain/dist/utility/IdNumeric'
import {IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import {Alert} from 'react-native'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {
  createOfferAtom,
  deleteOffersActionAtom,
  updateOfferAtom,
} from '../../../state/marketplace'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import numberOfFriendsAtom from './numberOfFriendsAtom'
import * as E from 'fp-ts/Either'
import {generateKeyPair} from '@vexl-next/resources-utils/dist/utils/crypto'
import {createInboxAtom} from '../../../state/chat/hooks/useCreateInbox'
import {delayInPipeT} from '../../../utils/fpUtils'
import {generateUuid, Uuid} from '@vexl-next/domain/dist/utility/Uuid.brand'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {focusAtom} from 'jotai-optics'
import notEmpty from '../../../utils/notEmpty'
import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/dist/offers/OfferEncryptionProgress'

export function createOfferDummyPublicPart(): OfferPublicPart {
  return {
    offerPublicKey: PublicKeyPemBase64.parse('offerPublicKey'),
    location: [],
    offerDescription: '',
    amountBottomLimit: 0,
    amountTopLimit: 250000,
    feeState: 'WITHOUT_FEE',
    feeAmount: 0,
    locationState: 'IN_PERSON',
    paymentMethod: ['CASH'],
    btcNetwork: ['ON_CHAIN'],
    currency: 'CZK',
    offerType: 'SELL',
    activePriceState: 'NONE',
    activePriceValue: 0,
    activePriceCurrency: 'CZK',
    active: true,
    groupUuids: [],
  }
}

export interface OfferProgressState {
  currentState: OfferEncryptionProgress['type']
  percentage?: {
    total: number
    current: number
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
    createdAt: IsoDatetimeString.parse('1970-01-01T00:00:00.000Z'),
    modifiedAt: IsoDatetimeString.parse('1970-01-01T00:00:00.000Z'),
  },
}

export const OfferFormScope = createScope<OneOfferInState | 'newOfferCreation'>(
  dummyOffer
)

export const offerFormMolecule = molecule((getMolecule, getScope) => {
  const offer = (() => {
    const scope = getScope(OfferFormScope)
    if (scope === 'newOfferCreation') return dummyOffer
    return scope
  })()

  const offerFormAtom = atom(offer.offerInfo.publicPart)

  const currencyAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('currency')
  )

  const amountBottomLimitAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('amountBottomLimit')
  )

  const amountTopLimitAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('amountTopLimit')
  )

  const amountBottomLimitUsdEurCzkAtom = atom<number>(0)
  const amountTopLimitUsdEurAtom = atom<number>(10000)
  const amountTopLimitCzkAtom = atom<number>(250000)

  const updateCurrencyLimitsAtom = atom<null, [{currency: Currency}], boolean>(
    null,
    (get, set, params) => {
      const {currency} = params
      set(currencyAtom, currency)
      set(amountBottomLimitAtom, get(amountBottomLimitUsdEurCzkAtom))
      set(
        amountTopLimitAtom,
        currency === 'CZK'
          ? get(amountTopLimitCzkAtom)
          : get(amountTopLimitUsdEurAtom)
      )
      return true
    }
  )

  const updateLocationStatePaymentMethodAtom = atom<
    null,
    [
      {
        locationState: LocationState
      }
    ],
    boolean
  >(null, (get, set, params) => {
    const {locationState} = params
    set(locationStateAtom, locationState)
    set(
      paymentMethodAtom,
      locationState === 'ONLINE' ? ['BANK', 'REVOLUT'] : ['CASH']
    )
    set(locationAtom, [])
    return true
  })

  const offerTypeAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('offerType')
  )

  const feeAmountAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('feeAmount')
  )

  const feeStateAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('feeState')
  )

  const locationStateAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('locationState')
  )

  const locationAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('location')
  )

  const btcNetworkAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('btcNetwork')
  )

  const paymentMethodAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('paymentMethod')
  )

  const offerDescriptionAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('offerDescription')
  )

  const offerActiveAtom = focusAtom(offerFormAtom, (optic) =>
    optic.prop('active')
  )

  const intendedConnectionLevelAtom = atom<IntendedConnectionLevel>(
    offer.ownershipInfo?.adminId
      ? offer.ownershipInfo?.intendedConnectionLevel
      : 'FIRST'
  )

  const loadingAtom = atom<boolean>(false)
  const editingOfferAtom = atom<boolean>(false)
  const encryptingOfferAtom = atom<boolean>(false)
  const deletingOfferAtom = atom<boolean>(false)
  const createOfferProgressAtom = atom<OfferProgressState | undefined>(
    undefined
  )

  const createOfferActionAtom = atom(null, (get, set): T.Task<boolean> => {
    const {t} = get(translationAtom)
    const {
      location,
      locationState,
      offerDescription,
      offerPublicKey,
      ...restOfPublicPart
    } = get(offerFormAtom)
    const intendedConnectionLevel = get(intendedConnectionLevelAtom)

    if (locationState === 'IN_PERSON' && location.length === 0) {
      Alert.alert(t('offerForm.errorLocationNotFilled'))
      return T.of(false)
    }

    if (offerDescription.trim() === '') {
      Alert.alert(t('offerForm.errorDescriptionNotFilled'))
      return T.of(false)
    }

    set(loadingAtom, true)
    set(encryptingOfferAtom, true)
    return pipe(
      generateKeyPair(),
      TE.fromEither,
      TE.bindTo('key'),
      TE.bindW('createdOffer', ({key}) =>
        set(createOfferAtom, {
          payloadPublic: {
            offerPublicKey: key.publicKeyPemBase64,
            location,
            locationState,
            offerDescription: offerDescription.trim(),
            ...restOfPublicPart,
          },
          intendedConnectionLevel,
          onProgress: (status) => {
            if (status.type === 'ENCRYPTING_PRIVATE_PAYLOADS')
              set(createOfferProgressAtom, {
                currentState: status.type,
                percentage: {
                  total: status.totalToEncrypt,
                  current: status.currentlyProcessingIndex,
                },
              })
            else
              set(createOfferProgressAtom, (old) => ({
                ...(old ?? {percentage: undefined}),
                currentState: status.type,
              }))
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
      TE.matchW(
        (e) => {
          Alert.alert(
            toCommonErrorMessage(e, t) ?? t('offerForm.errorCreatingOffer')
          )
          set(loadingAtom, false)
          set(encryptingOfferAtom, false)
          return false
        },
        () => {
          set(loadingAtom, false)
          return true
        }
      ),
      T.chain(delayInPipeT(3000)),
      T.map((result) => {
        set(encryptingOfferAtom, false)
        return result
      })
    )
  })

  const deleteOfferActionAtom = atom<null, [], T.Task<boolean>>(
    null,
    (get, set) => {
      const {t} = get(translationAtom)

      set(deletingOfferAtom, true)
      return pipe(
        set(deleteOffersActionAtom, {
          adminIds: [offer.ownershipInfo?.adminId].filter(notEmpty),
        }),
        TE.match(
          (e) => {
            Alert.alert(
              toCommonErrorMessage(e, t) ?? t('editOffer.errorDeletingOffer')
            )
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
          Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))
          return {
            loadingText: t('offerForm.noVexlersFoundForYourOffer'),
            notLoadingText: t('offerForm.noVexlersFoundForYourOffer'),
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
            notLoadingText: t(
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

    set(loadingAtom, true)
    set(editingOfferAtom, true)

    return pipe(
      set(updateOfferAtom, {
        payloadPublic: {
          ...offer.offerInfo.publicPart,
          active: !offer.offerInfo.publicPart.active,
        },
        adminId: offer.ownershipInfo?.adminId ?? ('' as OfferAdminId),
        symmetricKey: offer.offerInfo.privatePart.symmetricKey,
        intendedConnectionLevel: offer.ownershipInfo
          ? offer.ownershipInfo.intendedConnectionLevel
          : 'FIRST',
      }),
      TE.match(
        (e) => {
          Alert.alert(
            toCommonErrorMessage(e, t) ??
              t('editOffer.offerUnableToChangeOfferActivation')
          )
          return false
        },
        () => {
          set(loadingAtom, false)
          return true
        }
      ),
      T.chain(delayInPipeT(2000)),
      T.map((v) => {
        set(editingOfferAtom, false)
        return v
      })
    )
  })

  const editOfferAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)

    const {locationState, location, offerDescription, ...restOfPublicPart} =
      get(offerFormAtom)
    const intendedConnectionLevel = get(intendedConnectionLevelAtom)

    if (locationState === 'IN_PERSON' && location.length === 0) {
      Alert.alert(t('offerForm.errorLocationNotFilled'))
      return T.of(false)
    }

    if (offerDescription.trim() === '') {
      Alert.alert(t('offerForm.errorDescriptionNotFilled'))
      return T.of(false)
    }

    set(loadingAtom, true)
    set(editingOfferAtom, true)

    return pipe(
      set(updateOfferAtom, {
        payloadPublic: {
          ...restOfPublicPart,
          location,
          locationState,
          offerDescription: offerDescription.trim(),
        },
        adminId: offer.ownershipInfo?.adminId ?? ('' as OfferAdminId),
        symmetricKey: offer.offerInfo.privatePart.symmetricKey,
        intendedConnectionLevel,
      }),
      TE.match(
        (e) => {
          Alert.alert(
            toCommonErrorMessage(e, t) ?? t('editOffer.errorEditingOffer')
          )
          return false
        },
        () => {
          set(loadingAtom, false)
          return true
        }
      ),
      T.chain(delayInPipeT(2000)),
      T.map((v) => {
        set(editingOfferAtom, false)
        return v
      })
    )
  })

  return {
    deleteOfferActionAtom,
    intendedConnectionLevelAtom,
    modifyOfferLoaderTitleAtom,
    loadingAtom,
    editingOfferAtom,
    encryptingOfferAtom,
    deletingOfferAtom,
    toggleOfferActiveAtom,
    editOfferAtom,
    createOfferActionAtom,
    currencyAtom,
    amountBottomLimitAtom,
    amountTopLimitAtom,
    offerTypeAtom,
    feeAmountAtom,
    feeStateAtom,
    locationStateAtom,
    locationAtom,
    btcNetworkAtom,
    paymentMethodAtom,
    offerDescriptionAtom,
    offerActiveAtom,
    updateCurrencyLimitsAtom,
    amountBottomLimitUsdEurCzkAtom,
    amountTopLimitUsdEurAtom,
    amountTopLimitCzkAtom,
    updateLocationStatePaymentMethodAtom,
    createOfferProgressAtom,
  }
})
