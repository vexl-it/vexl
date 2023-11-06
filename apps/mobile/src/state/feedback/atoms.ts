import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'

export const newOfferFeedbackDoneStorageAtom = atomWithParsedMmkvStorage(
  'newOfferFeedbackDoneStorageAtom',
  {
    newOfferFeedbackDone: false,
  },
  z.object({newOfferFeedbackDone: z.boolean().default(false)})
)

export const newOfferFeedbackDoneAtom = focusAtom(
  newOfferFeedbackDoneStorageAtom,
  (o) => o.prop('newOfferFeedbackDone')
)
