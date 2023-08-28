import * as TE from 'fp-ts/TaskEither'
import type * as T from 'fp-ts/Task'
import {usePrivateApiAssumeLoggedIn} from '../../api'
import {useCallback} from 'react'
import {pipe} from 'fp-ts/function'
import {useStore} from 'jotai'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {type OfferId} from '@vexl-next/domain/dist/general/offers'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {useShowLoadingOverlay} from '../LoadingOverlayProvider'
import {createSingleOfferReportedFlagAtom} from '../../state/marketplace/atom'
import reportOfferSvg from './images/reportOfferSvg'
import offerReportedSvg from './images/offerReportedSvg'
import showErrorAlert from '../../utils/showErrorAlert'
import {Alert} from 'react-native'

export function useReportOfferHandleUI(): (
  offerId: OfferId
) => T.Task<boolean> {
  const api = usePrivateApiAssumeLoggedIn()
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
              image: {type: 'svgXml', svgXml: reportOfferSvg},
              title: t('offer.report.areYouSureTitle'),
              description: t('offer.report.areYouSureText'),
              positiveButtonText: t('offer.report.yes'),
              negativeButtonText: t('common.nope'),
            },
          ],
        }),
        TE.chainW(() => {
          loadingOverlay.show()
          return api.offer.reportOffer({
            offerId,
          })
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
          return store.set(askAreYouSureActionAtom, {
            variant: 'info',
            steps: [
              {
                type: 'StepWithText',
                image: {type: 'svgXml', svgXml: offerReportedSvg},
                title: t('offer.report.thankYou'),
                description: t('offer.report.inappropriateContentWasReported'),
                positiveButtonText: t('common.continue'),
              },
            ],
          })
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
    [store, t, loadingOverlay, api.offer, safeGoBack]
  )
}
