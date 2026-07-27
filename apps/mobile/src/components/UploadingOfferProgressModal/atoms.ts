import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import {type ProgressIndication} from '@vexl-next/ui'
import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {formatInteger} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import {percentageAcrossItems} from './progressUtils'

export type {ProgressIndication} from '@vexl-next/ui'

export interface ShownData {
  mode: 'shown'
  title: string
  bottomText?: string
  belowProgressLeft?: string
  belowProgressRight?: string
  indicateProgress: ProgressIndication
}

export interface HiddenData {
  mode: 'hidden'
}
export type ModalData = ShownData | HiddenData

const dataAtom = atom<ModalData>({mode: 'hidden'})

export const uploadingProgressModalDataAtom = atom((get) => get(dataAtom))

type DataActionParam = Omit<ShownData, 'mode'>
type ProgressStepDataActionParam = Omit<
  DataActionParam,
  'indicateProgress' | 'belowProgressRight'
>
export const offerProgressModalActionAtoms = {
  show: atom(null, (get, set, data: DataActionParam) => {
    set(dataAtom, {mode: 'shown', ...data})
  }),

  hide: atom(null, (get, set) => {
    set(dataAtom, {
      mode: 'hidden',
    })
  }),

  hideDeffered: atom(
    null,
    (get, set, {data, delayMs}: {data: DataActionParam; delayMs: number}) => {
      set(dataAtom, {mode: 'shown', ...data})

      return pipe(
        Effect.sleep(delayMs),
        Effect.tap(() => {
          set(dataAtom, {mode: 'hidden'})
        })
      )
    }
  ),

  showStep: atom(
    null,
    (
      get,
      set,
      {
        aggregateProgress,
        progress,
        textData,
      }: {
        aggregateProgress?: {
          readonly processingIndex: number
          readonly totalToProcess: number
        }
        progress: OfferEncryptionProgress
        textData: ProgressStepDataActionParam
      }
    ) => {
      const {t} = get(translationAtom)
      const locale = get(formattingLocaleAtom)
      const aggregatePercentage = aggregateProgress
        ? percentageAcrossItems({...aggregateProgress, progress})
        : undefined
      const aggregateBelowProgressRight =
        aggregatePercentage !== undefined
          ? t('progressBar.percentDone', {
              percentDone: formatInteger(aggregatePercentage, locale),
            })
          : undefined

      if (progress.type === 'ENCRYPTING_PRIVATE_PAYLOADS') {
        const {totalToEncrypt, currentlyProcessingIndex} = progress
        const percentage = Math.round(
          ((currentlyProcessingIndex + 1) / totalToEncrypt) * 100
        )

        set(dataAtom, {
          mode: 'shown',
          belowProgressRight:
            aggregateBelowProgressRight ??
            t('progressBar.ENCRYPTING_PRIVATE_PAYLOADS', {
              percentDone: formatInteger(percentage, locale),
            }),
          indicateProgress: {
            type: 'progress',
            percentage: aggregatePercentage ?? percentage,
          },
          ...textData,
        })
      } else {
        const belowProgressRight =
          progress.type === 'CONSTRUCTING_PRIVATE_PAYLOADS' ||
          progress.type === 'CONSTRUCTING_PUBLIC_PAYLOAD'
            ? t('progressBar.PREPARING_ENCRYPTED_OFFER_DETAILS')
            : t(`progressBar.${progress.type}`)

        set(dataAtom, {
          mode: 'shown',
          belowProgressRight: aggregateBelowProgressRight ?? belowProgressRight,
          indicateProgress:
            aggregatePercentage !== undefined
              ? {type: 'progress', percentage: aggregatePercentage}
              : ['SENDING_OFFER_TO_NETWORK', 'DONE'].includes(progress.type)
                ? {type: 'progress', percentage: 100}
                : {
                    type: 'intermediate',
                  },
          ...textData,
        })
      }
    }
  ),
}
