import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {
  contactApiForPhoneNumber,
  contactApiForSession,
} from '../../api/contactApiForSession'
import {updateAndReencryptAllConnectionsActionAtom} from '../connections/atom/updateAndReencryptAllConnectionsActionAtom'
import {refreshPhoneNumberOnContactService} from '../refreshUserOnContactServiceInAppBackgroundTask'
import {sessionDataOrDummyAtom} from '../session'
import {
  PhoneNumberNotInAccountError,
  phoneNumbersOfSession,
  removePhoneNumbersFromSession,
} from '../session/sessionPhoneNumbers'
import {dropPhoneNumbersFromSessionActionAtom} from './dropPhoneNumbersFromSessionActionAtom'

/**
 * Removes the number from contact-service and from the session. Removing the
 * main number promotes the first extra one, which then takes over the
 * notification token.
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

      const updatedSession = get(sessionDataOrDummyAtom)
      if (updatedSession.phoneNumber !== session.phoneNumber)
        yield* _(
          refreshPhoneNumberOnContactService({
            session: updatedSession,
            contactApi: contactApiForSession(get, updatedSession),
            isMainPhoneNumber: true,
          }),
          Effect.ignore
        )

      yield* _(set(updateAndReencryptAllConnectionsActionAtom, {}))
    })
)
