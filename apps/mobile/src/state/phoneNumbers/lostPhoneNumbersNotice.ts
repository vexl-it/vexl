import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Schema} from 'effect'
import {atom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'

/**
 * Numbers dropped from the account because someone logged in with them on
 * another device. Persisted until the user dismisses the notice.
 */
export const lostPhoneNumbersNoticeAtom = atomWithParsedMmkvStorage(
  'lostPhoneNumbersNotice',
  {phoneNumbers: []},
  Schema.Struct({phoneNumbers: Schema.Array(E164PhoneNumber)})
)

export const addLostPhoneNumbersToNoticeActionAtom = atom(
  null,
  (_get, set, lost: readonly E164PhoneNumber[]) => {
    set(lostPhoneNumbersNoticeAtom, (prev) => ({
      phoneNumbers: Array.dedupe([...prev.phoneNumbers, ...lost]),
    }))
  }
)

export const dismissLostPhoneNumbersNoticeActionAtom = atom(
  null,
  (_get, set) => {
    set(lostPhoneNumbersNoticeAtom, {phoneNumbers: []})
  }
)
