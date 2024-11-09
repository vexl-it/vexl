import {Schema} from 'effect'
import {z} from 'zod'
import {
  SvgStringOrImageUri,
  SvgStringOrImageUriE,
} from '../utility/SvgStringOrImageUri.brand'
import {UriString, UriStringE} from '../utility/UriString.brand'
import {E164PhoneNumber, E164PhoneNumberE} from './E164PhoneNumber.brand'
import {UserName, UserNameE} from './UserName.brand'

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

export const UserNameAndUriAvatarE = Schema.Struct({
  userName: Schema.optional(UserNameE),
  image: Schema.optional(
    Schema.Struct({
      type: Schema.Literal('imageUri'),
      imageUri: UriStringE,
    })
  ),
})
export type UserNameAndUriAvatar = Schema.Schema.Type<
  typeof UserNameAndUriAvatarE
>

export const RealLifeInfo = z
  .object({
    userName: UserName,
    image: SvgStringOrImageUri,
    partialPhoneNumber: z.string().optional(),
    fullPhoneNumber: E164PhoneNumber.optional(),
  })
  .readonly()

export const RealLifeInfoE = Schema.Struct({
  userName: UserNameE,
  image: SvgStringOrImageUriE,
  partialPhoneNumber: Schema.optional(Schema.String),
  fullPhoneNumber: Schema.optional(E164PhoneNumberE),
})
export type RealLifeInfo = Schema.Schema.Type<typeof RealLifeInfoE>
