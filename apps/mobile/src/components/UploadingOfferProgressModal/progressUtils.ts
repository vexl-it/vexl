import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'

/** Part of the 0-100 progress bar a single batch of items fills. */
export interface ProgressSpan {
  readonly startPercentage: number
  readonly endPercentage: number
}

const WHOLE_BAR: ProgressSpan = {startPercentage: 0, endPercentage: 100}

export interface AggregateProgress {
  readonly processingIndex: number
  readonly totalToProcess: number
  /**
   * Part of the bar this batch fills. Defaults to the whole bar. Pass a span
   * whenever multiple batches report into the same dialog one after another —
   * without it each batch would restart the bar from 0.
   */
  readonly span?: ProgressSpan
}

function progressWithinCurrentItem(progress: OfferEncryptionProgress): number {
  switch (progress.type) {
    case 'FETCHING_CONTACTS':
    case 'CONSTRUCTING_PRIVATE_PAYLOADS':
    case 'CONSTRUCTING_PUBLIC_PAYLOAD':
      return 0.05
    case 'ENCRYPTING_PRIVATE_PAYLOADS': {
      if (progress.totalToEncrypt === 0) return 0.85

      const encryptedFraction =
        (progress.currentlyProcessingIndex + 1) / progress.totalToEncrypt
      return 0.05 + encryptedFraction * 0.8
    }
    case 'SENDING_OFFER_TO_NETWORK':
      return 0.9
    case 'DONE':
      return 1
  }
}

/**
 * Assigns a part of the 0-100 bar to one batch of a flow that processes several
 * batches one after another. Weights are the item counts each batch is expected
 * to process — they only decide how the bar is divided between batches, every
 * batch always fills its own span exactly, keeping the bar monotonic even when
 * the estimate was off.
 */
export function progressSpan({
  weight,
  weightBefore,
  totalWeight,
}: {
  readonly weight: number
  readonly weightBefore: number
  readonly totalWeight: number
}): ProgressSpan {
  if (totalWeight <= 0) return WHOLE_BAR

  return {
    startPercentage: (weightBefore / totalWeight) * 100,
    endPercentage: ((weightBefore + weight) / totalWeight) * 100,
  }
}

export function percentageAcrossItems({
  processingIndex,
  progress,
  span,
  totalToProcess,
}: AggregateProgress & {
  readonly progress: OfferEncryptionProgress
}): number {
  const {startPercentage, endPercentage} = span ?? WHOLE_BAR

  const fractionDone =
    totalToProcess === 0
      ? 1
      : (processingIndex + progressWithinCurrentItem(progress)) / totalToProcess

  const percentage = Math.round(
    startPercentage + fractionDone * (endPercentage - startPercentage)
  )

  return Math.min(100, Math.max(0, percentage))
}
