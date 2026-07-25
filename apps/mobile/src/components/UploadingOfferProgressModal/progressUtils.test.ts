import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import {Array, pipe} from 'effect'
import {percentageAcrossItems, progressSpan} from './progressUtils'

const ITEM_STEPS: readonly OfferEncryptionProgress[] = [
  {type: 'CONSTRUCTING_PRIVATE_PAYLOADS'},
  {
    type: 'ENCRYPTING_PRIVATE_PAYLOADS',
    totalToEncrypt: 2,
    currentlyProcessingIndex: 0,
  },
  {
    type: 'ENCRYPTING_PRIVATE_PAYLOADS',
    totalToEncrypt: 2,
    currentlyProcessingIndex: 1,
  },
  {type: 'SENDING_OFFER_TO_NETWORK'},
  {type: 'DONE'},
]

function percentagesForBatch({
  totalToProcess,
  span,
}: {
  readonly totalToProcess: number
  readonly span: ReturnType<typeof progressSpan>
}): readonly number[] {
  return pipe(
    Array.range(0, Math.max(0, totalToProcess - 1)),
    Array.flatMap((processingIndex) =>
      pipe(
        ITEM_STEPS,
        Array.map((progress) =>
          percentageAcrossItems({
            processingIndex,
            totalToProcess,
            span,
            progress,
          })
        )
      )
    )
  )
}

describe('percentageAcrossItems', () => {
  it('fills the whole bar when no span is passed', () => {
    const percentages = percentagesForBatch({
      totalToProcess: 3,
      span: {startPercentage: 0, endPercentage: 100},
    })

    expect(percentages.at(0)).toBe(2)
    expect(percentages.at(-1)).toBe(100)
  })

  it('never goes backwards across two batches sharing one bar', () => {
    const offersCount = 4
    const notesCount = 2
    const totalWeight = offersCount + notesCount

    const percentages = [
      ...percentagesForBatch({
        totalToProcess: offersCount,
        span: progressSpan({
          weight: offersCount,
          weightBefore: 0,
          totalWeight,
        }),
      }),
      ...percentagesForBatch({
        totalToProcess: notesCount,
        span: progressSpan({
          weight: notesCount,
          weightBefore: offersCount,
          totalWeight,
        }),
      }),
    ]

    expect(percentages.at(-1)).toBe(100)
    pipe(
      percentages,
      Array.zip(Array.drop(percentages, 1)),
      Array.forEach(([previous, next]) => {
        expect(next).toBeGreaterThanOrEqual(previous)
      })
    )
  })

  it('stays within its span even when the batch has more items than estimated', () => {
    const percentages = percentagesForBatch({
      totalToProcess: 10,
      span: progressSpan({weight: 2, weightBefore: 3, totalWeight: 5}),
    })

    expect(Math.min(...percentages)).toBeGreaterThanOrEqual(60)
    expect(Math.max(...percentages)).toBe(100)
  })
})

describe('progressSpan', () => {
  it('falls back to the whole bar when there is nothing to weight', () => {
    expect(
      progressSpan({weight: 0, weightBefore: 0, totalWeight: 0})
    ).toStrictEqual({startPercentage: 0, endPercentage: 100})
  })

  it('gives an empty batch an empty span', () => {
    expect(
      progressSpan({weight: 0, weightBefore: 4, totalWeight: 4})
    ).toStrictEqual({startPercentage: 100, endPercentage: 100})
  })
})
