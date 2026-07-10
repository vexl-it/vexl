import {
  type OfferId,
  type OfferMark,
  type OfferMarkType,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {isoNow} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Array, Effect, Option} from 'effect'
import {atom} from 'jotai'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {offersAtom} from './offersState'

export const setOfferMarkActionAtom = atom(
  null,
  (
    get,
    set,
    params: {
      readonly offerId: OfferId
      readonly mark: OfferMark | undefined
    }
  ) => {
    set(
      offersAtom,
      Array.map((one) =>
        one.offerInfo.offerId === params.offerId
          ? {...one, flags: {...one.flags, mark: params.mark}}
          : one
      )
    )
  }
)

/**
 * Toggles the user mark on an offer.
 * - same mark as target -> unmarks the offer
 * - crossing FAVOURITE <-> ARCHIVED with `confirmCrossTransition` -> asks
 *   for confirmation first
 *
 * `onBeforeCommit` runs synchronously right before the state write (after
 * the confirmation dialog resolves) so callers can arm list layout
 * animations in the same JS task as the update.
 */
export const toggleOfferMarkActionAtom = atom(
  null,
  (
    get,
    set,
    params: {
      readonly offer: OneOfferInState
      readonly target: OfferMarkType
      readonly confirmCrossTransition: boolean
      readonly onBeforeCommit?: () => void
    }
  ): Effect.Effect<boolean> => {
    const {t} = get(translationAtom)
    const {offer, target, confirmCrossTransition, onBeforeCommit} = params
    const offerId = offer.offerInfo.offerId
    const getCurrentOffer = (): OneOfferInState | undefined =>
      Option.getOrUndefined(
        Array.findFirst(
          get(offersAtom),
          (one) => one.offerInfo.offerId === offerId
        )
      )

    return Effect.gen(function* (_) {
      const offerAtExecution = getCurrentOffer()
      if (offerAtExecution === undefined) return false

      const markAtExecution = offerAtExecution.flags.mark
      const needsConfirmation =
        markAtExecution !== undefined &&
        markAtExecution.type !== target &&
        confirmCrossTransition

      if (needsConfirmation) {
        const confirmed = yield* _(
          set(
            globalDialogAtom,
            target === 'ARCHIVED'
              ? {
                  title: t('offer.archive.confirmFromFavoritesTitle'),
                  subtitle: t('offer.archive.confirmFromFavoritesDescription'),
                  positiveButtonText: t(
                    'offer.archive.confirmFromFavoritesAction'
                  ),
                  negativeButtonText: t('common.cancel'),
                }
              : {
                  title: t('offer.favorite.confirmFromArchivedTitle'),
                  subtitle: t('offer.favorite.confirmFromArchivedDescription'),
                  positiveButtonText: t(
                    'offer.favorite.confirmFromArchivedAction'
                  ),
                  negativeButtonText: t('common.cancel'),
                }
          )
        )

        if (!confirmed) return false
      }

      const offerAtCommit = getCurrentOffer()
      if (offerAtCommit === undefined) return false

      const currentMark = offerAtCommit.flags.mark
      if (needsConfirmation && currentMark?.type !== markAtExecution?.type) {
        return false
      }

      onBeforeCommit?.()
      set(setOfferMarkActionAtom, {
        offerId,
        mark:
          currentMark?.type === target
            ? undefined
            : {type: target, markedAt: isoNow()},
      })

      return true
    })
  }
)
