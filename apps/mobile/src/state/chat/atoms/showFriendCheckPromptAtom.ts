import {Schema} from 'effect/index'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

export const showFriendCheckPromptAtom = focusAtom(
  atomWithParsedMmkvStorage(
    'showFriendCheckPrompt',
    {visible: true},
    Schema.Struct({visible: Schema.Boolean})
  ),
  (o) => o.prop('visible')
)
