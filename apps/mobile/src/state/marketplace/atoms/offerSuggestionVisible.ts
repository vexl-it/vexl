import {atom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'

export const addMoreContactsSuggestionVisibleAtom = atom<boolean>(true)
export const resetFilterSuggestionVisibleAtom = atom<boolean>(true)

export const createOfferSuggestionVisibleStorageAtom =
  atomWithParsedMmkvStorage(
    'createOfferSuggestionVisible',
    {
      visible: true,
    },
    z.object({visible: z.boolean().default(true)})
  )

export const createOfferSuggestionVisibleAtom = focusAtom(
  createOfferSuggestionVisibleStorageAtom,
  (o) => o.prop('visible')
)
