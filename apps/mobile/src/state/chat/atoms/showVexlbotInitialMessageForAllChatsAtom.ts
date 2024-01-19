import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

export const showVexlbotInitialMessageForAllChatsStorageAtom =
  atomWithParsedMmkvStorage(
    'showVexlbotInitialMessageForAllChats',
    {visible: true},
    z.object({visible: z.boolean().default(true)})
  )

export const showVexlbotInitialMessageForAllChatsAtom = focusAtom(
  showVexlbotInitialMessageForAllChatsStorageAtom,
  (o) => o.prop('visible')
)
