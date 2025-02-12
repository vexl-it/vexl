import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
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
    z.object({visible: z.boolean().default(true)}).readonly()
  )

export const createOfferSuggestionVisibleAtom = focusAtom(
  createOfferSuggestionVisibleStorageAtom,
  (o) => o.prop('visible')
)
