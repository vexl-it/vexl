import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'

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

export function percentageAcrossItems({
  processingIndex,
  progress,
  totalToProcess,
}: {
  readonly processingIndex: number
  readonly progress: OfferEncryptionProgress
  readonly totalToProcess: number
}): number {
  if (totalToProcess === 0) return 100

  const completedItemsAndCurrentProgress =
    processingIndex + progressWithinCurrentItem(progress)
  const percentage = Math.round(
    (completedItemsAndCurrentProgress / totalToProcess) * 100
  )

  return Math.min(100, Math.max(0, percentage))
}
