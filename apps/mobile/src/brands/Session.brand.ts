import {Schema} from '@effect/schema'
import {KeyHolder} from '@vexl-next/cryptography'
import {
  E164PhoneNumber,
  E164PhoneNumberE,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  UserNameAndUriAvatar,
  UserNameAndUriAvatarE,
} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  UserSessionCredentials,
  UserSessionCredentialsE,
} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {z} from 'zod'

export const Session = z
  .object({
    version: z.number().int().min(0),
    realUserData: UserNameAndUriAvatar.optional(),
    phoneNumber: E164PhoneNumber,
    sessionCredentials: UserSessionCredentials,
    privateKey: KeyHolder.PrivateKeyHolder,
  })
  .readonly()

export const SessionE = Schema.Struct({
  version: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  realUserData: Schema.optional(UserNameAndUriAvatarE),
  phoneNumber: E164PhoneNumberE,
  sessionCredentials: UserSessionCredentialsE,
  privateKey: KeyHolder.PrivateKeyHolderE,
})
export type Session = Schema.Schema.Type<typeof SessionE>
