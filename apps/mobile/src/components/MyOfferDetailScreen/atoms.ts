import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {Effect} from 'effect'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {toggleNearbySharingActionAtom} from '../../state/marketplace/atoms/nearbyOffers/toggleNearbySharingActionAtom'
import {singleOfferAtom} from '../../state/marketplace/atoms/offersState'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'
import {showErrorAlert} from '../ErrorAlert'
import {globalDialogAtom} from '../GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'

const toggleNearbySharingWithConfirmationActionAtom = atom(
  null,
  (get, set, {offerId, enabled}: {offerId: OfferId; enabled: boolean}) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      if (enabled) {
        const confirmed = yield* _(
          set(globalDialogAtom, {
            title: t('editOffer.nearbySharing.confirmTitle'),
            subtitle: t('editOffer.nearbySharing.confirmDescription'),
            positiveButtonText: t('editOffer.nearbySharing.confirmButton'),
            negativeButtonText: t('common.cancel'),
          })
        )
        if (!confirmed) return
      }

      set(loadingOverlayDisplayedAtom, true)
      yield* _(
        set(toggleNearbySharingActionAtom, {offerId, enabled}),
        Effect.ensuring(
          Effect.sync(() => {
            set(loadingOverlayDisplayedAtom, false)
          })
        )
      )
    }).pipe(
      Effect.catchAll((e) => {
        showErrorAlert({
          title:
            toCommonErrorMessage(e, t) ?? t('editOffer.nearbySharing.error'),
          error: e,
        })
        return Effect.void
      })
    )
  }
)

export function createNearbySharingSwitchAtom(
  offerId: OfferId
): WritableAtom<boolean, [SetStateAction<boolean>], void> {
  const offerAtom = singleOfferAtom(offerId)
  const isSharedNearbyAtom = atom(
    (get) => !!get(offerAtom)?.ownershipInfo?.nearbyKey
  )

  return atom(
    (get) => get(isSharedNearbyAtom),
    (get, set, update: SetStateAction<boolean>) => {
      const enabled =
        typeof update === 'function' ? update(get(isSharedNearbyAtom)) : update
      Effect.runFork(
        set(toggleNearbySharingWithConfirmationActionAtom, {offerId, enabled})
      )
    }
  )
}
