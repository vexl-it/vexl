import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {phoneNumberApisAtom} from '../../api/contactApiForSession'
import {updateAndReencryptAllConnectionsActionAtom} from '../connections/atom/updateAndReencryptAllConnectionsActionAtom'
import {sessionDataOrDummyAtom} from '../session'
import {
  PhoneNumberNotInAccountError,
  removePhoneNumbersFromSession,
} from '../session/sessionPhoneNumbers'
import {dropPhoneNumbersFromSessionActionAtom} from './dropPhoneNumbersFromSessionActionAtom'

/**
 * Removes an extra number from contact-service, user-service and the session.
 * The main number carries the account key and can't be removed.
 */
export const removePhoneNumberActionAtom = atom(
  null,
  (get, set, phoneNumber: E164PhoneNumber) =>
    Effect.gen(function* (_) {
      // Fails before touching the server when the number can't be removed
      yield* _(
        removePhoneNumbersFromSession(get(sessionDataOrDummyAtom), [
          phoneNumber,
        ])
      )

      const {contactApi, userApi} = yield* _(
        Array.findFirst(
          get(phoneNumberApisAtom),
          (one) => one.phoneNumber.phoneNumber === phoneNumber
        ),
        Effect.mapError(() => new PhoneNumberNotInAccountError())
      )
      // user-service keeps one row per key, this one is the number's own. It
      // goes first: deleting it again on a retry is harmless, while the
      // number's refresh fails once its contact-service row is gone.
      yield* _(
        userApi.deleteUser(),
        Effect.zipRight(contactApi.deleteUser())
      )

      yield* _(set(dropPhoneNumbersFromSessionActionAtom, [phoneNumber]))
      yield* _(set(updateAndReencryptAllConnectionsActionAtom, {}))
    })
)
