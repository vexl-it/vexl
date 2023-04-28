import {atom} from 'jotai'
import {
  type IntendedConnectionLevel,
  OfferId,
  type OfferPublicPart,
  SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {createScope, molecule} from 'jotai-molecules'
import {type OneOfferInState} from '../../../state/marketplace/domain'
import {OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {IdNumeric} from '@vexl-next/domain/dist/utility/IdNumeric'
import {IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import {Alert} from 'react-native'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {createOfferAtom, updateOfferAtom} from '../../../state/marketplace'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {focusAtom} from 'jotai-optics'
import numberOfFriendsAtom from './numberOfFriendsAtom'
import * as E from 'fp-ts/Either'
import {generateKeyPair} from '@vexl-next/resources-utils/dist/utils/crypto'
import {createInboxAtom} from '../../../state/chat/hooks/useCreateInbox'
import {delayInPipeT} from '../../../utils/fpUtils'
import {generateUuid, Uuid} from '@vexl-next/domain/dist/utility/Uuid.brand'

export const offerDummyPublicPart: OfferPublicPart = {
  offerPublicKey: PublicKeyPemBase64.parse('offerPublicKey'),
  location: [],
  offerDescription: '',
  amountBottomLimit: 0,
  amountTopLimit: 250000,
  feeState: 'WITHOUT_FEE',
  feeAmount: 0,
  locationState: 'IN_PERSON',
  paymentMethod: ['CASH'],
  btcNetwork: ['LIGHTING'],
  currency: 'CZK',
  offerType: 'SELL',
  activePriceState: 'NONE',
  activePriceValue: 0,
  activePriceCurrency: 'CZK',
  active: true,
  groupUuids: [],
}

export const dummyOffer: OneOfferInState = {
  ownershipInfo: {
    adminId: OfferAdminId.parse('offerAdminId'),
    intendedConnectionLevel: 'FIRST',
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
    publicPart: offerDummyPublicPart,
    createdAt: IsoDatetimeString.parse('1970-01-01T00:00:00.000Z'),
    modifiedAt: IsoDatetimeString.parse('1970-01-01T00:00:00.000Z'),
  },
}

export const OfferFormStateScope = createScope<OneOfferInState | undefined>(
  undefined
)

export const offerFormStateMolecule = molecule((getMolecule, getScope) => {
  const offer = getScope(OfferFormStateScope) ?? dummyOffer

  const offerPublicPartAtom = atom(offer.offerInfo.publicPart)

  const offerActiveAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('active')
  )

  const currencyAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('currency')
  )

  const amountBottomLimitAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('amountBottomLimit')
  )

  const amountTopLimitAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('amountTopLimit')
  )

  const offerTypeAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('offerType')
  )

  const feeAmountAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('feeAmount')
  )

  const feeStateAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('feeState')
  )

  const locationStateAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('locationState')
  )

  const locationAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('location')
  )

  const btcNetworkAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('btcNetwork')
  )

  const paymentMethodAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('paymentMethod')
  )

  const offerDescriptionAtom = focusAtom(offerPublicPartAtom, (optic) =>
    optic.prop('offerDescription')
  )

  const intendedConnectionLevelAtom = atom<IntendedConnectionLevel>(
    offer.ownershipInfo?.adminId
      ? offer.ownershipInfo?.intendedConnectionLevel
      : 'FIRST'
  )

  const loadingAtom = atom<boolean>(false)
  const editingOfferAtom = atom<boolean>(false)
  const encryptingOfferAtom = atom<boolean>(false)

  const createOfferActionAtom = atom(null, (get, set): T.Task<boolean> => {
    const {t} = get(translationAtom)
    const {
      offerDescription,
      location,
      locationState,
      offerPublicKey,
      ...restOfPublicPart
    } = get(offerPublicPartAtom)
    const intendedConnectionLevel = get(intendedConnectionLevelAtom)

    if (locationState === 'IN_PERSON' && location.length === 0) {
      Alert.alert(t('createOffer.errorLocationNotFilled'))
      return T.of(false)
    }

    if (offerDescription.trim() === '') {
      Alert.alert(t('createOffer.errorDescriptionNotFilled'))
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
            toCommonErrorMessage(e, t) ?? t('createOffer.errorCreatingOffer')
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
      T.map((v) => {
        set(encryptingOfferAtom, false)
        return v
      })
    )
  })

  const createOfferLoaderTitleAtom = atom((get) => {
    const {t} = get(translationAtom)
    const numberOfFriends = get(numberOfFriendsAtom)
    const intendedConnectionLevel = get(intendedConnectionLevelAtom)

    return pipe(
      numberOfFriends,
      E.match(
        (e) => {
          Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))
          return {
            loadingText: t('createOffer.noVexlersFoundForYourOffer'),
            notLoadingText: t('createOffer.noVexlersFoundForYourOffer'),
          }
        },
        (r) => {
          return {
            loadingText: t('createOffer.offerEncryption.forVexlers', {
              count:
                intendedConnectionLevel === 'FIRST'
                  ? r.firstLevelFriendsCount
                  : r.secondLevelFriendsCount,
            }),
            notLoadingText: t(
              'createOffer.offerEncryption.anonymouslyDeliveredToVexlers',
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
        privatePayloads: [],
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
      get(offerPublicPartAtom)
    const intendedConnectionLevel = get(intendedConnectionLevelAtom)

    if (locationState === 'IN_PERSON' && location.length === 0) {
      Alert.alert(t('createOffer.errorLocationNotFilled'))
      return T.of(false)
    }

    if (offerDescription.trim() === '') {
      Alert.alert(t('createOffer.errorDescriptionNotFilled'))
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
        privatePayloads: [],
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
        (offer) => {
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

  const friendLevelSubtitleAtom = atom((get) => {
    const {t} = get(translationAtom)
    const numberOfFriends = get(numberOfFriendsAtom)
    return pipe(
      numberOfFriends,
      E.match(
        (e) => {
          if (e._tag !== 'initial') {
            Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))
          }
          return {
            firstFriendLevelText: t('createOffer.friendLevel.noVexlers'),
            secondFriendLevelText: t('createOffer.friendLevel.noVexlers'),
          }
        },
        (r) => {
          return {
            firstFriendLevelText: t('createOffer.friendLevel.reachVexlers', {
              count: r.firstLevelFriendsCount,
            }),
            secondFriendLevelText: t('createOffer.friendLevel.reachVexlers', {
              count: r.secondLevelFriendsCount,
            }),
          }
        }
      )
    )
  })

  return {
    intendedConnectionLevelAtom,
    createOfferLoaderTitleAtom,
    friendLevelSubtitleAtom,
    loadingAtom,
    offerActiveAtom,
    editingOfferAtom,
    encryptingOfferAtom,
    toggleOfferActiveAtom,
    editOfferAtom,
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
    createOfferActionAtom,
  }
})
