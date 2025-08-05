import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {SmsVerificationSid} from '../../../utils/SmsVerificationSid.brand'

export const ChallengeVerificationState = Schema.Struct({
  phoneNumber: E164PhoneNumberE,
  expiresAt: UnixMillisecondsE,
})

export type ChallengeVerificationState = typeof ChallengeVerificationState.Type

export const PhoneVerificationState = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('twilioSmsVerification'),
    sid: SmsVerificationSid,
    phoneNumber: E164PhoneNumberE,
    expiresAt: UnixMillisecondsE,
  }),
  Schema.Struct({
    type: Schema.Literal('staticCodeVerification'),
    code: Schema.String,
    phoneNumber: E164PhoneNumberE,
    expiresAt: UnixMillisecondsE,
  })
)

export type PhoneVerificationState = typeof PhoneVerificationState.Type
