import {KeyHolder} from '@vexl-next/cryptography'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {UserNameAndUriAvatar} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {UserSessionCredentials} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {Schema} from 'effect'

export const Session = Schema.Struct({
  version: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  realUserData: Schema.optional(UserNameAndUriAvatar),
  phoneNumber: E164PhoneNumber,
  sessionCredentials: UserSessionCredentials,
  sessionNotificationToken: Schema.optional(VexlNotificationToken),
  privateKey: KeyHolder.PrivateKeyHolder,
})
export type Session = typeof Session.Type
