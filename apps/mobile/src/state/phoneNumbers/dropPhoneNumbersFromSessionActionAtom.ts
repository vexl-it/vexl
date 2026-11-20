import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Either} from 'effect'
import {atom} from 'jotai'
import {needsFullContactsReplaceAfterContactEditAtom} from '../contacts/atom/contactsStore'
import {sessionDataOrDummyAtom} from '../session'
import {
  removePhoneNumbersFromSession,
  type CannotRemoveLastPhoneNumberError,
  type PhoneNumberNotInAccountError,
} from '../session/sessionPhoneNumbers'

export const dropPhoneNumbersFromSessionActionAtom = atom(
  null,
  (
    get,
    set,
    phoneNumbers: readonly E164PhoneNumber[]
  ): Either.Either<
    void,
    PhoneNumberNotInAccountError | CannotRemoveLastPhoneNumberError
  > =>
    Either.map(
      removePhoneNumbersFromSession(get(sessionDataOrDummyAtom), phoneNumbers),
      (session) => {
        set(sessionDataOrDummyAtom, session)
        // Imports skip own numbers. A dropped number may be an ordinary contact
        // now, so the next import sends the full list again.
        set(needsFullContactsReplaceAfterContactEditAtom, true)
      }
    )
)
