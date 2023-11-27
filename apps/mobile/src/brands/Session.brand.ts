import {z} from 'zod'
import {UserNameAndUriAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {UserSessionCredentials} from '@vexl-next/rest-api/dist/UserSessionCredentials.brand'
import {KeyHolder} from '@vexl-next/cryptography'

export const Session = z.object({
  version: z.number().int().min(0),
  realUserData: UserNameAndUriAvatar.optional(),
  phoneNumber: E164PhoneNumber,
  sessionCredentials: UserSessionCredentials,
  privateKey: KeyHolder.PrivateKeyHolder,
})
export type Session = z.TypeOf<typeof Session>
