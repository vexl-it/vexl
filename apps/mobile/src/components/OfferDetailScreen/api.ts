import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import type * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useStore} from 'jotai'
import {useCallback} from 'react'
import {Alert} from 'react-native'
import {apiAtom} from '../../api'
import {createSingleOfferReportedFlagAtom} from '../../state/marketplace/atoms/offersState'
import {useTranslation} from '../../utils/localization/I18nProvider'
import showErrorAlert from '../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import {useShowLoadingOverlay} from '../LoadingOverlayProvider'

export function useReportOfferHandleUI(): (
  offerId: OfferId
) => T.Task<boolean> {
  const {t} = useTranslation()
  const store = useStore()
  const safeGoBack = useSafeGoBack()
  const loadingOverlay = useShowLoadingOverlay()

  return useCallback(
    (offerId: OfferId) => {
      const reportedFlagAtom = createSingleOfferReportedFlagAtom(offerId)

      return pipe(
        store.set(askAreYouSureActionAtom, {
          variant: 'danger',
          steps: [
            {
              type: 'StepWithText',
              title: t('offer.report.areYouSureTitle'),
              description: t('offer.report.areYouSureText'),
              positiveButtonText: t('offer.report.yes'),
              negativeButtonText: t('common.nope'),
            },
          ],
        }),
        effectToTaskEither,
        TE.chainW(() => {
          loadingOverlay.show()
          return effectToTaskEither(
            store.get(apiAtom).offer.reportOffer({
              body: {
                offerId,
              },
            })
          )
        }),
        TE.mapLeft((e) => {
          if (e._tag === 'ReportOfferLimitReachedError') {
            Alert.alert(t('offer.report.reportLimitReached'))
          } else if (e._tag !== 'UserDeclinedError') {
            showErrorAlert({
              title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
              error: e,
            })
          }
          loadingOverlay.hide()
          return false
        }),
        TE.map(() => {
          store.set(reportedFlagAtom, true)
          loadingOverlay.hide()
        }),
        TE.chainFirstTaskK(() => {
          return store
            .set(askAreYouSureActionAtom, {
              variant: 'info',
              steps: [
                {
                  type: 'StepWithText',
                  title: t('offer.report.thankYou'),
                  description: t(
                    'offer.report.inappropriateContentWasReported'
                  ),
                  positiveButtonText: t('common.continue'),
                },
              ],
            })
            .pipe(effectToTaskEither)
        }),
        TE.match(
          () => {
            return false
          },
          () => {
            safeGoBack()
            return true
          }
        )
      )
    },
    [loadingOverlay, safeGoBack, store, t]
  )
}
