import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {z} from 'zod'
import {MessagingState} from '../domain'
import {focusAtom} from 'jotai-optics'
import {SemverString} from '@vexl-next/domain/dist/utility/SmeverString.brand'

export const messagingStateAtomStorageAtom = atomWithParsedMmkvStorage(
  'messagingState',
  {messagingState: [], lastDecodedSemver: undefined},
  z.object({
    messagingState: MessagingState,
    lastDecodedSemver: SemverString.optional(),
  })
)

const messagingStateAtom = focusAtom(messagingStateAtomStorageAtom, (o) =>
  o.prop('messagingState')
)
export default messagingStateAtom

export const lastDecodedSemverAtom = focusAtom(
  messagingStateAtomStorageAtom,
  (o) => o.prop('lastDecodedSemver')
)
