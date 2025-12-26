import {Schema} from 'effect/index'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

export const showVexlbotInitialMessageForAllChatsStorageAtom =
  atomWithParsedMmkvStorage(
    'showVexlbotInitialMessageForAllChats',
    {visible: true},
    Schema.Struct({visible: Schema.Boolean})
  )

export const showVexlbotInitialMessageForAllChatsAtom = focusAtom(
  showVexlbotInitialMessageForAllChatsStorageAtom,
  (o) => o.prop('visible')
)
