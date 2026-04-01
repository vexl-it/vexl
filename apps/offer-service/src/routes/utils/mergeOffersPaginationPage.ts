import type {PrivatePartRecordId} from '@vexl-next/domain/src/general/offers'
import {Array, Option} from 'effect'
import type {
  OfferParts,
  PublicPartVersion,
} from '../../db/OfferDbService/domain'

const mergeOfferPartsByOfferId = ({
  offersFetchedByPublicPartVersion,
  offersFetchedByPrivatePartId,
}: {
  offersFetchedByPublicPartVersion: readonly OfferParts[]
  offersFetchedByPrivatePartId: readonly OfferParts[]
}): readonly OfferParts[] => {
  const dedupedOfferParts = new Map<
    OfferParts['publicPart']['offerId'],
    OfferParts
  >()

  for (const offerParts of [
    ...offersFetchedByPublicPartVersion,
    ...offersFetchedByPrivatePartId,
  ]) {
    dedupedOfferParts.set(offerParts.publicPart.offerId, offerParts)
  }

  return [...dedupedOfferParts.values()]
}

export const mergeOffersPaginationPage = ({
  offersFetchedByPublicPartVersion,
  offersFetchedByPrivatePartId,
  limit,
  currentCursor,
}: {
  offersFetchedByPublicPartVersion: readonly OfferParts[]
  offersFetchedByPrivatePartId: readonly OfferParts[]
  limit: number
  currentCursor: {
    lastPublicPartVersion: PublicPartVersion
    lastPrivatePartId: PrivatePartRecordId
  }
}): {
  items: readonly OfferParts[]
  hasNext: boolean
  nextCursor: {
    lastPublicPartVersion: PublicPartVersion
    lastPrivatePartId: PrivatePartRecordId
  } | null
} => {
  const offersFetchedByPublicPartVersionToReturn = Array.take(limit)(
    offersFetchedByPublicPartVersion
  )
  const offersFetchedByPrivatePartIdToReturn = Array.take(limit)(
    offersFetchedByPrivatePartId
  )

  const lastOfferFetchedByPublicPartVersion = Array.last(
    offersFetchedByPublicPartVersionToReturn
  )
  const lastOfferFetchedByPrivatePartId = Array.last(
    offersFetchedByPrivatePartIdToReturn
  )

  const items = mergeOfferPartsByOfferId({
    offersFetchedByPublicPartVersion: offersFetchedByPublicPartVersionToReturn,
    offersFetchedByPrivatePartId: offersFetchedByPrivatePartIdToReturn,
  })

  return {
    items,
    hasNext:
      offersFetchedByPublicPartVersion.length > limit ||
      offersFetchedByPrivatePartId.length > limit,
    nextCursor:
      items.length > 0
        ? {
            lastPublicPartVersion: Option.match(
              lastOfferFetchedByPublicPartVersion,
              {
                onNone: () => currentCursor.lastPublicPartVersion,
                onSome: (offerParts) => offerParts.publicPart.publicPartVersion,
              }
            ),
            lastPrivatePartId: Option.match(lastOfferFetchedByPrivatePartId, {
              onNone: () => currentCursor.lastPrivatePartId,
              onSome: (offerParts) => offerParts.privatePart.id,
            }),
          }
        : null,
  }
}
