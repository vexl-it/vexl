import {z} from 'zod'
import {SvgStringOrImageUri} from '../utility/SvgStringOrImageUri.brand'
import {UserName} from './UserName.brand'
import {UriString} from '../utility/UriString.brand'

export const UserNameAndUriAvatar = z.object({
  userName: UserName,
  image: z.object({
    type: z.literal('imageUri'),
    imageUri: UriString,
  }),
})
export type UserNameAndUriAvatar = z.TypeOf<typeof UserNameAndUriAvatar>

export const UserNameAndAvatar = z.object({
  userName: UserName,
  image: SvgStringOrImageUri,
})
export type UserNameAndAvatar = z.TypeOf<typeof UserNameAndAvatar>
