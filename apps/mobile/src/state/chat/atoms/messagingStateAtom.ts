import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {MessagingState} from '../domain'

export const messagingStateAtomStorageAtom = atomWithParsedMmkvStorage(
  'messagingState',
  {messagingState: [], lastDecodedSemver: undefined},
  z
    .object({
      messagingState: MessagingState,
      lastDecodedSemver: SemverString.optional(),
    })
    .readonly()
)

const messagingStateAtom = focusAtom(messagingStateAtomStorageAtom, (o) =>
  o.prop('messagingState')
)
export default messagingStateAtom

export const inboxesAtom = focusAtom(messagingStateAtom, (optic) =>
  optic.elems().prop('inbox')
)

export const lastDecodedSemverAtom = focusAtom(
  messagingStateAtomStorageAtom,
  (o) => o.prop('lastDecodedSemver')
)
