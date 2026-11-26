import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {contactApiForPhoneNumber} from '../../api/contactApiForSession'
import {updateAndReencryptAllConnectionsActionAtom} from '../connections/atom/updateAndReencryptAllConnectionsActionAtom'
import {sessionDataOrDummyAtom} from '../session'
import {
  PhoneNumberNotInAccountError,
  phoneNumbersOfSession,
  removePhoneNumbersFromSession,
} from '../session/sessionPhoneNumbers'
import {dropPhoneNumbersFromSessionActionAtom} from './dropPhoneNumbersFromSessionActionAtom'

/**
 * Removes an extra number from contact-service and from the session.
 */
export const removePhoneNumberActionAtom = atom(
  null,
  (get, set, phoneNumber: E164PhoneNumber) =>
    Effect.gen(function* (_) {
      const session = get(sessionDataOrDummyAtom)
      // Fails before touching the server when the number can't be removed
      yield* _(removePhoneNumbersFromSession(session, [phoneNumber]))

      const toRemove = yield* _(
        Array.findFirst(
          phoneNumbersOfSession(session),
          (one) => one.phoneNumber === phoneNumber
        ),
        Effect.mapError(() => new PhoneNumberNotInAccountError())
      )
      yield* _(contactApiForPhoneNumber(get, toRemove).deleteUser())

      yield* _(set(dropPhoneNumbersFromSessionActionAtom, [phoneNumber]))

      yield* _(set(updateAndReencryptAllConnectionsActionAtom, {}))
    })
)
