import {KeyHolder} from '@vexl-next/cryptography'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {UserNameAndUriAvatar} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {UserSessionCredentials} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {z} from 'zod'

export const Session = z.object({
  version: z.number().int().min(0),
  realUserData: UserNameAndUriAvatar.optional(),
  phoneNumber: E164PhoneNumber,
  sessionCredentials: UserSessionCredentials,
  privateKey: KeyHolder.PrivateKeyHolder,
})
export type Session = z.TypeOf<typeof Session>
