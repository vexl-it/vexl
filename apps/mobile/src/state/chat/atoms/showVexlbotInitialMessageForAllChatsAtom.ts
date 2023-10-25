import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {z} from 'zod'
import {focusAtom} from 'jotai-optics'

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
