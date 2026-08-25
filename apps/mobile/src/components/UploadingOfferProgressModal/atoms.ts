import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import {type ProgressIndication} from '@vexl-next/ui'
import {Effect, pipe} from 'effect'
import {atom, getDefaultStore} from 'jotai'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {formatInteger} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import {waitForNextAnimationFrameEffect} from '../../utils/runAfterAnimationFrames'
import {percentageAcrossItems, type AggregateProgress} from './progressUtils'

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

/**
 * True while the progress modal's NATIVE modal is on screen - from the moment
 * it is shown until its hide animation finished and it unmounted. Maintained
 * by the UploadingOfferProgressModal component.
 */
export const progressModalNativeModalUpAtom = atom(false)

/**
 * Resolves once the progress modal's native modal is fully gone (plus two
 * frames for React to unmount it). Presenting another native modal (dialog)
 * while this one is still dismissing is silently dropped on iOS, so flows
 * that show a dialog right after the progress modal must wait on this first.
 */
export const waitUntilProgressModalIsFullyHiddenActionAtom = atom(
  null,
  (): Effect.Effect<void> =>
    Effect.async((resume: (effect: Effect.Effect<void>) => void) => {
      const store = getDefaultStore()
      if (!store.get(progressModalNativeModalUpAtom)) {
        resume(Effect.void)
        return
      }
      const unsubscribe = store.sub(progressModalNativeModalUpAtom, () => {
        if (!store.get(progressModalNativeModalUpAtom)) {
          unsubscribe()
          resume(Effect.void)
        }
      })
      return Effect.sync(unsubscribe)
    }).pipe(
      // The hide animation takes ~300ms - a missed signal must never
      // deadlock the caller.
      Effect.timeout('3 seconds'),
      Effect.catchAll(() => Effect.void),
      Effect.andThen(waitForNextAnimationFrameEffect()),
      Effect.andThen(waitForNextAnimationFrameEffect())
    )
)

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
        aggregateProgress?: AggregateProgress
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
