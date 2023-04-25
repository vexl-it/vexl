import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {z} from 'zod'
import {MessagingState} from '../domain'
import {focusAtom} from 'jotai-optics'

const messagingStateAtomStorageAtom = atomWithParsedMmkvStorage(
  'messagingState',
  {messagingState: []},
  z.object({messagingState: MessagingState}),
  'newOne'
)

const messagingStateAtom = focusAtom(messagingStateAtomStorageAtom, (o) =>
  o.prop('messagingState')
)
export default messagingStateAtom
