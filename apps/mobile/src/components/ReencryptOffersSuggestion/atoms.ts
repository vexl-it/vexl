import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {reencryptOffersMissingOnServerActionAtom} from '../../state/marketplace/atoms/offersMissingOnServer'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {formatInteger} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import {offerProgressModalActionAtoms} from '../UploadingOfferProgressModal/atoms'

export const reencryptOffersWithModalActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const locale = get(formattingLocaleAtom)

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
            bottomText: t('offerForm.offerEncryption.dontCloseTheApp'),
            belowProgressLeft: t('reuploadOffers.progress.status', {
              processingIndex: formatInteger(processingIndex + 1, locale),
              totalToProcess: formatInteger(totalToProcess, locale),
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
              failedCount: formatInteger(result.errors.length, locale),
              totalCount: formatInteger(
                result.reuploaded.length + result.errors.length,
                locale
              ),
            }),
            indicateProgress: {type: 'done'},
            belowProgressLeft: t(
              'reuploadOffers.progress.errorExplanationShort',
              {failedCount: formatInteger(result.errors.length, locale)}
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
            reuploadedCount: formatInteger(result.reuploaded.length, locale),
          }),
          indicateProgress: {type: 'progress', percentage: 100},
        },
      })
    })
  )
})
