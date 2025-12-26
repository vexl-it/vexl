import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  UnixMilliseconds,
  UnixMilliseconds0,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Schema} from 'effect/index'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {DateTime} from 'luxon'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'

const CAN_LOGIN_AGAIN_AFTER_MILLIS = 1000 * 60 // 1 day

const LoginAttemptsDataStored = Schema.Struct({
  data: Schema.Struct({
    phoneNumbers: Schema.Array(E164PhoneNumber),
    timestamp: UnixMilliseconds,
  }),
})
type LoginAttemptsDataStored = typeof LoginAttemptsDataStored.Type

const loginAttemptsPhoneNumbersMmkvAtom = atomWithParsedMmkvStorage(
  'numberOfLoginAttempts',
  {data: {phoneNumbers: [], timestamp: UnixMilliseconds0}},
  LoginAttemptsDataStored
)

export const loginAttemptsPhoneNumbersAtom = focusAtom(
  loginAttemptsPhoneNumbersMmkvAtom,
  (p) => p.prop('data').prop('phoneNumbers')
)

export const loginAttemptsTimestampAtom = focusAtom(
  loginAttemptsPhoneNumbersMmkvAtom,
  (p) => p.prop('data').prop('timestamp')
)

export const allowLoginAgainAtom = atom(
  (get) => Array.length(get(loginAttemptsPhoneNumbersAtom)) < 4
)

export const updateNumberOfLoginAttemptsActionAtom = atom(
  null,
  (get, set, phoneNumber: E164PhoneNumber) => {
    const loginAttemptsTimestamp = get(loginAttemptsTimestampAtom)

    if (
      loginAttemptsTimestamp + CAN_LOGIN_AGAIN_AFTER_MILLIS <
      DateTime.now().toMillis()
    ) {
      set(loginAttemptsPhoneNumbersAtom, [])
      set(
        loginAttemptsTimestampAtom,
        Schema.decodeSync(UnixMilliseconds)(DateTime.now().toMillis())
      )
    }

    const currentPhoneNumbers = get(loginAttemptsPhoneNumbersAtom)
    if (!currentPhoneNumbers.includes(phoneNumber)) {
      set(loginAttemptsPhoneNumbersAtom, [...currentPhoneNumbers, phoneNumber])
      set(
        loginAttemptsTimestampAtom,
        Schema.decodeSync(UnixMilliseconds)(DateTime.now().toMillis())
      )
    }
  }
)
