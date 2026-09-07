import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {optionalNullable} from '@vexl-next/generic-utils/src/effect-helpers/optionalNullable'
import {Schema} from 'effect'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {MessagingState} from '../domain'

export const messagingStateAtomStorageAtom = atomWithParsedMmkvStorage(
  'messagingState',
  {messagingState: [], lastDecodedSemver: undefined},
  Schema.Struct({
    messagingState: MessagingState.pipe(Schema.mutable),
    lastDecodedSemver: optionalNullable(VersionString),
  })
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
