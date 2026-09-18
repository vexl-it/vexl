import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Effect} from 'effect'

export function createTestOfferApi(
  overrides: Partial<OfferApi> = {}
): OfferApi {
  const unusedApiCall = (): Effect.Effect<never> =>
    Effect.die('Unexpected API call')
  return {
    createPrivatePart: unusedApiCall,
    deletePrivatePart: unusedApiCall,
    getOffersForMeModifiedOrCreatedAfterPaginated: unusedApiCall,
    getClubOffersForMeModifiedOrCreatedAfterPaginated: unusedApiCall,
    createNewOffer: unusedApiCall,
    refreshOffer: unusedApiCall,
    deleteOffer: unusedApiCall,
    updateOffer: unusedApiCall,
    getRemovedOffers: unusedApiCall,
    getRemovedClubOffers: unusedApiCall,
    reportOffer: unusedApiCall,
    reportClubOffer: unusedApiCall,
    getNotesForMeModifiedOrCreatedAfterPaginated: unusedApiCall,
    createNewNote: unusedApiCall,
    deleteNote: unusedApiCall,
    createNotePrivatePart: unusedApiCall,
    deleteNotePrivatePart: unusedApiCall,
    createRepostNotePrivatePart: unusedApiCall,
    deleteRepostNotePrivatePart: unusedApiCall,
    repostNote: unusedApiCall,
    undoRepostNote: unusedApiCall,
    getRemovedNotes: unusedApiCall,
    reportNote: unusedApiCall,
    createChallenge: unusedApiCall,
    ...overrides,
  }
}
