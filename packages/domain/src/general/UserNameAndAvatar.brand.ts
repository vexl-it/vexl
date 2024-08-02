import {z} from 'zod'
import {SvgStringOrImageUri} from '../utility/SvgStringOrImageUri.brand'
import {UriString} from '../utility/UriString.brand'
import {E164PhoneNumber} from './E164PhoneNumber.brand'
import {UserName} from './UserName.brand'

export const UserNameAndUriAvatar = z
  .object({
    userName: UserName.optional(),
    image: z
      .object({
        type: z.literal('imageUri'),
        imageUri: UriString,
      })
      .optional()
      .readonly(),
  })
  .readonly()
export type UserNameAndUriAvatar = z.TypeOf<typeof UserNameAndUriAvatar>

export const RealLifeInfo = z
  .object({
    userName: UserName,
    image: SvgStringOrImageUri,
    partialPhoneNumber: z.string().optional(),
    fullPhoneNumber: E164PhoneNumber.optional(),
  })
  .readonly()
export type RealLifeInfo = z.TypeOf<typeof RealLifeInfo>
