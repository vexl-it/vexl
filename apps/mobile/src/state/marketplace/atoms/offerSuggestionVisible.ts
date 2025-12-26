import {Schema} from 'effect/index'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

export const addMoreContactsSuggestionVisibleAtom = atom<boolean>(true)
export const resetFilterSuggestionVisibleAtom = atom<boolean>(true)
export const joinVexlClubsSuggestionVisibleAtom = atom<boolean>(true)

export const createOfferSuggestionVisibleStorageAtom =
  atomWithParsedMmkvStorage(
    'createOfferSuggestionVisible',
    {
      visible: true,
    },
    Schema.Struct({
      visible: Schema.Boolean,
    })
  )

export const createOfferSuggestionVisibleAtom = focusAtom(
  createOfferSuggestionVisibleStorageAtom,
  (o) => o.prop('visible')
)
