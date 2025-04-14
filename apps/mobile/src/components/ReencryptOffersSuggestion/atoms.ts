import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {reencryptOffersMissingOnServerActionAtom} from '../../state/marketplace/atoms/offersMissingOnServer'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {offerProgressModalActionAtoms} from '../UploadingOfferProgressModal/atoms'

export const reencryptOffersWithModalActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  return pipe(
    set(reencryptOffersMissingOnServerActionAtom, {
      onProgress: ({
        processingIndex,
        offerEncryptionProgress,
        totalToProcess,
      }) => {
        set(offerProgressModalActionAtoms.showStep, {
          progress: offerEncryptionProgress,
          textData: {
            title: t('reuploadOffers.progress.title'),
            bottomText: t('offerForm.offerEncryption.dontShutDownTheApp'),
            belowProgressLeft: t('reuploadOffers.progress.status', {
              processingIndex: String(processingIndex + 1),
              totalToProcess: String(totalToProcess),
            }),
          },
        })
      },
    }),
    Effect.flatMap((result) => {
      if (result.errors.length > 0) {
        return set(offerProgressModalActionAtoms.hideDeffered, {
          delayMs: 2000,
          data: {
            title: t('reuploadOffers.progress.errorTitle'),
            bottomText: t('reuploadOffers.progress.errorExplanation', {
              failedCount: String(result.errors.length),
              totalCount: String(
                result.reuploaded.length + result.errors.length
              ),
            }),
            indicateProgress: {type: 'done'},
            belowProgressLeft: t(
              'reuploadOffers.progress.errorExplanationShort',
              {failedCount: String(result.errors.length)}
            ),
          },
        })
      }

      return set(offerProgressModalActionAtoms.hideDeffered, {
        delayMs: 2000,
        data: {
          title: t('reuploadOffers.progress.successTitle'),
          bottomText: t('reuploadOffers.progress.bottomText'),
          belowProgressLeft: t('reuploadOffers.progress.belowProgressLeft', {
            reuploadedCount: String(result.reuploaded.length),
          }),
          indicateProgress: {type: 'progress', percentage: 100},
        },
      })
    })
  )
})
