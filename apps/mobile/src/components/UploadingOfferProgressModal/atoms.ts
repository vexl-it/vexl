import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {translationAtom} from '../../utils/localization/I18nProvider'

export interface ShownData {
  mode: 'shown'
  title: string
  bottomText?: string
  belowProgressLeft?: string
  belowProgressRight?: string
  indicateProgress:
    | {type: 'intermediate'}
    | {type: 'progress'; percentage: number}
    | {type: 'done'}
}

export interface HiddenData {
  mode: 'hidden'
}
export type ModalData = ShownData | HiddenData

const dataAtom = atom<ModalData>({mode: 'hidden'})

export const uploadingProgressDataForRootElement = atom<{
  isVisible: boolean
  title: string
  bottomText: string
}>((get) => {
  const modalData = get(dataAtom)

  if (modalData.mode === 'hidden')
    return {isVisible: false, title: '', bottomText: ''}

  return {
    isVisible: true,
    title: modalData.title,
    bottomText: modalData.bottomText ?? '',
  }
})

export const uploadingProgressDataForProgressIndicatorElementAtom = atom<{
  belowProgressRight?: string
  belowProgressLeft?: string
  indicateProgress:
    | {type: 'intermediate'}
    | {type: 'progress'; percentage: number}
    | {type: 'done'}
}>((get) => {
  const modalData = get(dataAtom)
  if (modalData.mode === 'hidden') return {indicateProgress: {type: 'done'}}

  return {
    belowProgressLeft: modalData.belowProgressLeft,
    belowProgressRight: modalData.belowProgressRight,
    indicateProgress: modalData.indicateProgress,
  }
})

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
        progress,
        textData,
      }: {
        progress: OfferEncryptionProgress
        textData: ProgressStepDataActionParam
      }
    ) => {
      const {t} = get(translationAtom)

      if (progress.type === 'ENCRYPTING_PRIVATE_PAYLOADS') {
        const {totalToEncrypt, currentlyProcessingIndex} = progress
        const percentage = Math.round(
          ((currentlyProcessingIndex + 1) / totalToEncrypt) * 100
        )

        set(dataAtom, {
          mode: 'shown',
          belowProgressRight: t('progressBar.ENCRYPTING_PRIVATE_PAYLOADS', {
            percentDone: percentage,
          }),
          indicateProgress: {type: 'progress', percentage},
          ...textData,
        })
      } else {
        set(dataAtom, {
          mode: 'shown',
          belowProgressRight: t(`progressBar.${progress.type}`),
          indicateProgress: ['SENDING_OFFER_TO_NETWORK', 'DONE'].includes(
            progress.type
          )
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
