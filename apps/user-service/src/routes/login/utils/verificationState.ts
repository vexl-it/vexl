import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {SmsVerificationSid} from '../../../utils/SmsVerificationSid.brand'

export const ChallengeVerificationState = Schema.Struct({
  phoneNumber: E164PhoneNumber,
  expiresAt: UnixMilliseconds,
})

export type ChallengeVerificationState = typeof ChallengeVerificationState.Type

export const PhoneVerificationState = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('twilioSmsVerification'),
    sid: SmsVerificationSid,
    phoneNumber: E164PhoneNumber,
    expiresAt: UnixMilliseconds,
  }),
  Schema.Struct({
    type: Schema.Literal('staticCodeVerification'),
    code: Schema.String,
    phoneNumber: E164PhoneNumber,
    expiresAt: UnixMilliseconds,
  })
)

export type PhoneVerificationState = typeof PhoneVerificationState.Type
