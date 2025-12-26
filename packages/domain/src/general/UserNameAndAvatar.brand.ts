import {Schema} from 'effect'
import {SvgStringOrImageUri} from '../utility/SvgStringOrImageUri.brand'
import {UriString} from '../utility/UriString.brand'
import {E164PhoneNumber} from './E164PhoneNumber.brand'
import {UserName} from './UserName.brand'

export const UserNameAndUriAvatar = Schema.Struct({
  userName: Schema.optional(UserName),
  image: Schema.optional(
    Schema.Struct({
      type: Schema.Literal('imageUri'),
      imageUri: UriString,
    })
  ),
})
export type UserNameAndUriAvatar = typeof UserNameAndUriAvatar.Type

export const RealLifeInfo = Schema.Struct({
  userName: UserName,
  image: SvgStringOrImageUri,
  partialPhoneNumber: Schema.optional(Schema.String),
  fullPhoneNumber: Schema.optional(E164PhoneNumber),
})
export type RealLifeInfo = typeof RealLifeInfo.Type
