import * as TE from 'fp-ts/TaskEither'
import type * as T from 'fp-ts/Task'
import {usePrivateApiAssumeLoggedIn} from '../../api'
import {useCallback} from 'react'
import {pipe} from 'fp-ts/function'
import {useStore} from 'jotai'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {
  type OfferId,
  type OfferInfo,
} from '@vexl-next/domain/dist/general/offers'
import {Alert} from 'react-native'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {useRequestOffer} from '../../state/marketplace'
import {useShowLoadingOverlay} from '../LoadingOverlayProvider'
import {createSingleOfferReportedFlagAtom} from '../../state/marketplace/atom'
import reportOfferSvg from './images/reportOfferSvg'
import offerReportedSvg from './images/offerReportedSvg'

export function useSubmitRequestHandleUI(): (
  text: string,
  offer: OfferInfo
) => T.Task<boolean> {
  const requestOffer = useRequestOffer()
  const {t} = useTranslation()
  const loadingOverlay = useShowLoadingOverlay()

  return useCallback(
    (text: string, offer: OfferInfo) => {
      loadingOverlay.show()
      return pipe(
        requestOffer({text, offer}),
        TE.match(
          (e) => {
            Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))
            // TODO handle request sent
            loadingOverlay.hide()
            return false
          },
          () => {
            loadingOverlay.hide()
            return true
          }
        )
      )
    },
    [loadingOverlay, requestOffer, t]
  )
}

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
          if (e._tag !== 'UserDeclinedError') {
            Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))
          }
          loadingOverlay.hide()
          return false
        }),
        TE.map(() => {
          store.set(reportedFlagAtom, true)
        }),
        TE.chainFirstW(() => {
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
            loadingOverlay.hide()
            return true
          }
        )
      )
    },
    [store, t, loadingOverlay, api.offer, safeGoBack]
  )
}
